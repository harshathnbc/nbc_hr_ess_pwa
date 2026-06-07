'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';

const NAVY = '#1B2A4A', RED = '#C8102E', SILVER = '#8E99A8',
  GLASS = 'rgba(255,255,255,0.06)', GLASS_BORDER = 'rgba(255,255,255,0.10)',
  GREEN = '#34D399', YELLOW = '#FFB020', PINK = '#FF4D6A';

const LEAVE_TYPES = [
  { key: 'annual', emoji: '🏖️', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  { key: 'sick', emoji: '🏥', color: '#FFB020', bg: 'rgba(255,176,32,0.12)' },
  { key: 'emergency', emoji: '🚨', color: '#FF4D6A', bg: 'rgba(255,77,106,0.12)' },
  { key: 'unpaid', emoji: '💸', color: '#8E99A8', bg: 'rgba(142,153,168,0.12)' },
  { key: 'other', emoji: '📋', color: '#C4CDD9', bg: 'rgba(196,205,217,0.12)' },
];

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  pending: { color: YELLOW, bg: 'rgba(255,176,32,0.12)' },
  approved: { color: GREEN, bg: 'rgba(52,211,153,0.12)' },
  rejected: { color: PINK, bg: 'rgba(255,77,106,0.12)' },
};

interface LeaveRequest { id: number; leave_type: string; start_date: string; end_date: string; reason: string; status: string; }

export default function LeavePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<{ id: number } | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const me = await api.get('/hr/api/v1/me/');
      setProfile(me.data);
      const res = await api.get('/hr/api/v1/leave-requests/', { params: { employee: me.data.id } });
      setLeaves(res.data.results || res.data);
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!startDate || !endDate) { alert(t('leave.enterDates')); return; }
    setSubmitting(true);
    try {
      await api.post('/hr/api/v1/leave-requests/', { employee: profile?.id, leave_type: leaveType, start_date: startDate, end_date: endDate, reason });
      setShowForm(false);
      setStartDate(''); setEndDate(''); setReason(''); setLeaveType('annual');
      await fetchData();
      alert(t('leave.sentForApproval'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || t('common.error');
      alert(msg);
    }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80dvh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: RED, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Header */}
      <div style={{ background: NAVY, paddingTop: 48, paddingBottom: 24, paddingInline: 20, borderRadius: '0 0 28px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{t('leave.title')}</h1>
        <button onClick={() => setShowForm(true)} style={{ background: RED, color: '#fff', border: 'none', borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ {t('leave.newButton')}</button>
      </div>

      {/* Leave List */}
      <div style={{ padding: '16px 16px 0' }}>
        {leaves.length === 0 ? (
          <p style={{ color: SILVER, fontSize: 13, textAlign: 'center', padding: 40 }}>{t('leave.noRequests')}</p>
        ) : leaves.map((lv) => {
          const typeInfo = LEAVE_TYPES.find(lt => lt.key === lv.leave_type) || LEAVE_TYPES[4];
          const statusInfo = STATUS_COLORS[lv.status] || STATUS_COLORS.pending;
          return (
            <div key={lv.id} style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 16, padding: 16, marginBottom: 10, borderLeft: `3px solid ${typeInfo.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  {typeInfo.emoji} {t(`leave.${lv.leave_type}`)}
                </span>
                <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {t(`leave.${lv.status}`)}
                </span>
              </div>
              <p style={{ color: SILVER, fontSize: 12 }}>{lv.start_date} → {lv.end_date}</p>
              {lv.reason && <p style={{ color: SILVER, fontSize: 11, marginTop: 4, opacity: 0.7 }}>{lv.reason}</p>}
            </div>
          );
        })}
      </div>

      {/* New Leave Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#1B2A4A', borderRadius: '24px 24px 0 0', padding: 24, maxHeight: '85dvh', overflowY: 'auto', animation: 'slideUp 0.3s ease' }}>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 20 }}>{t('leave.newRequest')}</h2>

            <p style={{ color: SILVER, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{t('leave.leaveType')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {LEAVE_TYPES.map(lt => (
                <button key={lt.key} onClick={() => setLeaveType(lt.key)} style={{
                  padding: '8px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: leaveType === lt.key ? lt.bg : GLASS,
                  color: leaveType === lt.key ? lt.color : SILVER,
                  border: leaveType === lt.key ? `1px solid ${lt.color}40` : `1px solid ${GLASS_BORDER}`,
                }}>
                  {lt.emoji} {t(`leave.${lt.key}`)}
                </button>
              ))}
            </div>

            <p style={{ color: SILVER, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t('leave.startDate')}</p>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" style={{ marginBottom: 12 }} />

            <p style={{ color: SILVER, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t('leave.endDate')}</p>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" style={{ marginBottom: 12 }} />

            <p style={{ color: SILVER, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t('leave.reason')}</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder={t('leave.reasonPlaceholder')} className="input" rows={3} style={{ marginBottom: 20, resize: 'none' }} />

            <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: 14, background: RED, color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? '...' : t('leave.submitRequest')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
