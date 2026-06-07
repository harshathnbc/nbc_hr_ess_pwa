'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

const NAVY = '#1B2A4A';
const NAVY_DEEP = '#0F1A2E';
const RED = '#C8102E';
const SILVER = '#8E99A8';
const LIGHT = '#C4CDD9';
const GLASS = 'rgba(255,255,255,0.06)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';

const STATUS: Record<string, { color: string; bg: string }> = {
  pending: { color: '#FFB020', bg: 'rgba(255,176,32,0.12)' },
  approved: { color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  rejected: { color: '#FF4D6A', bg: 'rgba(255,77,106,0.12)' },
  cancelled: { color: SILVER, bg: GLASS },
};

interface LeaveRequest {
  id: number;
  leave_type: string;
  status: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

interface Profile {
  id: number;
}

const TYPES = [
  {
    value: 'annual',
    labelKey: 'leave.annual',
    emoji: '🏖️',
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.12)',
  },
  {
    value: 'sick',
    labelKey: 'leave.sick',
    emoji: '🏥',
    color: '#FF4D6A',
    bg: 'rgba(255,77,106,0.12)',
  },
  {
    value: 'emergency',
    labelKey: 'leave.emergency',
    emoji: '🚨',
    color: '#FFB020',
    bg: 'rgba(255,176,32,0.12)',
  },
  {
    value: 'unpaid',
    labelKey: 'leave.unpaid',
    emoji: '📋',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.12)',
  },
  {
    value: 'other',
    labelKey: 'leave.other',
    emoji: '📝',
    color: SILVER,
    bg: GLASS,
  },
];

export default function LeavePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const me = await api.get('/hr/api/v1/me/');
      setProfile(me.data);
      const lr = await api.get('/hr/api/v1/leave-requests/', {
        params: { employee: me.data.id },
      });
      setLeaves(lr.data.results || lr.data || []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || 'Failed to load.';
      alert(`${t('common.error')}\n\n${msg}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      alert(`${t('common.error')}\n\n${t('leave.enterDates')}`);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/hr/api/v1/leave-requests/', {
        employee: profile?.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
      });
      alert(`${t('leave.submitted')}\n\n${t('leave.sentForApproval')}`);
      setShowForm(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchData();
    } catch (err: unknown) {
      const d = (
        err as {
          response?: {
            data?: string | { start_date?: string[]; detail?: string };
          };
        }
      )?.response?.data;
      const msg =
        typeof d === 'string'
          ? d
          : (d as { start_date?: string[] })?.start_date?.[0] ||
            (d as { detail?: string })?.detail ||
            'Failed.';
      alert(`${t('common.error')}\n\n${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100dvh',
          backgroundColor: NAVY_DEEP,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: RED,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div
        style={{
          minHeight: '100dvh',
          backgroundColor: NAVY_DEEP,
          position: 'relative',
        }}
      >
        <div
          style={{
            overflowY: 'auto',
            height: '100dvh',
            paddingBottom: 40,
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: NAVY,
              paddingTop: 60,
              paddingBottom: 28,
              paddingLeft: 24,
              paddingRight: 24,
              borderRadius: '0 0 32px 32px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              }}
            >
              <div>
                <p
                  style={{
                    color: SILVER,
                    fontSize: 13,
                    letterSpacing: 0.5,
                    margin: 0,
                  }}
                >
                  {t('leave.title')}
                </p>
                <h1
                  style={{
                    color: '#fff',
                    fontSize: 28,
                    fontWeight: 900,
                    letterSpacing: -0.5,
                    
                    marginTop: 4,
                  }}
                >
                  {t('leave.requests')}
                </h1>
              </div>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  backgroundColor: RED,
                  borderRadius: 16,
                  paddingLeft: 20,
                  paddingRight: 20,
                  paddingTop: 12,
                  paddingBottom: 12,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(200,16,46,0.4)',
                }}
              >
                <span
                  style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}
                >
                  {t('leave.newButton')}
                </span>
              </button>
            </div>
          </div>

          {/* Leave List */}
          <div
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 18,
              paddingBottom: 40,
            }}
          >
            {leaves.length === 0 ? (
              <div
                style={{
                  backgroundColor: GLASS,
                  borderRadius: 22,
                  padding: 40,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  border: `1px solid ${GLASS_BORDER}`,
                }}
              >
                <span style={{ fontSize: 40, marginBottom: 14 }}>🏖️</span>
                <span
                  style={{
                    color: SILVER,
                    fontSize: 14,
                    textAlign: 'center',
                  }}
                >
                  {t('leave.noRequests')}
                </span>
              </div>
            ) : (
              leaves.map((l) => {
                const typeObj =
                  TYPES.find((x) => x.value === l.leave_type) || TYPES[4];
                const s = STATUS[l.status] || STATUS.cancelled;
                const statusLabel = t(`leave.${l.status}`) || l.status;
                return (
                  <div
                    key={l.id}
                    style={{
                      backgroundColor: GLASS,
                      borderRadius: 20,
                      padding: 18,
                      marginBottom: 10,
                      borderLeft: `3px solid ${typeObj.color}`,
                      border: `1px solid ${GLASS_BORDER}`,
                      borderLeftWidth: 3,
                      borderLeftStyle: 'solid',
                      borderLeftColor: typeObj.color,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          color: '#fff',
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                      >
                        {typeObj.emoji} {t(typeObj.labelKey)}
                      </span>
                      <span
                        style={{
                          backgroundColor: s.bg,
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 20,
                          border: `1px solid ${s.color}30`,
                          color: s.color,
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p
                      style={{
                        color: LIGHT,
                        fontSize: 13,
                        margin: 0,
                      }}
                    >
                      {l.start_date} → {l.end_date}
                    </p>
                    {l.reason && (
                      <p
                        style={{
                          color: SILVER,
                          fontSize: 12,
                          
                          marginTop: 6,
                        }}
                      >
                        {l.reason}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Sheet Modal */}
        {showForm && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              justifyContent: 'flex-end',
              flexDirection: 'column',
              zIndex: 1000,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowForm(false);
            }}
          >
            <div
              style={{
                backgroundColor: NAVY,
                borderRadius: '32px 32px 0 0',
                padding: 28,
                maxHeight: '88%',
                overflowY: 'auto',
                borderTop: `1px solid ${GLASS_BORDER}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                }}
              >
                <h2
                  style={{
                    color: '#fff',
                    fontSize: 24,
                    fontWeight: 900,
                    margin: 0,
                  }}
                >
                  {t('leave.newRequest')}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <span style={{ color: SILVER, fontSize: 28 }}>✕</span>
                </button>
              </div>

              <p
                style={{
                  color: LIGHT,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  
                  marginBottom: 12,
                }}
              >
                {t('leave.leaveType')}
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 24,
                }}
              >
                {TYPES.map((typeObj) => (
                  <button
                    key={typeObj.value}
                    onClick={() => setLeaveType(typeObj.value)}
                    style={{
                      backgroundColor:
                        leaveType === typeObj.value ? typeObj.bg : GLASS,
                      borderRadius: 14,
                      paddingLeft: 16,
                      paddingRight: 16,
                      paddingTop: 12,
                      paddingBottom: 12,
                      border: `1.5px solid ${
                        leaveType === typeObj.value
                          ? `${typeObj.color}50`
                          : GLASS_BORDER
                      }`,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        color:
                          leaveType === typeObj.value
                            ? typeObj.color
                            : SILVER,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {typeObj.emoji} {t(typeObj.labelKey)}
                    </span>
                  </button>
                ))}
              </div>

              {[
                {
                  label: t('leave.startDate'),
                  val: startDate,
                  set: setStartDate,
                },
                {
                  label: t('leave.endDate'),
                  val: endDate,
                  set: setEndDate,
                },
              ].map((f, i) => (
                <div key={i}>
                  <p
                    style={{
                      color: LIGHT,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      
                      marginBottom: 8,
                    }}
                  >
                    {f.label}
                  </p>
                  <input
                    type="date"
                    value={f.val}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    style={{
                      backgroundColor: GLASS,
                      borderRadius: 16,
                      padding: 18,
                      color: '#fff',
                      fontSize: 16,
                      border: `1px solid ${GLASS_BORDER}`,
                      marginBottom: 18,
                      width: '100%',
                      boxSizing: 'border-box',
                      outline: 'none',
                      colorScheme: 'dark',
                    }}
                  />
                </div>
              ))}

              <p
                style={{
                  color: LIGHT,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  
                  marginBottom: 8,
                }}
              >
                {t('leave.reason')}
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('leave.reasonPlaceholder')}
                style={{
                  backgroundColor: GLASS,
                  borderRadius: 16,
                  padding: 18,
                  color: '#fff',
                  fontSize: 16,
                  border: `1px solid ${GLASS_BORDER}`,
                  marginBottom: 28,
                  minHeight: 80,
                  width: '100%',
                  boxSizing: 'border-box',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />

              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  backgroundColor: submitting ? '#4A5568' : RED,
                  borderRadius: 18,
                  paddingTop: 18,
                  paddingBottom: 18,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting
                    ? 'none'
                    : '0 4px 16px rgba(200,16,46,0.4)',
                  marginBottom: 20,
                }}
              >
                {submitting ? (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                ) : (
                  <span
                    style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}
                  >
                    {t('leave.submitRequest')}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}