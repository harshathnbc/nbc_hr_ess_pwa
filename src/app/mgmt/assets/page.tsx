'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';

const PRIMARY = '#D97706';
const BG = '#F1F5F9';

/* ── Interfaces ─────────────────────────────────────────────── */
interface Asset {
  id: number;
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
  _assignedEmployee?: { id: number; name: string; code: string } | null;
}

interface EmpModalData {
  first_name?: string;
  last_name?: string;
  employee_code?: string;
  iqama_number?: string;
  nationality?: { name_en: string };
  actual_category?: { name_en: string };
  assigned_category?: { name_en: string };
  workarea?: { name_en: string };
  joining_date?: string;
  employee_type?: { name_en: string };
  _currentAssignment?: {
    workarea?: string;
    assigned_category?: string;
    reporting_to?: string;
  };
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

/* ── Expiry Status Helper ─────────────────────────────────── */
function getExpiryColor(dateStr?: string): string {
  if (!dateStr) return '#64748B';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return '#DC2626';
  if (diffDays < 30) return '#D97706';
  return '#16A34A';
}

function ExpiryRow({ label, value }: { label: string; value?: string | null }) {
  const color = getExpiryColor(value || undefined);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ color: '#64748B', fontSize: 14 }}>{label}</span>
      <span style={{ color, fontSize: 14, fontWeight: 600 }}>{value || '—'}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ██  ASSETS SCREEN
   ══════════════════════════════════════════════════════════════ */
export default function AssetsScreen() {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [selected, setSelected] = useState<Asset | null>(null);

  // Employee detail modal (drill-down from asset)
  const [empModal, setEmpModal] = useState<EmpModalData | null>(null);
  const [empLoading, setEmpLoading] = useState(false);

  const fetchAssets = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (q.trim()) params.search = q.trim();
      const r = await api.get('/assets/api/v1/equipment/', { params });
      const data = r.data.results || r.data || [];
      setAssets(data);
      setTotalCount(data.length);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAssets(''); }, [fetchAssets]);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => fetchAssets(text), 400);
  };

  const getPlate = (item: Asset) => {
    const parts = [item.english_plate_letters, item.english_plate_numbers].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '—';
  };

  const openEmployeeDetail = async (empId: number) => {
    setEmpLoading(true);
    setEmpModal(null);
    try {
      const r = await api.get(`/hr/api/v1/employees/${empId}/`);

      let currentAssignment = null;
      try {
        const assignRes = await api.get(`/hr/api/v1/employees/${empId}/assignments/`);
        const assignments = assignRes.data?.results || assignRes.data || [];
        currentAssignment = assignments.find((a: { end_date?: string; status?: string }) =>
          !a.end_date || a.status === 'Current'
        ) || assignments[0] || null;
      } catch { /* permission denied */ }

      setEmpModal({ ...r.data, _currentAssignment: currentAssignment });
    } catch (e) { console.warn(e); }
    finally { setEmpLoading(false); }
  };

  const openAssetDetail = async (item: Asset) => {
    let assignedEmployee: { id: number; name: string; code: string } | null = null;
    try {
      const res = await api.get('/hr/api/v1/asset-assignments/', {
        params: { equipment: item.id, status: 'ASSIGNED', latest_only: '1' }
      });
      const results = res.data?.results || res.data || [];
      const current = results.find((a: { status: string; end_date?: string }) => a.status === 'ASSIGNED' && !a.end_date);
      if (current && current.employee) {
        assignedEmployee = {
          id: current.employee,
          name: current.employee_name,
          code: current.employee_code,
        };
      }
    } catch {
      /* ignore */
    }
    setSelected({ ...item, _assignedEmployee: assignedEmployee });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG }}>
      {/* ── Header ── */}
      <div style={{ backgroundColor: PRIMARY, paddingTop: 56, paddingBottom: 24, paddingLeft: 24, paddingRight: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <div style={{ color: '#FEF3C7', fontSize: 13 }}>Management</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <div style={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>Assets</div>
          <div style={{ backgroundColor: '#ffffff25', padding: '6px 14px', borderRadius: 20 }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>{totalCount} Total</span>
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
            placeholder="Search by plate or asset number..."
            style={{ flex: 1, padding: 14, color: '#1E293B', fontSize: 15, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit' }}
          />
          {search.length > 0 && (
            <button onClick={() => { setSearch(''); fetchAssets(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <span style={{ color: '#94A3B8', fontSize: 18 }}>✕</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Count ── */}
      <div style={{ padding: '6px 20px' }}>
        <span style={{ color: '#64748B', fontSize: 12 }}>{totalCount} assets found</span>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60 }}>
          <div style={{ width: 40, height: 40, border: `4px solid ${PRIMARY}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ padding: '0 16px 16px' }}>
          {assets.length === 0 ? (
            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🚗</div>
              <div style={{ color: '#64748B', fontSize: 14 }}>No assets found.</div>
            </div>
          ) : (
            assets.map(item => (
              <div
                key={item.id}
                onClick={() => openAssetDetail(item)}
                style={{
                  backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 18 }}>🚗</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#1E293B', fontSize: 14, fontWeight: 700 }}>{item.equipment_number}</div>
                  <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>{getPlate(item)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════ Asset Detail Modal ══════════ */}
      {selected && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ color: '#1E293B', fontSize: 20, fontWeight: 800 }}>Asset Details</span>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span style={{ color: '#94A3B8', fontSize: 26 }}>✕</span>
              </button>
            </div>

            {/* Header card */}
            <div style={{ backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 22 }}>🚗</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#1E293B', fontSize: 16, fontWeight: 800 }}>{selected.equipment_number}</div>
                <div style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>{getPlate(selected)}</div>
              </div>
            </div>

            <DetailRow label="Equipment #" value={selected.equipment_number} />
            <DetailRow label="Plate (EN)" value={getPlate(selected)} />
            <DetailRow label="Plate (AR)" value={
              [selected.arabic_plate_letters, selected.arabic_plate_numbers].filter(Boolean).join(' ') || '—'
            } />
            <DetailRow label="Brand" value={selected.brand} />
            <DetailRow label="Model" value={selected.model} />
            <DetailRow label="Year" value={selected.year_of_manufacture} />
            <DetailRow label="Color" value={selected.color} />
            <DetailRow label="Status" value={selected.status} />
            <ExpiryRow label="Istimara Expiry" value={selected.istimara_expiry} />
            <ExpiryRow label="Fahas Expiry" value={selected.fahas_expiry} />
            <ExpiryRow label="Insurance Expiry" value={selected.insurance_expiry} />

            {/* Assigned Employee */}
            {selected._assignedEmployee ? (
              <div style={{ marginTop: 16, backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14 }}>
                <div style={{ color: '#4F46E5', fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Assigned To</div>
                <div
                  onClick={() => openEmployeeDetail(selected._assignedEmployee!.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>{(selected._assignedEmployee.name || '?')[0]}</span>
                  </div>
                  <div>
                    <div style={{ color: '#4F46E5', fontSize: 14, fontWeight: 700, textDecoration: 'underline' }}>
                      {selected._assignedEmployee.name || 'View Employee'}
                    </div>
                    <div style={{ color: '#64748B', fontSize: 11 }}>{selected._assignedEmployee.code || ''}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 16, backgroundColor: '#FEF2F2', borderRadius: 14, padding: 14 }}>
                <span style={{ color: '#DC2626', fontSize: 13, fontWeight: 700 }}>Not currently assigned</span>
              </div>
            )}

            <div style={{ height: 40 }} />
          </div>
        </div>
      )}

      {/* ══════════ Employee Detail Modal (drill-down from asset) ══════════ */}
      {(empModal || empLoading) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 10000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ color: '#1E293B', fontSize: 18, fontWeight: 800 }}>Employee Details</span>
              <button onClick={() => setEmpModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span style={{ color: '#94A3B8', fontSize: 22 }}>✕</span>
              </button>
            </div>
            {empLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div style={{ width: 32, height: 32, border: '4px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : empModal ? (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <DetailRow label="Name" value={`${empModal.first_name || ''} ${empModal.last_name || ''}`} />
                <DetailRow label="Employee Code" value={empModal.employee_code} />
                <DetailRow label="Iqama" value={empModal.iqama_number} />
                <DetailRow label="Nationality" value={empModal.nationality?.name_en} />
                <DetailRow label="Actual Category" value={empModal.actual_category?.name_en} />
                <DetailRow label="Assigned Category" value={
                  empModal._currentAssignment?.assigned_category || empModal.assigned_category?.name_en
                } />
                <DetailRow label="Reporting To" value={empModal._currentAssignment?.reporting_to || '—'} />
                <DetailRow label="Current Assignment" value={
                  empModal._currentAssignment?.workarea || empModal.workarea?.name_en || 'STANDBY'
                } />
                <DetailRow label="Joining Date" value={empModal.joining_date} />
                <DetailRow label="Employee Type" value={empModal.employee_type?.name_en} />
              </div>
            ) : (
              <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>Failed to load</p>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
