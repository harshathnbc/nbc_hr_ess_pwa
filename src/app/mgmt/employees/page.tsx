'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';

/* ── Types ── */
interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  iqama_number?: string;
  nationality?: string;
  workarea_name?: string;
  actual_category?: string;
  assigned_category?: string;
  employee_type?: string;
  sponsor?: string;
  joining_date?: string;
  reporting_to_name?: string;
  mobile_number?: string;
  is_active?: boolean;
}

interface EmployeeDetail extends Employee {
  assigned_assets?: AssetInfo[];
  current_assignment?: {
    workarea_name: string;
    last_assigned_date: string;
  };
}

interface AssetInfo {
  id: number;
  equipment_number: string;
  plate_number_en?: string;
  plate_number_ar?: string;
  brand?: string;
  model?: string;
  year?: string;
  color?: string;
  status?: string;
  istimara_expiry?: string;
  fahas_expiry?: string;
  insurance_expiry?: string;
}

interface PageResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Employee[];
}

const PAGE_SIZE = 20;

export default function MgmtEmployees() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Detail modal
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const fetchEmployees = useCallback(async (page: number, query: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<PageResponse>('/hr/api/v1/employees/', {
        params: { page_size: PAGE_SIZE, page, is_active: true, search: query || undefined },
      });
      setEmployees(res.data.results);
      setTotalCount(res.data.count);
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchEmployees(currentPage, search);
  }, [currentPage, fetchEmployees]); // eslint-disable-line

  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchEmployees(1, val);
    }, 400);
  };

  const openDetail = async (emp: Employee) => {
    setShowDetail(true);
    setDetailLoading(true);
    setSelectedEmployee(emp as EmployeeDetail);
    try {
      const [detailRes, assignRes] = await Promise.all([
        api.get(`/hr/api/v1/employees/${emp.id}/`),
        api.get(`/hr/api/v1/employees/${emp.id}/assignments/`).catch(() => ({ data: null })),
      ]);
      const detail: EmployeeDetail = {
        ...detailRes.data,
        current_assignment: assignRes.data,
        assigned_assets: detailRes.data.assigned_assets || [],
      };
      setSelectedEmployee(detail);
    } catch {
      setError(t('mgmtEmployees.failedToLoad'));
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const showingFrom = (currentPage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(currentPage * PAGE_SIZE, totalCount);

  const getInitials = (first: string, last: string) => {
    return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
  };

  /* ── Styles ── */
  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
    color: '#fff',
    padding: '20px 20px 32px',
    borderRadius: '0 0 28px 28px',
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  };

  const modalOverlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  };

  const modalContent: React.CSSProperties = {
    background: '#fff',
    borderRadius: '24px 24px 0 0',
    width: '100%',
    maxWidth: 480,
    maxHeight: '85vh',
    overflow: 'auto',
    padding: '24px 20px env(safe-area-inset-bottom, 20px)',
    animation: 'slideUp 0.3s ease',
  };

  return (
    <div>
      {/* ── Header ── */}
      <header style={headerStyle} className="safe-top">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 2 }}>{t('mgmtEmployees.management')}</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{t('mgmtEmployees.employees')}</div>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              padding: '8px 14px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800 }}>{totalCount}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{t('mgmtEmployees.totalLabel')}</div>
          </div>
        </div>
      </header>

      {/* ── Search ── */}
      <div style={{ padding: '0 16px', marginTop: -16 }}>
        <div style={{ position: 'relative' }}>
          <input
            className="mgmt-input"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('mgmtEmployees.searchPlaceholder')}
            style={{
              padding: '14px 16px 14px 42px',
              borderRadius: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              fontSize: 14,
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 18,
              opacity: 0.4,
            }}
          >
            🔍
          </span>
        </div>
      </div>

      {/* ── Count Info ── */}
      {!loading && totalCount > 0 && (
        <div style={{ padding: '12px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            {t('mgmtEmployees.showing')} {showingFrom}-{showingTo} {t('mgmtEmployees.of')} {totalCount}
          </span>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            {t('mgmtEmployees.page')} {currentPage}/{totalPages}
          </span>
        </div>
      )}

      {/* ── Employee List ── */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ ...cardStyle, opacity: 0.5 }} className="animate-pulse">
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E2E8F0' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '60%', height: 14, background: '#E2E8F0', borderRadius: 6, marginBottom: 6 }} />
                <div style={{ width: '40%', height: 10, background: '#E2E8F0', borderRadius: 6 }} />
              </div>
            </div>
          ))
        ) : error && employees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>⚠️</span>
            <span style={{ color: '#64748B' }}>{error}</span>
          </div>
        ) : employees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>👥</span>
            <span style={{ color: '#94A3B8', fontSize: 14 }}>{t('mgmtEmployees.noEmployees')}</span>
          </div>
        ) : (
          employees.map((emp) => (
            <div
              key={emp.id}
              style={cardStyle}
              onClick={() => openDetail(emp)}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {getInitials(emp.first_name, emp.last_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {emp.first_name} {emp.last_name}
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>{emp.employee_code}</span>
                  {emp.iqama_number && <span>• {emp.iqama_number}</span>}
                </div>
              </div>
              {emp.workarea_name && (
                <div
                  style={{
                    background: '#F0FDF4',
                    color: '#16A34A',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 600,
                    maxWidth: 90,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {emp.workarea_name}
                </div>
              )}
              <span style={{ fontSize: 16, color: '#CBD5E1' }}>›</span>
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '8px 16px 20px' }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              background: currentPage === 1 ? '#F8FAFC' : '#fff',
              color: currentPage === 1 ? '#CBD5E1' : '#1E293B',
              fontSize: 16,
              fontWeight: 600,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ‹
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: currentPage === pageNum ? 'none' : '1px solid #E2E8F0',
                  background: currentPage === pageNum ? '#4F46E5' : '#fff',
                  color: currentPage === pageNum ? '#fff' : '#64748B',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              background: currentPage === totalPages ? '#F8FAFC' : '#fff',
              color: currentPage === totalPages ? '#CBD5E1' : '#1E293B',
              fontSize: 16,
              fontWeight: 600,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ›
          </button>
        </div>
      )}

      {/* ── Employee Detail Modal ── */}
      {showDetail && selectedEmployee && (
        <div style={modalOverlay} onClick={() => setShowDetail(false)}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Handle / Close bar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E2E8F0' }} />
            </div>

            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', marginBottom: 20 }}>
              {t('mgmtEmployees.employeeDetails')}
            </h2>

            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%', margin: '0 auto' }} />
              </div>
            ) : (
              <>
                {/* Profile header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 20,
                    }}
                  >
                    {getInitials(selectedEmployee.first_name, selectedEmployee.last_name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>{selectedEmployee.employee_code}</div>
                  </div>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: t('mgmtEmployees.iqama'), value: selectedEmployee.iqama_number },
                    { label: t('mgmtEmployees.nationality'), value: selectedEmployee.nationality },
                    { label: t('mgmtEmployees.actualCategory'), value: selectedEmployee.actual_category },
                    { label: t('mgmtEmployees.assignedCategory'), value: selectedEmployee.assigned_category },
                    { label: t('mgmtEmployees.employeeType'), value: selectedEmployee.employee_type },
                    { label: t('mgmtEmployees.sponsor'), value: selectedEmployee.sponsor },
                    { label: t('mgmtEmployees.joiningDate'), value: selectedEmployee.joining_date },
                    { label: t('mgmtEmployees.reportingTo'), value: selectedEmployee.reporting_to_name },
                  ].map((field, i) => (
                    <div key={i} style={{ background: '#F8FAFC', borderRadius: 12, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{field.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{field.value || t('common.na')}</div>
                    </div>
                  ))}
                </div>

                {/* Current Assignment */}
                {selectedEmployee.current_assignment && (
                  <div style={{ background: '#F0FDF4', borderRadius: 14, padding: 14, marginBottom: 20, border: '1px solid #BBF7D0' }}>
                    <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, marginBottom: 6 }}>{t('mgmtEmployees.currentAssignment')}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{selectedEmployee.current_assignment.workarea_name}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      {t('mgmtEmployees.lastAssignedDate')}: {selectedEmployee.current_assignment.last_assigned_date || t('common.na')}
                    </div>
                  </div>
                )}

                {/* Assigned Assets */}
                {selectedEmployee.assigned_assets && selectedEmployee.assigned_assets.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 10 }}>
                      {t('mgmtEmployees.assignedAssets')}
                    </h3>
                    {selectedEmployee.assigned_assets.map((asset, i) => (
                      <div
                        key={i}
                        style={{
                          background: '#FFFBEB',
                          border: '1px solid #FDE68A',
                          borderRadius: 12,
                          padding: 12,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
                          {t('mgmtEmployees.equipmentNo')}: {asset.equipment_number}
                        </div>
                        {asset.plate_number_en && (
                          <div style={{ fontSize: 12, color: '#64748B' }}>
                            {t('mgmtEmployees.plate')}: {asset.plate_number_en}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {asset.brand && <span>{asset.brand}</span>}
                          {asset.model && <span>• {asset.model}</span>}
                          {asset.year && <span>• {asset.year}</span>}
                          {asset.color && <span>• {asset.color}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setShowDetail(false)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: 14,
                    color: '#64748B',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    marginTop: 8,
                  }}
                >
                  {t('common.close')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
