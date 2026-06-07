'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';

/* ── Types ── */
interface Asset {
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

interface AssetAssignment {
  employee_name?: string;
  employee_code?: string;
}

export default function MgmtAssets() {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Detail modal
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assignedTo, setAssignedTo] = useState<AssetAssignment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const fetchAssets = useCallback(async (query: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/assets/api/v1/equipment/', {
        params: { search: query || undefined },
      });
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setAssets(data);
      setTotalCount(Array.isArray(res.data) ? res.data.length : res.data.count || data.length);
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAssets(search);
  }, []); // eslint-disable-line

  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchAssets(val);
    }, 400);
  };

  const openDetail = async (asset: Asset) => {
    setShowDetail(true);
    setDetailLoading(true);
    setSelectedAsset(asset);
    setAssignedTo(null);
    try {
      const res = await api.get('/hr/api/v1/asset-assignments/', {
        params: { equipment: asset.id, status: 'ASSIGNED', latest_only: 1 },
      });
      const results = res.data?.results || res.data || [];
      if (results.length > 0) {
        setAssignedTo({
          employee_name: results[0].employee_name || results[0].employee?.first_name,
          employee_code: results[0].employee_code || results[0].employee?.employee_code,
        });
      }
    } catch {
      // Silently handle - just show asset without assignment
    } finally {
      setDetailLoading(false);
    }
  };

  const isExpiringSoon = (dateStr?: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'expired';
    if (diff < 30) return 'critical';
    if (diff < 60) return 'warning';
    return 'ok';
  };

  const expiryColor = (status: string | null) => {
    switch (status) {
      case 'expired': return '#DC2626';
      case 'critical': return '#D97706';
      case 'warning': return '#2563EB';
      default: return '#16A34A';
    }
  };

  /* ── Styles ── */
  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
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
            <div style={{ fontSize: 20, fontWeight: 800 }}>{t('assets.title')}</div>
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
            <div style={{ fontSize: 10, opacity: 0.8 }}>{t('assets.total')}</div>
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
            placeholder={t('assets.searchPlaceholder')}
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

      {/* ── Asset List ── */}
      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
        ) : error && assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>⚠️</span>
            <span style={{ color: '#64748B' }}>{error}</span>
          </div>
        ) : assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>🚗</span>
            <span style={{ color: '#94A3B8', fontSize: 14 }}>{t('common.noData')}</span>
          </div>
        ) : (
          assets.map((asset) => (
            <div key={asset.id} style={cardStyle} onClick={() => openDetail(asset)}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #D97706, #F59E0B)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                🚗
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
                  #{asset.equipment_number}
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                  {asset.plate_number_en || asset.plate_number_ar || t('common.na')}
                </div>
              </div>
              {asset.status && (
                <div
                  style={{
                    background: asset.status === 'ACTIVE' ? '#F0FDF4' : '#FEF2F2',
                    color: asset.status === 'ACTIVE' ? '#16A34A' : '#DC2626',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {asset.status}
                </div>
              )}
              <span style={{ fontSize: 16, color: '#CBD5E1' }}>›</span>
            </div>
          ))
        )}
      </div>

      {/* ── Asset Detail Modal ── */}
      {showDetail && selectedAsset && (
        <div style={modalOverlay} onClick={() => setShowDetail(false)}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E2E8F0' }} />
            </div>

            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', marginBottom: 20 }}>
              {t('assets.assetDetails')}
            </h2>

            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #E2E8F0', borderTopColor: '#D97706', borderRadius: '50%', margin: '0 auto' }} />
              </div>
            ) : (
              <>
                {/* Asset icon + number */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: 'linear-gradient(135deg, #D97706, #F59E0B)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                    }}
                  >
                    🚗
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                      #{selectedAsset.equipment_number}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>
                      {selectedAsset.plate_number_en || t('common.na')}
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: t('assets.equipmentNo'), value: selectedAsset.equipment_number },
                    { label: t('assets.plateEn'), value: selectedAsset.plate_number_en },
                    { label: t('assets.plateAr'), value: selectedAsset.plate_number_ar },
                    { label: t('assets.brand'), value: selectedAsset.brand },
                    { label: t('assets.model'), value: selectedAsset.model },
                    { label: t('assets.year'), value: selectedAsset.year },
                    { label: t('assets.color'), value: selectedAsset.color },
                    { label: t('assets.status'), value: selectedAsset.status },
                  ].map((field, i) => (
                    <div key={i} style={{ background: '#F8FAFC', borderRadius: 12, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{field.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{field.value || t('common.na')}</div>
                    </div>
                  ))}
                </div>

                {/* Expiry Dates */}
                <div style={{ marginBottom: 20 }}>
                  {[
                    { label: t('assets.istimaraExpiry'), value: selectedAsset.istimara_expiry },
                    { label: t('assets.fahasExpiry'), value: selectedAsset.fahas_expiry },
                    { label: t('assets.insuranceExpiry'), value: selectedAsset.insurance_expiry },
                  ].map((field, i) => {
                    const status = isExpiringSoon(field.value);
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          background: '#F8FAFC',
                          borderRadius: 12,
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 13, color: '#64748B' }}>{field.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: field.value ? expiryColor(status) : '#94A3B8' }}>
                          {field.value || t('common.na')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Assigned To */}
                <div
                  style={{
                    background: assignedTo ? '#F0FDF4' : '#F8FAFC',
                    border: `1px solid ${assignedTo ? '#BBF7D0' : '#E2E8F0'}`,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontSize: 12, color: assignedTo ? '#16A34A' : '#94A3B8', fontWeight: 600, marginBottom: 4 }}>
                    {t('assets.assignedTo')}
                  </div>
                  {assignedTo ? (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{assignedTo.employee_name}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{assignedTo.employee_code}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#94A3B8' }}>{t('assets.notAssigned')}</div>
                  )}
                </div>

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
