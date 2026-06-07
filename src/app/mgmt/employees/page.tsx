'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';

const PRIMARY = '#4F46E5';
const BG = '#F1F5F9';
const PAGE_SIZE = 20;

/* ── Interfaces ─────────────────────────────────────────────── */
interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  iqama_number?: string;
  workarea?: { name_en: string };
  _currentWorkarea?: string;
}

interface EmployeeDetail {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  iqama_number?: string;
  nationality?: { name_en: string };
  actual_category?: { name_en: string };
  assigned_category?: { name_en: string };
  workarea?: { name_en: string };
  joining_date?: string;
  sponsor?: { name_en: string };
  employee_type?: { name_en: string };
  contact_number?: string;
  _currentAssignment?: {
    workarea?: string;
    workarea_name?: string;
    assigned_category_name?: string;
    assigned_category?: string;
    reporting_to_name?: string;
    reporting_to?: string;
    start_date?: string;
    equipment?: string;
    equipment_id?: number;
  };
  _activeAssets?: { equipment_number: string; equipment_id: number; english_plate?: string }[];
}

interface AssetDetail {
  equipment_number: string;
  english_plate_letters?: string;
  english_plate_numbers?: string;
  arabic_plate_letters?: string;
  arabic_plate_numbers?: string;
  brand?: string;
  model?: string;
  year_of_manufacture?: string;
  color?: string;
  status?: string;
  istimara_expiry?: string;
  fahas_expiry?: string;
  insurance_expiry?: string;
}

/* ── Detail Row ─────────────────────────────────────────────── */
function DetailRow({ label, value, onPress }: { label: string; value?: string | null; onPress?: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ color: '#64748B', fontSize: 14 }}>{label}</span>
      {onPress ? (
        <span onClick={onPress} style={{ color: '#4F46E5', fontSize: 14, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>{value || '—'}</span>
      ) : (
        <span style={{ color: '#1E293B', fontSize: 14, fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{value || '—'}</span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ██  EMPLOYEES SCREEN
   ══════════════════════════════════════════════════════════════ */
export default function EmployeesScreen() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [empDetail, setEmpDetail] = useState<EmployeeDetail | null>(null);
  const [assetModal, setAssetModal] = useState<AssetDetail | null>(null);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchPage = useCallback(async (p = 1, q = '') => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { page_size: PAGE_SIZE, page: p, is_active: true };
      if (q.trim()) params.search = q.trim();
      const r = await api.get('/hr/api/v1/employees/', { params });
      const emps = r.data.results || [];

      // Fetch current assignment for each employee to get real workarea
      const enriched = await Promise.all(emps.map(async (emp: Employee) => {
        try {
          const aRes = await api.get(`/hr/api/v1/employees/${emp.id}/assignments/`);
          const assignments = aRes.data?.results || aRes.data || [];
          const current = assignments.find((a: { end_date?: string; status?: string }) => !a.end_date || a.status === 'Current') || assignments[0] || null;
          return { ...emp, _currentWorkarea: current?.workarea || current?.workarea_name || null };
        } catch {
          return emp;
        }
      }));

      setEmployees(enriched);
      setTotalCount(r.data.count || 0);
      setPage(p);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPage(1, ''); }, [fetchPage]);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => fetchPage(1, text), 400);
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    fetchPage(p, search);
  };

  // Fetch full detail + current assignment when employee selected
  const openDetail = async (emp: Employee) => {
    setSelected(emp);
    setDetailLoading(true);
    setEmpDetail(null);
    try {
      const empRes = await api.get(`/hr/api/v1/employees/${emp.id}/`);

      let currentAssignment = null;
      try {
        const assignRes = await api.get(`/hr/api/v1/employees/${emp.id}/assignments/`);
        const assignments = assignRes.data?.results || assignRes.data || [];
        currentAssignment = assignments.find((a: { end_date?: string; status?: string }) =>
          !a.end_date || a.status === 'Current'
        ) || assignments[0] || null;
      } catch { /* permission denied */ }

      let activeAssets: { equipment_number: string; equipment_id: number; english_plate?: string }[] = [];
      try {
        const assetRes = await api.get(`/hr/api/v1/employees/${emp.id}/active-assets/`);
        const assetResults = assetRes.data || [];
        activeAssets = assetResults.map((a: { equipment_number: string; equipment_id: number; english_plate?: string }) => ({
          equipment_number: a.equipment_number,
          equipment_id: a.equipment_id,
          english_plate: a.english_plate || '',
        }));
      } catch {
        if (currentAssignment && currentAssignment.equipment) {
          activeAssets.push({
            equipment_number: currentAssignment.equipment,
            equipment_id: currentAssignment.equipment_id,
          });
        }
      }

      setEmpDetail({
        ...empRes.data,
        _currentAssignment: currentAssignment,
        _activeAssets: activeAssets,
      });
    } catch (e) { console.warn('Employee detail error:', e); }
    finally { setDetailLoading(false); }
  };

  // Fetch asset details
  const openAssetDetail = async (assetId: number) => {
    try {
      const r = await api.get(`/assets/api/v1/equipment/${assetId}/`);
      setAssetModal(r.data);
    } catch (e) { console.warn(e); }
  };

  /* ── Pagination Bar ── */
  const PaginationBar = () => {
    if (totalPages <= 1) return null;
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    const pageBtn = (p: number, active: boolean, disabled?: boolean, label?: string) => (
      <button
        key={label || p}
        onClick={() => !disabled && goToPage(p)}
        disabled={disabled}
        style={{
          width: 36, height: 36, borderRadius: 10, border: 'none',
          backgroundColor: active ? PRIMARY : disabled ? '#E2E8F0' : '#fff',
          color: active ? '#fff' : disabled ? '#CBD5E1' : '#1E293B',
          fontSize: label ? 16 : 13, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {label || p}
      </button>
    );

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '12px 0' }}>
        {pageBtn(page - 1, false, page === 1, '‹')}
        {start > 1 && (
          <>
            {pageBtn(1, false)}
            {start > 2 && <span style={{ color: '#94A3B8', fontSize: 12 }}>…</span>}
          </>
        )}
        {pages.map(p => pageBtn(p, p === page))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span style={{ color: '#94A3B8', fontSize: 12 }}>…</span>}
            {pageBtn(totalPages, false)}
          </>
        )}
        {pageBtn(page + 1, false, page === totalPages, '›')}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG }}>
      {/* ── Header ── */}
      <div style={{ backgroundColor: PRIMARY, paddingTop: 56, paddingBottom: 24, paddingLeft: 24, paddingRight: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <div style={{ color: '#C7D2FE', fontSize: 13 }}>{t('mgmtEmployees.management')}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <div style={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>{t('mgmtEmployees.employees')}</div>
          <div style={{ backgroundColor: '#ffffff25', padding: '6px 14px', borderRadius: 20 }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>{totalCount} {t('mgmtEmployees.totalLabel')}</span>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: '0 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder={t('mgmtEmployees.searchPlaceholder')}
            style={{ flex: 1, padding: 14, color: '#1E293B', fontSize: 15, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit' }}
          />
          {search.length > 0 && (
            <button onClick={() => { setSearch(''); fetchPage(1, ''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <span style={{ color: '#94A3B8', fontSize: 18 }}>✕</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Page Info ── */}
      <div style={{ padding: '6px 20px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#64748B', fontSize: 12 }}>
          {t('mgmtEmployees.showing')} {employees.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, totalCount)} {t('mgmtEmployees.of')} {totalCount}
        </span>
        {totalPages > 1 && <span style={{ color: '#64748B', fontSize: 12 }}>{t('mgmtEmployees.page')} {page}/{totalPages}</span>}
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60 }}>
          <div style={{ width: 40, height: 40, border: `4px solid ${PRIMARY}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ padding: '0 16px 16px' }}>
          {employees.length === 0 ? (
            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ color: '#64748B', fontSize: 14 }}>{t('mgmtEmployees.noEmployees')}</div>
            </div>
          ) : (
            employees.map(item => (
              <div
                key={item.id}
                onClick={() => openDetail(item)}
                style={{
                  backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: PRIMARY, fontSize: 15, fontWeight: 800 }}>{(item.first_name || '?')[0]}{(item.last_name || '')[0] || ''}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#1E293B', fontSize: 14, fontWeight: 700 }}>{item.first_name} {item.last_name}</div>
                  <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>{item.employee_code} • {item.iqama_number || '—'}</div>
                </div>
                <div style={{ backgroundColor: '#F0FDF4', padding: '4px 8px', borderRadius: 8, flexShrink: 0 }}>
                  <span style={{ color: '#16A34A', fontSize: 10, fontWeight: 800 }}>{item._currentWorkarea || item.workarea?.name_en || 'STANDBY'}</span>
                </div>
              </div>
            ))
          )}
          <PaginationBar />
        </div>
      )}

      {/* ══════════ Employee Detail Modal ══════════ */}
      {selected && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ color: '#1E293B', fontSize: 20, fontWeight: 800 }}>{t('mgmtEmployees.employeeDetails')}</span>
              <button onClick={() => { setSelected(null); setEmpDetail(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span style={{ color: '#94A3B8', fontSize: 26 }}>✕</span>
              </button>
            </div>

            {detailLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div style={{ width: 40, height: 40, border: `4px solid ${PRIMARY}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : empDetail ? (
              <>
                {/* Header card */}
                <div style={{ backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>{(empDetail.first_name || '?')[0]}{(empDetail.last_name || '')[0] || ''}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#1E293B', fontSize: 16, fontWeight: 800 }}>{empDetail.first_name} {empDetail.last_name}</div>
                    <div style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>{empDetail.employee_code}</div>
                  </div>
                </div>

                <DetailRow label={t('mgmtEmployees.iqama')} value={empDetail.iqama_number} />
                <DetailRow label={t('mgmtEmployees.nationality')} value={empDetail.nationality?.name_en} />
                <DetailRow label={t('mgmtEmployees.employeeCode')} value={empDetail.employee_code} />
                <DetailRow label={t('mgmtEmployees.actualCategory')} value={empDetail.actual_category?.name_en} />
                <DetailRow label={t('mgmtEmployees.assignedCategory')} value={
                  empDetail._currentAssignment?.assigned_category_name || empDetail._currentAssignment?.assigned_category || empDetail.assigned_category?.name_en
                } />
                <DetailRow label={t('mgmtEmployees.reportingTo')} value={
                  empDetail._currentAssignment?.reporting_to_name || empDetail._currentAssignment?.reporting_to || '—'
                } />
                <DetailRow label={t('mgmtEmployees.currentAssignment')} value={
                  empDetail._currentAssignment?.workarea_name || empDetail._currentAssignment?.workarea || empDetail.workarea?.name_en || 'STANDBY'
                } />
                <DetailRow label={t('mgmtEmployees.lastAssignedDate')} value={empDetail._currentAssignment?.start_date} />
                <DetailRow label={t('mgmtEmployees.joiningDate')} value={empDetail.joining_date} />
                <DetailRow label={t('mgmtEmployees.sponsor')} value={empDetail.sponsor?.name_en} />
                <DetailRow label={t('mgmtEmployees.employeeType')} value={empDetail.employee_type?.name_en} />

                {/* Assigned Assets */}
                {empDetail._activeAssets && empDetail._activeAssets.length > 0 && (
                  <div style={{ marginTop: 16, backgroundColor: '#F0FDF4', borderRadius: 14, padding: 14 }}>
                    <div style={{ color: '#16A34A', fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{t('mgmtEmployees.assignedAssets')}</div>
                    {empDetail._activeAssets.map((asset, i) => (
                      <div
                        key={i}
                        onClick={() => openAssetDetail(asset.equipment_id)}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '8px 0', cursor: 'pointer',
                          borderBottom: i < (empDetail._activeAssets?.length || 0) - 1 ? '1px solid #D1FAE5' : 'none',
                        }}
                      >
                        <span style={{ color: '#4F46E5', fontSize: 14, fontWeight: 700, textDecoration: 'underline', flex: 1 }}>{asset.equipment_number}</span>
                        <span style={{ color: '#64748B', fontSize: 12 }}>{asset.english_plate || ''}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ height: 40 }} />
              </>
            ) : (
              <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>{t('mgmtEmployees.failedToLoad')}</p>
            )}
          </div>
        </div>
      )}

      {/* ══════════ Asset Detail Modal ══════════ */}
      {assetModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 10000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ color: '#1E293B', fontSize: 18, fontWeight: 800 }}>{t('mgmtEmployees.assetDetails')}</span>
              <button onClick={() => setAssetModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span style={{ color: '#94A3B8', fontSize: 22 }}>✕</span>
              </button>
            </div>
            <DetailRow label={t('mgmtEmployees.equipmentNo')} value={assetModal.equipment_number} />
            <DetailRow label={t('mgmtEmployees.plate')} value={
              [assetModal.english_plate_letters, assetModal.english_plate_numbers].filter(Boolean).join(' ') || '—'
            } />
            <DetailRow label={t('mgmtEmployees.brand')} value={assetModal.brand} />
            <DetailRow label={t('mgmtEmployees.model')} value={assetModal.model} />
            <DetailRow label={t('mgmtEmployees.year')} value={assetModal.year_of_manufacture} />
            <DetailRow label={t('mgmtEmployees.color')} value={assetModal.color} />
            <DetailRow label={t('mgmtEmployees.status')} value={assetModal.status} />
            <DetailRow label={t('mgmtEmployees.istimaraExpiry')} value={assetModal.istimara_expiry} />
            <DetailRow label={t('mgmtEmployees.fahasExpiry')} value={assetModal.fahas_expiry} />
            <DetailRow label={t('mgmtEmployees.insuranceExpiry')} value={assetModal.insurance_expiry} />
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
