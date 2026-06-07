'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';

const PRIMARY = '#16A34A';
const BG = '#F1F5F9';

const DONUT_COLORS = [
  '#6366F1', '#06B6D4', '#8B5CF6', '#F59E0B', '#10B981',
  '#EF4444', '#EC4899', '#14B8A6', '#F97316', '#3B82F6',
  '#A855F7', '#64748B', '#84CC16', '#0EA5E9',
];

const TYPE_COLORS: Record<string, string> = {
  'OWN': '#3B82F6',
  'LOCAL HIRE': '#14B8A6',
  'RENTAL': '#F97316',
};

/* ── Interfaces ─────────────────────────────────────────────── */
interface WorkareaItem {
  workarea__name_en: string;
  count: number;
  own?: number;
  local_hire?: number;
  rental?: number;
}
interface TypeItem { employee_type__name_en: string; count: number; }
interface SponsorItem { sponsor__name_en: string; count: number; }
interface AssetWaItem { workarea__name_en: string; count: number; }
interface SummaryData {
  headcount: { total: number; assigned: number; standby: number; vacation: number };
  by_workarea: WorkareaItem[];
  by_type: TypeItem[];
  by_sponsor: SponsorItem[];
  asset_stats: { total: number; assigned: number; idle: number };
  asset_by_workarea: AssetWaItem[];
  leave_stats: { pending: number; approved_this_month: number };
}
interface EmpDrillRow {
  id?: number;
  employee_code: string;
  employee_name: string;
  equipment?: string;
  emp_assigned_category?: string;
  assigned_category?: string;
  employee_type?: string;
  workarea?: string;
}
interface AssetDrillRow {
  id?: number;
  equipment_number: string;
  equipment_brand?: string;
  equipment_model?: string;
  workarea_name?: string;
  employee_code?: string;
  employee_name?: string;
  status?: string;
}

/* ── CSS Conic-Gradient Donut ─────────────────────────────────── */
function DonutChart({ data, size = 220 }: { data: { label: string; count: number }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <p style={{ color: '#94A3B8', textAlign: 'center', padding: '24px 0' }}>No data</p>;

  const segments: string[] = [];
  let cumPct = 0;
  data.forEach((item, i) => {
    const pct = (item.count / total) * 100;
    const color = DONUT_COLORS[i % DONUT_COLORS.length];
    segments.push(`${color} ${cumPct}% ${cumPct + pct}%`);
    cumPct += pct;
  });

  const strokeWidth = 28;
  const outerR = size / 2;
  const innerR = outerR - strokeWidth;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: `conic-gradient(${segments.join(', ')})`,
          }}
        />
        {/* Inner white circle to create donut */}
        <div
          style={{
            position: 'absolute',
            top: strokeWidth,
            left: strokeWidth,
            width: innerR * 2,
            height: innerR * 2,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <span style={{ color: '#1E293B', fontSize: 28, fontWeight: 800 }}>{total}</span>
          <span style={{ color: '#94A3B8', fontSize: 11, fontWeight: 600 }}>TOTAL</span>
        </div>
      </div>
    </div>
  );
}

/* ── Legend Item ───────────────────────────────────────────── */
function LegendItem({ color, label, count, total }: { color: string; label: string; count: number; total: number }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0' }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color, marginRight: 10, flexShrink: 0 }} />
      <span style={{ color: '#1E293B', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label || 'Other'}</span>
      <span style={{ color: '#64748B', fontSize: 11, marginRight: 8 }}>{pct}%</span>
      <span style={{ color: '#1E293B', fontSize: 13, fontWeight: 800, minWidth: 36, textAlign: 'right' }}>{count}</span>
    </div>
  );
}

/* ── Sort Header ──────────────────────────────────────────── */
function SortHeader({ label, field, sortField, sortDir, onSort }: {
  label: string; field: string; sortField: string; sortDir: string; onSort: (f: string) => void;
}) {
  const active = sortField === field;
  return (
    <button
      onClick={() => onSort(field)}
      style={{
        display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none',
        cursor: 'pointer', padding: 0, fontFamily: 'inherit',
      }}
    >
      <span style={{ color: active ? '#4F46E5' : '#64748B', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ color: active ? '#4F46E5' : '#CBD5E1', fontSize: 9 }}>
        {active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </button>
  );
}

/* ── KPI Card ─────────────────────────────────────────────── */
function KPI({ emoji, title, value, color, bg, onPress }: {
  emoji: string; title: string; value: number; color: string; bg: string; onPress?: () => void;
}) {
  return (
    <div
      onClick={onPress}
      style={{
        flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 14, minHeight: 90,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)', cursor: onPress ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12 }}>{emoji}</span>
        </div>
        <span style={{ color: '#64748B', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>{title}</span>
      </div>
      <span style={{ color, fontSize: 28, fontWeight: 800, marginTop: 4 }}>{value}</span>
    </div>
  );
}

/* ── Bar Chart ────────────────────────────────────────────── */
function Bar({ label, count, max, color = '#4F46E5' }: { label: string; count: number; max: number; color?: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ color: '#1E293B', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label || 'Other'}</span>
        <span style={{ color, fontSize: 13, fontWeight: 800 }}>{count}</span>
      </div>
      <div style={{ height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: 8, width: `${Math.max(pct, 3)}%`, backgroundColor: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

/* ── Stacked Bar ──────────────────────────────────────────── */
function StackedBar({ label, own = 0, local_hire = 0, rental = 0, total, max, onPress }: {
  label: string; own?: number; local_hire?: number; rental?: number; total: number; max: number; onPress?: () => void;
}) {
  const fullPct = max > 0 ? (total / max) * 100 : 0;
  const ownPct = total > 0 ? (own / total) * 100 : 0;
  const lhPct = total > 0 ? (local_hire / total) * 100 : 0;
  const rentalPct = total > 0 ? (rental / total) * 100 : 0;
  return (
    <div onClick={onPress} style={{ marginBottom: 14, cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ color: '#1E293B', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label || 'Other'}</span>
        <span style={{ color: '#1E293B', fontSize: 13, fontWeight: 800 }}>{total}</span>
      </div>
      <div style={{ height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
        {own > 0 && <div style={{ height: 10, width: `${ownPct * fullPct / 100}%`, backgroundColor: '#3B82F6' }} />}
        {local_hire > 0 && <div style={{ height: 10, width: `${lhPct * fullPct / 100}%`, backgroundColor: '#14B8A6' }} />}
        {rental > 0 && <div style={{ height: 10, width: `${rentalPct * fullPct / 100}%`, backgroundColor: '#F97316' }} />}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        {own > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: 2, backgroundColor: '#3B82F6' }} /><span style={{ color: '#94A3B8', fontSize: 9 }}>Own {own}</span></div>}
        {local_hire > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: 2, backgroundColor: '#14B8A6' }} /><span style={{ color: '#94A3B8', fontSize: 9 }}>LH {local_hire}</span></div>}
        {rental > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}><div style={{ width: 6, height: 6, borderRadius: 2, backgroundColor: '#F97316' }} /><span style={{ color: '#94A3B8', fontSize: 9 }}>Rental {rental}</span></div>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ██  MANAGEMENT DASHBOARD
   ══════════════════════════════════════════════════════════════ */
export default function MgmtDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showWorkareaDetail, setShowWorkareaDetail] = useState(false);
  const [showAssetDetail, setShowAssetDetail] = useState(false);
  const [userName, setUserName] = useState('');
  const [pulseOpacity, setPulseOpacity] = useState(1);

  // Employee drill-down state
  const [empDrillModal, setEmpDrillModal] = useState(false);
  const [empDrillWa, setEmpDrillWa] = useState<string | null>(null);
  const [empDrillData, setEmpDrillData] = useState<EmpDrillRow[]>([]);
  const [empDrillLoading, setEmpDrillLoading] = useState(false);
  const [empDrillSort, setEmpDrillSort] = useState('employee_code');
  const [empDrillDir, setEmpDrillDir] = useState('asc');

  // Asset drill-down state
  const [assetDrillModal, setAssetDrillModal] = useState(false);
  const [assetDrillWa, setAssetDrillWa] = useState<string | null>(null);
  const [assetDrillData, setAssetDrillData] = useState<AssetDrillRow[]>([]);
  const [assetDrillLoading, setAssetDrillLoading] = useState(false);
  const [assetDrillSort, setAssetDrillSort] = useState('equipment_number');
  const [assetDrillDir, setAssetDrillDir] = useState('asc');

  const refreshRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const pulseRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Fetch user name
  useEffect(() => {
    api.get('/hr/api/v1/me/').then(r => {
      const u = r.data;
      setUserName(`${u.first_name || ''} ${u.last_name || ''}`.trim());
    }).catch(() => {});
  }, []);

  // Pulse animation
  useEffect(() => {
    let dir = -1;
    let val = 1;
    pulseRef.current = setInterval(() => {
      val += dir * 0.05;
      if (val <= 0.4) { val = 0.4; dir = 1; }
      if (val >= 1) { val = 1; dir = -1; }
      setPulseOpacity(val);
    }, 50);
    return () => { if (pulseRef.current) clearInterval(pulseRef.current); };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const r = await api.get('/hr/api/v1/management/summary/');
      setData(r.data);
      setLastUpdated(new Date());
    } catch (e) { console.warn('Dashboard error', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    refreshRef.current = setInterval(fetchData, 30000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [fetchData]);

  // Employee drill-down
  const openEmpDrill = async (workareaName: string) => {
    setEmpDrillWa(workareaName);
    setEmpDrillModal(true);
    setEmpDrillLoading(true);
    setEmpDrillSort('employee_code');
    setEmpDrillDir('asc');
    try {
      const res = await api.get('/hr/api/v1/reports/latest-assignments/', { params: { page_size: 5000 } });
      const all: EmpDrillRow[] = res.data?.results || [];
      const filtered = all.filter((r: EmpDrillRow) => r.workarea === workareaName);
      setEmpDrillData(filtered);
    } catch { setEmpDrillData([]); }
    finally { setEmpDrillLoading(false); }
  };

  const toggleEmpSort = (field: string) => {
    if (empDrillSort === field) setEmpDrillDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setEmpDrillSort(field); setEmpDrillDir('asc'); }
  };

  const sortedEmpDrill = [...empDrillData].sort((a, b) => {
    const f = empDrillSort as keyof EmpDrillRow;
    const va = (f === 'employee_name' ? `${a.employee_name || ''}` : (a[f] || '')).toString().toLowerCase();
    const vb = (f === 'employee_name' ? `${b.employee_name || ''}` : (b[f] || '')).toString().toLowerCase();
    return empDrillDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  // Asset drill-down
  const openAssetDrill = async (workareaName: string) => {
    setAssetDrillWa(workareaName);
    setAssetDrillModal(true);
    setAssetDrillLoading(true);
    setAssetDrillSort('equipment_number');
    setAssetDrillDir('asc');
    try {
      const res = await api.get('/hr/api/v1/reports/latest-asset-assignments/', { params: { page_size: 5000 } });
      const all: AssetDrillRow[] = res.data?.results || res.data || [];
      const filtered = workareaName === 'IDLE'
        ? all.filter((r: AssetDrillRow) => r.status === 'IDLE')
        : all.filter((r: AssetDrillRow) => r.workarea_name === workareaName && r.status === 'ASSIGNED');
      setAssetDrillData(filtered);
    } catch { setAssetDrillData([]); }
    finally { setAssetDrillLoading(false); }
  };

  const toggleAssetSort = (field: string) => {
    if (assetDrillSort === field) setAssetDrillDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setAssetDrillSort(field); setAssetDrillDir('asc'); }
  };

  const sortedAssetDrill = [...assetDrillData].sort((a, b) => {
    const f = assetDrillSort as keyof AssetDrillRow;
    const va = (a[f] || '').toString().toLowerCase();
    const vb = (b[f] || '').toString().toLowerCase();
    return assetDrillDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  /* ── Loading State ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: BG }}>
        <div style={{ width: 40, height: 40, border: `4px solid ${PRIMARY}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const hc = data?.headcount || { total: 0, assigned: 0, standby: 0, vacation: 0 };
  const waData = data?.by_workarea || [];
  const waTotal = waData.reduce((s, w) => s + w.count, 0);
  const astats = data?.asset_stats || { total: 0, assigned: 0, idle: 0 };
  const assetWa = data?.asset_by_workarea || [];
  const idleCount = astats.idle || 0;
  const assetWaWithIdle: AssetWaItem[] = idleCount > 0
    ? [...assetWa, { workarea__name_en: 'IDLE', count: idleCount }]
    : assetWa;
  const assetWaTotalAll = assetWaWithIdle.reduce((s, w) => s + w.count, 0);
  const tMax = Math.max(...(data?.by_type || []).map(tp => tp.count), 1);
  const sMax = Math.max(...(data?.by_sponsor || []).map(s => s.count), 1);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, overflowY: 'auto' }}>
      {/* ── Header ── */}
      <div style={{ backgroundColor: '#16A34A', paddingTop: 56, paddingBottom: 24, paddingLeft: 24, paddingRight: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#BBF7D0', fontSize: 13 }}>{t('dashboard.managementPortal')}</div>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginTop: 4 }}>{t('dashboard.dashboard')}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#ffffff25', padding: '6px 12px', borderRadius: 20 }}>
            <div style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff', opacity: pulseOpacity, transition: 'opacity 0.05s' }} />
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{t('common.live')}</span>
          </div>
        </div>
        {userName && <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginTop: 6 }}>👋 {userName}</div>}
        {lastUpdated && <div style={{ color: '#BBF7D080', fontSize: 11, marginTop: 4 }}>Updated: {lastUpdated.toLocaleTimeString()}</div>}
      </div>

      {/* ── KPI Row 1 ── */}
      <div style={{ display: 'flex', gap: 10, padding: '16px 16px 0' }}>
        <KPI emoji="👥" title={t('dashboard.totalEmployees')} value={hc.total || 0} color="#16A34A" bg="#ECFDF5" />
        <KPI emoji="✅" title={t('dashboard.assigned')} value={hc.assigned || 0} color="#4F46E5" bg="#EEF2FF" />
      </div>

      {/* ── KPI Row 2 ── */}
      <div style={{ display: 'flex', gap: 10, padding: '10px 16px 0' }}>
        <KPI emoji="⏸️" title={t('dashboard.standby')} value={hc.standby || 0} color="#D97706" bg="#FFFBEB" onPress={() => openEmpDrill('STANDBY')} />
        <KPI emoji="🏖️" title={t('dashboard.vacation')} value={hc.vacation || 0} color="#7C3AED" bg="#F5F3FF" onPress={() => openEmpDrill('VACATION')} />
      </div>

      {/* ── Employee Assignment Section ── */}
      <div
        onClick={() => setShowWorkareaDetail(!showWorkareaDetail)}
        style={{ margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 1px 10px rgba(0,0,0,0.04)', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ color: '#1E293B', fontSize: 15, fontWeight: 800 }}>{t('dashboard.employeeAssignment')}</span>
          <span style={{ color: '#94A3B8', fontSize: 11 }}>{showWorkareaDetail ? t('dashboard.tapForChart') : t('dashboard.tapForDetails')}</span>
        </div>

        {!showWorkareaDetail ? (
          <div>
            <DonutChart data={waData.map(w => ({ label: w.workarea__name_en, count: w.count }))} size={220} />
            <div style={{ marginTop: 16 }}>
              {waData.slice(0, 8).map((w, i) => (
                <div key={i} onClick={(e) => { e.stopPropagation(); openEmpDrill(w.workarea__name_en); }} style={{ cursor: 'pointer' }}>
                  <LegendItem color={DONUT_COLORS[i % DONUT_COLORS.length]} label={w.workarea__name_en} count={w.count} total={waTotal} />
                </div>
              ))}
              {waData.length > 8 && <p style={{ color: '#94A3B8', fontSize: 11, textAlign: 'center', marginTop: 4 }}>+{waData.length - 8} more…</p>}
            </div>
          </div>
        ) : (
          <div onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 14, marginBottom: 14, justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#3B82F6' }} /><span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>{t('dashboard.own')}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#14B8A6' }} /><span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>{t('dashboard.localHire')}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#F97316' }} /><span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>{t('dashboard.rental')}</span></div>
            </div>
            {waData.map((w, i) => (
              <StackedBar
                key={i} label={w.workarea__name_en}
                own={w.own || 0} local_hire={w.local_hire || 0} rental={w.rental || 0}
                total={w.count} max={Math.max(...waData.map(x => x.count), 1)}
                onPress={() => openEmpDrill(w.workarea__name_en)}
              />
            ))}
            {waData.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center' }}>No data</p>}
          </div>
        )}
      </div>

      {/* ── Asset Assignment Section ── */}
      <div
        onClick={() => setShowAssetDetail(!showAssetDetail)}
        style={{ margin: '0 16px 16px', backgroundColor: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 1px 10px rgba(0,0,0,0.04)', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ color: '#1E293B', fontSize: 15, fontWeight: 800 }}>{t('dashboard.assetAssignment')}</span>
          <span style={{ color: '#94A3B8', fontSize: 11 }}>{showAssetDetail ? t('dashboard.tapForChart') : t('dashboard.tapForDetails')}</span>
        </div>

        {/* Asset KPIs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 10, textAlign: 'center' }}>
            <div style={{ color: '#16A34A', fontSize: 20, fontWeight: 800 }}>{astats.total || 0}</div>
            <div style={{ color: '#64748B', fontSize: 9, fontWeight: 600 }}>TOTAL</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#EEF2FF', borderRadius: 12, padding: 10, textAlign: 'center' }}>
            <div style={{ color: '#4F46E5', fontSize: 20, fontWeight: 800 }}>{astats.assigned || 0}</div>
            <div style={{ color: '#64748B', fontSize: 9, fontWeight: 600 }}>ASSIGNED</div>
          </div>
          <div
            onClick={(e) => { e.stopPropagation(); openAssetDrill('IDLE'); }}
            style={{ flex: 1, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 10, textAlign: 'center', cursor: 'pointer' }}
          >
            <div style={{ color: '#DC2626', fontSize: 20, fontWeight: 800 }}>{astats.idle || 0}</div>
            <div style={{ color: '#64748B', fontSize: 9, fontWeight: 600 }}>IDLE</div>
          </div>
        </div>

        {!showAssetDetail ? (
          <div>
            <DonutChart data={assetWaWithIdle.map(w => ({ label: w.workarea__name_en, count: w.count }))} size={220} />
            <div style={{ marginTop: 16 }}>
              {assetWaWithIdle.slice(0, 10).map((w, i) => (
                <div key={i} onClick={(e) => { e.stopPropagation(); openAssetDrill(w.workarea__name_en); }} style={{ cursor: 'pointer' }}>
                  <LegendItem color={DONUT_COLORS[i % DONUT_COLORS.length]} label={w.workarea__name_en} count={w.count} total={assetWaTotalAll} />
                </div>
              ))}
              {assetWaWithIdle.length > 10 && <p style={{ color: '#94A3B8', fontSize: 11, textAlign: 'center', marginTop: 4 }}>+{assetWaWithIdle.length - 10} more…</p>}
            </div>
          </div>
        ) : (
          <div onClick={(e) => e.stopPropagation()}>
            {assetWa.map((w, i) => (
              <div key={i} onClick={() => openAssetDrill(w.workarea__name_en)} style={{ cursor: 'pointer' }}>
                <Bar label={w.workarea__name_en} count={w.count} max={Math.max(...assetWa.map(x => x.count), 1)} color={DONUT_COLORS[i % DONUT_COLORS.length]} />
              </div>
            ))}
            {assetWa.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center' }}>No data</p>}
          </div>
        )}
      </div>

      {/* ── By Employee Type ── */}
      <div style={{ margin: '0 16px 16px', backgroundColor: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 1px 10px rgba(0,0,0,0.04)' }}>
        <div style={{ color: '#1E293B', fontSize: 15, fontWeight: 800, marginBottom: 14 }}>{t('dashboard.byEmployeeType')}</div>
        {(data?.by_type || []).map((tp, i) => {
          const typeName = (tp.employee_type__name_en || '').toUpperCase();
          const color = TYPE_COLORS[typeName] || '#64748B';
          return <Bar key={i} label={tp.employee_type__name_en} count={tp.count} max={tMax} color={color} />;
        })}
      </div>

      {/* ── By Sponsor ── */}
      <div style={{ margin: '0 16px 16px', backgroundColor: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 1px 10px rgba(0,0,0,0.04)' }}>
        <div style={{ color: '#1E293B', fontSize: 15, fontWeight: 800, marginBottom: 14 }}>{t('dashboard.bySponsor')}</div>
        {(data?.by_sponsor || []).map((s, i) => (
          <Bar key={i} label={s.sponsor__name_en} count={s.count} max={sMax} color="#D97706" />
        ))}
      </div>

      <div style={{ height: 40 }} />

      {/* ══════════ Employee Drill-Down Modal ══════════ */}
      {empDrillModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: 30, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#1E293B', fontSize: 16, fontWeight: 800 }}>{empDrillWa}</div>
                <div style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>{empDrillData.length} {t('dashboard.employees')}</div>
              </div>
              <button onClick={() => setEmpDrillModal(false)} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}>
                <span style={{ color: '#94A3B8', fontSize: 22 }}>✕</span>
              </button>
            </div>
            {/* Table Header */}
            <div style={{ display: 'flex', padding: '10px 16px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ width: 72 }}><SortHeader label="Code" field="employee_code" sortField={empDrillSort} sortDir={empDrillDir} onSort={toggleEmpSort} /></div>
              <div style={{ flex: 1 }}><SortHeader label="Name" field="employee_name" sortField={empDrillSort} sortDir={empDrillDir} onSort={toggleEmpSort} /></div>
              <div style={{ width: 65 }}><SortHeader label="Equip" field="equipment" sortField={empDrillSort} sortDir={empDrillDir} onSort={toggleEmpSort} /></div>
              <div style={{ width: 80 }}><SortHeader label="Category" field="emp_assigned_category" sortField={empDrillSort} sortDir={empDrillDir} onSort={toggleEmpSort} /></div>
              <div style={{ width: 55 }}><SortHeader label="Type" field="employee_type" sortField={empDrillSort} sortDir={empDrillDir} onSort={toggleEmpSort} /></div>
            </div>
            {/* Rows */}
            {empDrillLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div style={{ width: 32, height: 32, border: '4px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {sortedEmpDrill.map((r, i) => (
                  <div key={r.id || i} style={{ display: 'flex', padding: '10px 16px', borderBottom: '1px solid #F1F5F9', backgroundColor: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                    <span style={{ width: 72, color: '#4F46E5', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>{r.employee_code}</span>
                    <span style={{ flex: 1, color: '#1E293B', fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.employee_name}</span>
                    <span style={{ width: 65, color: '#1E293B', fontSize: 10, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.equipment || '—'}</span>
                    <span style={{ width: 80, color: '#64748B', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.emp_assigned_category || r.assigned_category || '—'}</span>
                    <span style={{ width: 55, color: '#64748B', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.employee_type || '—'}</span>
                  </div>
                ))}
                {sortedEmpDrill.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: '30px 0' }}>No employees found</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ Asset Drill-Down Modal ══════════ */}
      {assetDrillModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: 30, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#1E293B', fontSize: 16, fontWeight: 800 }}>{assetDrillWa}</div>
                <div style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>{assetDrillData.length} equipment</div>
              </div>
              <button onClick={() => setAssetDrillModal(false)} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}>
                <span style={{ color: '#94A3B8', fontSize: 22 }}>✕</span>
              </button>
            </div>
            {/* Table Header */}
            <div style={{ display: 'flex', padding: '10px 16px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ width: 70 }}><SortHeader label="Equip #" field="equipment_number" sortField={assetDrillSort} sortDir={assetDrillDir} onSort={toggleAssetSort} /></div>
              <div style={{ flex: 1 }}><SortHeader label="Brand / Model" field="equipment_brand" sortField={assetDrillSort} sortDir={assetDrillDir} onSort={toggleAssetSort} /></div>
              <div style={{ width: 80 }}><SortHeader label="Workarea" field="workarea_name" sortField={assetDrillSort} sortDir={assetDrillDir} onSort={toggleAssetSort} /></div>
              <div style={{ width: 70 }}><SortHeader label="Emp Code" field="employee_code" sortField={assetDrillSort} sortDir={assetDrillDir} onSort={toggleAssetSort} /></div>
              <div style={{ flex: 1 }}><SortHeader label="Emp Name" field="employee_name" sortField={assetDrillSort} sortDir={assetDrillDir} onSort={toggleAssetSort} /></div>
            </div>
            {/* Rows */}
            {assetDrillLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div style={{ width: 32, height: 32, border: '4px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {sortedAssetDrill.map((r, i) => (
                  <div key={r.id || i} style={{ display: 'flex', padding: '10px 16px', borderBottom: '1px solid #F1F5F9', backgroundColor: i % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                    <span style={{ width: 70, color: '#4F46E5', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>{r.equipment_number}</span>
                    <span style={{ flex: 1, color: '#1E293B', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[r.equipment_brand, r.equipment_model].filter(Boolean).join(' ') || '—'}</span>
                    <span style={{ width: 80, color: '#64748B', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.workarea_name || '—'}</span>
                    <span style={{ width: 70, color: '#4F46E5', fontSize: 10, fontWeight: 600, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.employee_code || '—'}</span>
                    <span style={{ flex: 1, color: '#1E293B', fontSize: 10, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.employee_name || '—'}</span>
                  </div>
                ))}
                {sortedAssetDrill.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: '30px 0' }}>No equipment found</p>}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
