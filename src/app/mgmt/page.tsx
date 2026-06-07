'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

/* ── Types ── */
interface SummaryData {
  total_employees: number;
  assigned_count: number;
  standby_count: number;
  vacation_count: number;
  workarea_breakdown: { workarea: string; count: number }[];
  total_assets: number;
  assigned_assets: number;
  idle_assets: number;
  by_employee_type: { type: string; count: number }[];
  by_sponsor: { sponsor: string; count: number }[];
  expiry_alerts: {
    expired: number;
    critical_30: number;
    warning_60: number;
    safe_90: number;
  };
}

/* ── Helpers ── */
const COLORS = ['#16A34A', '#2563EB', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#DB2777', '#65A30D'];

function getGreeting(t: (key: string) => string): string {
  const h = new Date().getHours();
  if (h < 12) return t('home.greetingMorning');
  if (h < 17) return t('home.greetingAfternoon');
  return t('home.greetingEvening');
}

export default function MgmtDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<SummaryData | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, meRes] = await Promise.all([
        api.get('/hr/api/v1/management/summary/'),
        api.get('/hr/api/v1/me/'),
      ]);
      setData(summaryRes.data);
      setUserName(meRes.data.first_name || meRes.data.employee_code || '');
      setLastUpdated(new Date());
      setError('');
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* ── Styles ── */
  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
    color: '#fff',
    padding: '20px 20px 32px',
    borderRadius: '0 0 28px 28px',
    position: 'relative',
  };

  const kpiCardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    padding: '16px 14px',
    textAlign: 'center' as const,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    flex: '1 1 0',
    minWidth: 0,
  };

  const sectionStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            className="animate-spin"
            style={{
              width: 36,
              height: 36,
              border: '3px solid #E2E8F0',
              borderTopColor: '#16A34A',
              borderRadius: '50%',
              margin: '0 auto 12px',
            }}
          />
          <span style={{ color: '#64748B', fontSize: 14 }}>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <span style={{ fontSize: 48 }}>⚠️</span>
        <span style={{ color: '#64748B', fontSize: 14 }}>{error}</span>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          style={{
            padding: '10px 24px',
            background: '#16A34A',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  const d = data!;
  const maxWorkarea = Math.max(...(d.workarea_breakdown || []).map((w) => w.count), 1);
  const maxType = Math.max(...(d.by_employee_type || []).map((e) => e.count), 1);
  const maxSponsor = Math.max(...(d.by_sponsor || []).map((s) => s.count), 1);
  const totalWorkareaCount = (d.workarea_breakdown || []).reduce((a, b) => a + b.count, 0) || 1;

  return (
    <div>
      {/* ── Header ── */}
      <header style={headerStyle} className="safe-top">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{t('dashboard.managementPortal')}</span>
              <span
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  color: '#fff',
                  padding: '2px 10px',
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#BBF7D0', display: 'inline-block' }} />
                {t('common.live')}
              </span>
            </div>
            <span style={{ fontSize: 14, opacity: 0.9 }}>
              {getGreeting(t)}, {userName || user?.first_name || ''}
            </span>
          </div>
        </div>
        {lastUpdated && (
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>
            {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </header>

      {/* ── KPI Cards ── */}
      <div style={{ padding: '0 16px', marginTop: -16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: t('dashboard.totalEmployees'), value: d.total_employees, color: '#1E293B', bg: '#F0FDF4' },
            { label: t('dashboard.assigned'), value: d.assigned_count, color: '#16A34A', bg: '#F0FDF4' },
            { label: t('dashboard.standby'), value: d.standby_count, color: '#D97706', bg: '#FFFBEB' },
            { label: t('dashboard.vacation'), value: d.vacation_count, color: '#2563EB', bg: '#EFF6FF' },
          ].map((kpi, i) => (
            <div key={i} style={{ ...kpiCardStyle, background: kpi.bg }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#64748B', marginTop: 4, lineHeight: 1.2 }}>{kpi.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Employee Assignment ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>
            {t('dashboard.employeeAssignment')}
          </h3>

          {/* Donut-like visualization */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: `conic-gradient(${(d.workarea_breakdown || [])
                  .map((w, i) => {
                    const start = (d.workarea_breakdown || []).slice(0, i).reduce((a, b) => a + b.count, 0) / totalWorkareaCount * 360;
                    const end = (d.workarea_breakdown || []).slice(0, i + 1).reduce((a, b) => a + b.count, 0) / totalWorkareaCount * 360;
                    return `${COLORS[i % COLORS.length]} ${start}deg ${end}deg`;
                  })
                  .join(', ') || '#E2E8F0 0deg 360deg'})`,
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#1E293B',
                }}
              >
                {d.total_employees}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {(d.workarea_breakdown || []).slice(0, 6).map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#64748B', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.workarea || 'N/A'}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{w.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Horizontal bars */}
          {(d.workarea_breakdown || []).map((w, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#64748B', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.workarea || 'N/A'}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{w.count}</span>
              </div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(w.count / maxWorkarea) * 100}%`,
                    background: COLORS[i % COLORS.length],
                    borderRadius: 4,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Asset Assignment ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>
            {t('dashboard.assetAssignment')}
          </h3>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: t('dashboard.totalAssets'), value: d.total_assets, color: '#1E293B' },
              { label: t('dashboard.assignedAssets'), value: d.assigned_assets, color: '#16A34A' },
              { label: t('dashboard.idleAssets'), value: d.idle_assets, color: '#D97706' },
            ].map((kpi, i) => (
              <div key={i} style={{ flex: '1 1 0', textAlign: 'center', padding: 12, background: '#F8FAFC', borderRadius: 12 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── By Employee Type ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>
            {t('dashboard.byEmployeeType')}
          </h3>
          {(d.by_employee_type || []).map((item, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: '#64748B' }}>{item.type || 'N/A'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                  {item.count} <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>{t('dashboard.employees')}</span>
                </span>
              </div>
              <div style={{ height: 10, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(item.count / maxType) * 100}%`,
                    background: 'linear-gradient(90deg, #16A34A, #22D3EE)',
                    borderRadius: 5,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          ))}
          {(d.by_employee_type || []).length === 0 && (
            <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: 20 }}>{t('common.noData')}</p>
          )}
        </div>
      </div>

      {/* ── By Sponsor ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>
            {t('dashboard.bySponsor')}
          </h3>
          {(d.by_sponsor || []).map((item, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: '#64748B' }}>{item.sponsor || 'N/A'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                  {item.count} <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>{t('dashboard.employees')}</span>
                </span>
              </div>
              <div style={{ height: 10, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(item.count / maxSponsor) * 100}%`,
                    background: 'linear-gradient(90deg, #7C3AED, #DB2777)',
                    borderRadius: 5,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          ))}
          {(d.by_sponsor || []).length === 0 && (
            <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: 20 }}>{t('common.noData')}</p>
          )}
        </div>
      </div>

      {/* ── Expiry Alerts ── */}
      <div style={{ padding: '16px 16px 20px' }}>
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>
            {t('expiry.title')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: t('expiry.expired'), value: d.expiry_alerts?.expired ?? 0, color: '#DC2626', bg: '#FEF2F2', icon: '🔴' },
              { label: t('expiry.critical'), value: d.expiry_alerts?.critical_30 ?? 0, color: '#D97706', bg: '#FFFBEB', icon: '🟠' },
              { label: t('expiry.warning'), value: d.expiry_alerts?.warning_60 ?? 0, color: '#2563EB', bg: '#EFF6FF', icon: '🔵' },
              { label: t('expiry.safe'), value: d.expiry_alerts?.safe_90 ?? 0, color: '#16A34A', bg: '#F0FDF4', icon: '🟢' },
            ].map((alert, i) => (
              <div
                key={i}
                style={{
                  background: alert.bg,
                  border: '1px solid #E2E8F0',
                  borderRadius: 14,
                  padding: '14px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 20 }}>{alert.icon}</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: alert.color }}>{alert.value}</div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{alert.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
