'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

/* ── Types matching actual API response ── */
interface SummaryData {
  headcount: { total: number; assigned: number; standby: number; vacation: number };
  by_workarea: { workarea__name_en: string; count: number; own: number; local_hire: number; rental: number }[];
  by_type: { employee_type__name_en: string; count: number }[];
  by_sponsor: { sponsor__name_en: string; count: number }[];
  by_nationality: { nationality__name_en: string; count: number }[];
  by_category: { assigned_category__name_en: string; count: number }[];
  leave_stats: { pending: number; approved_this_month: number };
  asset_stats: { total: number; assigned: number; idle: number };
  asset_by_workarea: { workarea__name_en: string; count: number }[];
}

const COLORS = ['#16A34A', '#2563EB', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#0D9488'];

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

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
    color: '#fff', padding: '20px 20px 32px', borderRadius: '0 0 28px 28px',
  };
  const kpiCardStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16,
    padding: '16px 14px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', flex: '1 1 0', minWidth: 0,
  };
  const sectionStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16,
    padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#16A34A', borderRadius: '50%', margin: '0 auto 12px' }} />
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
        <button onClick={() => { setLoading(true); fetchData(); }} style={{ padding: '10px 24px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{t('common.retry')}</button>
      </div>
    );
  }

  const d = data!;
  const hc = d.headcount;
  const wa = d.by_workarea || [];
  const types = d.by_type || [];
  const sponsors = d.by_sponsor || [];
  const assets = d.asset_stats;
  const totalWaCount = wa.reduce((a, b) => a + b.count, 0) || 1;
  const maxWa = Math.max(...wa.map(w => w.count), 1);
  const maxType = Math.max(...types.map(e => e.count), 1);
  const maxSponsor = Math.max(...sponsors.map(s => s.count), 1);

  return (
    <div>
      {/* Header */}
      <header style={headerStyle} className="safe-top">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{t('dashboard.managementPortal')}</span>
              <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#BBF7D0', display: 'inline-block' }} />
                {t('common.live')}
              </span>
            </div>
            <span style={{ fontSize: 14, opacity: 0.9 }}>{getGreeting(t)}, {userName || user?.first_name || ''}</span>
          </div>
        </div>
        {lastUpdated && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>{lastUpdated.toLocaleTimeString()}</div>}
      </header>

      {/* KPI Cards */}
      <div style={{ padding: '0 16px', marginTop: -16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: t('dashboard.totalEmployees'), value: hc.total, color: '#1E293B', bg: '#F0FDF4' },
            { label: t('dashboard.assigned'), value: hc.assigned, color: '#16A34A', bg: '#F0FDF4' },
            { label: t('dashboard.standby'), value: hc.standby, color: '#D97706', bg: '#FFFBEB' },
            { label: t('dashboard.vacation'), value: hc.vacation, color: '#2563EB', bg: '#EFF6FF' },
          ].map((kpi, i) => (
            <div key={i} style={{ ...kpiCardStyle, background: kpi.bg }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value ?? 0}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#64748B', marginTop: 4, lineHeight: 1.2 }}>{kpi.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Assignment - Donut + Bars */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>{t('dashboard.employeeAssignment')}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', flexShrink: 0, position: 'relative',
              background: wa.length > 0
                ? `conic-gradient(${wa.map((w, i) => {
                    const start = wa.slice(0, i).reduce((a, b) => a + b.count, 0) / totalWaCount * 360;
                    const end = wa.slice(0, i + 1).reduce((a, b) => a + b.count, 0) / totalWaCount * 360;
                    return `${COLORS[i % COLORS.length]} ${start}deg ${end}deg`;
                  }).join(', ')})`
                : '#E2E8F0',
            }}>
              <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#1E293B' }}>
                {hc.total}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {wa.slice(0, 6).map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#64748B', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.workarea__name_en || 'N/A'}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{w.count}</span>
                </div>
              ))}
            </div>
          </div>
          {wa.map((w, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#64748B', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.workarea__name_en || 'N/A'}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{w.count}</span>
              </div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(w.count / maxWa) * 100}%`, background: COLORS[i % COLORS.length], borderRadius: 4, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Assignment */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>{t('dashboard.assetAssignment')}</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: t('dashboard.totalAssets'), value: assets?.total ?? 0, color: '#1E293B' },
              { label: t('dashboard.assignedAssets'), value: assets?.assigned ?? 0, color: '#16A34A' },
              { label: t('dashboard.idleAssets'), value: assets?.idle ?? 0, color: '#D97706' },
            ].map((kpi, i) => (
              <div key={i} style={{ flex: '1 1 0', textAlign: 'center', padding: 12, background: '#F8FAFC', borderRadius: 12 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* By Employee Type */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>{t('dashboard.byEmployeeType')}</h3>
          {types.map((item, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: '#64748B' }}>{item.employee_type__name_en || 'N/A'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{item.count} <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>{t('dashboard.employees')}</span></span>
              </div>
              <div style={{ height: 10, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(item.count / maxType) * 100}%`, background: 'linear-gradient(90deg, #16A34A, #22D3EE)', borderRadius: 5, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
          {types.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: 20 }}>{t('common.noData')}</p>}
        </div>
      </div>

      {/* By Sponsor */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>{t('dashboard.bySponsor')}</h3>
          {sponsors.map((item, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: '#64748B' }}>{item.sponsor__name_en || 'N/A'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{item.count} <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>{t('dashboard.employees')}</span></span>
              </div>
              <div style={{ height: 10, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(item.count / maxSponsor) * 100}%`, background: 'linear-gradient(90deg, #7C3AED, #DB2777)', borderRadius: 5, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
          {sponsors.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: 20 }}>{t('common.noData')}</p>}
        </div>
      </div>

      {/* Leave Stats */}
      <div style={{ padding: '16px 16px 20px' }}>
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>{t('dashboard.leaveStats')}</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: '1 1 0', textAlign: 'center', padding: 14, background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706' }}>{d.leave_stats?.pending ?? 0}</div>
              <div style={{ fontSize: 11, color: '#92400E', marginTop: 4, fontWeight: 600 }}>{t('dashboard.pendingLeaves')}</div>
            </div>
            <div style={{ flex: '1 1 0', textAlign: 'center', padding: 14, background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A' }}>{d.leave_stats?.approved_this_month ?? 0}</div>
              <div style={{ fontSize: 11, color: '#166534', marginTop: 4, fontWeight: 600 }}>{t('dashboard.approvedThisMonth')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
