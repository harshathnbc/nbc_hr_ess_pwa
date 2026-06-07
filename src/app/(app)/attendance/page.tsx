'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
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

interface AttendanceRecord {
  id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  hours_worked: string | null;
}

interface Profile {
  id: number;
}

export default function AttendancePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const today = new Date().toISOString().split('T')[0];
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const meRes = await api.get('/hr/api/v1/me/');
      setProfile(meRes.data);
      const attRes = await api.get('/hr/api/v1/attendance/', {
        params: { employee: meRes.data.id },
      });
      const records: AttendanceRecord[] =
        attRes.data.results || attRes.data || [];
      setTodayRecord(records.find((r) => r.date === today) || null);
      setHistory(records.slice(0, 14));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || 'Failed to load attendance.';
      alert(`${t('common.error')}\n\n${msg}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckIn = async () => {
    if (!profile) return;
    setCheckingIn(true);
    try {
      await api.post('/hr/api/v1/attendance/', {
        employee: profile.id,
        date: today,
        check_in: new Date().toISOString(),
      });
      alert(
        `${t('attendance.checkedIn')}\n\n${t('attendance.time')}: ${new Date().toLocaleTimeString()}`
      );
      fetchData();
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { date?: string[] } } })
        ?.response?.data;
      alert(
        `${t('common.error')}\n\n${errData?.date?.[0] || t('attendance.checkInFailed')}`
      );
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    setCheckingIn(true);
    try {
      await api.patch(`/hr/api/v1/attendance/${todayRecord.id}/`, {
        check_out: new Date().toISOString(),
      });
      alert(
        `${t('attendance.checkedOut')}\n\n${t('attendance.time')}: ${new Date().toLocaleTimeString()}`
      );
      fetchData();
    } catch {
      alert(`${t('common.error')}\n\n${t('attendance.checkOutFailed')}`);
    } finally {
      setCheckingIn(false);
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

  const hasIn = !!todayRecord?.check_in;
  const hasOut = !!todayRecord?.check_out;
  const fmt = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  let elapsed = '00:00:00';
  if (hasIn && !hasOut && todayRecord?.check_in) {
    const d = Math.floor(
      (currentTime.getTime() - new Date(todayRecord.check_in).getTime()) / 1000
    );
    elapsed = `${String(Math.floor(d / 3600)).padStart(2, '0')}:${String(
      Math.floor((d % 3600) / 60)
    ).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`;
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          minHeight: '100dvh',
          backgroundColor: NAVY_DEEP,
          overflowY: 'auto',
          paddingBottom: 32,
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
          <p style={{ color: SILVER, fontSize: 13, letterSpacing: 0.5, margin: 0 }}>
            {t('attendance.title')}
          </p>
          <h1
            style={{
              color: '#fff',
              fontSize: 28,
              fontWeight: 900,
              marginTop: 4,
              letterSpacing: -0.5,
            }}
          >
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </h1>
          <p style={{ color: SILVER, fontSize: 13, marginTop: 4 }}>
            {today}
          </p>
        </div>

        {/* Clock Card */}
        <div style={{ marginLeft: 16, marginRight: 16, marginTop: 20 }}>
          <div
            style={{
              backgroundColor: GLASS,
              borderRadius: 28,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: `1px solid ${GLASS_BORDER}`,
              boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            }}
          >
            <span
              style={{
                color: SILVER,
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 6,
                letterSpacing: 1,
              }}
            >
              {t('attendance.currentTime')}
            </span>
            <span
              style={{
                color: '#fff',
                fontSize: 48,
                fontWeight: 900,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: -1,
              }}
            >
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>

            {hasIn && !hasOut && (
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation: 'pulse 2.4s ease-in-out infinite',
                }}
              >
                <span
                  style={{
                    color: SILVER,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  {t('attendance.workingFor')}
                </span>
                <span
                  style={{
                    color: '#34D399',
                    fontSize: 36,
                    fontWeight: 900,
                    fontVariantNumeric: 'tabular-nums',
                    marginTop: 2,
                  }}
                >
                  {elapsed}
                </span>
              </div>
            )}

            {/* Status Row */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                marginTop: 28,
                marginBottom: 28,
                justifyContent: 'space-around',
              }}
            >
              {[
                {
                  label: t('attendance.in'),
                  value: fmt(todayRecord?.check_in),
                  active: hasIn,
                  color: '#34D399',
                  bg: 'rgba(52,211,153,0.12)',
                },
                {
                  label: t('attendance.out'),
                  value: fmt(todayRecord?.check_out),
                  active: hasOut,
                  color: '#FF4D6A',
                  bg: 'rgba(255,77,106,0.12)',
                },
                {
                  label: t('attendance.totalHours'),
                  value: todayRecord?.hours_worked
                    ? `${todayRecord.hours_worked}h`
                    : '—',
                  active: !!todayRecord?.hours_worked,
                  color: RED,
                  bg: 'rgba(200,16,46,0.12)',
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: s.active ? s.bg : GLASS,
                      borderRadius: 12,
                      paddingLeft: 14,
                      paddingRight: 14,
                      paddingTop: 6,
                      paddingBottom: 6,
                      marginBottom: 6,
                      border: `1px solid ${
                        s.active ? `${s.color}30` : GLASS_BORDER
                      }`,
                    }}
                  >
                    <span
                      style={{
                        color: s.active ? s.color : SILVER,
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: 0.5,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <span
                    style={{
                      color: s.active ? '#fff' : '#4A5568',
                      fontSize: 22,
                      fontWeight: 800,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Button */}
            {!hasIn ? (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                style={{
                  backgroundColor: '#34D399',
                  borderRadius: 20,
                  paddingTop: 18,
                  paddingBottom: 18,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: checkingIn ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 16px rgba(52,211,153,0.4)',
                }}
              >
                {checkingIn ? (
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
                    {t('attendance.checkInNow')}
                  </span>
                )}
              </button>
            ) : !hasOut ? (
              <button
                onClick={handleCheckOut}
                disabled={checkingIn}
                style={{
                  backgroundColor: RED,
                  borderRadius: 20,
                  paddingTop: 18,
                  paddingBottom: 18,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: checkingIn ? 'not-allowed' : 'pointer',
                  boxShadow: `0 6px 16px rgba(200,16,46,0.4)`,
                }}
              >
                {checkingIn ? (
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
                    {t('attendance.checkOut')}
                  </span>
                )}
              </button>
            ) : (
              <div
                style={{
                  backgroundColor: 'rgba(52,211,153,0.12)',
                  borderRadius: 20,
                  paddingTop: 16,
                  paddingBottom: 16,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid rgba(52,211,153,0.3)',
                }}
              >
                <span
                  style={{ color: '#34D399', fontWeight: 900, fontSize: 15 }}
                >
                  {t('attendance.dayComplete')} — {todayRecord?.hours_worked}h
                </span>
              </div>
            )}
          </div>
        </div>

        {/* History */}
        <div
          style={{
            paddingLeft: 16,
            paddingRight: 16,
            marginTop: 22,
          }}
        >
          <h2
            style={{
              color: '#fff',
              fontSize: 17,
              fontWeight: 800,
              marginBottom: 14,
              letterSpacing: -0.3,
            }}
          >
            {t('attendance.recentHistory')}
          </h2>
          {history.length === 0 ? (
            <div
              style={{
                backgroundColor: GLASS,
                borderRadius: 18,
                padding: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${GLASS_BORDER}`,
              }}
            >
              <span style={{ color: SILVER, fontSize: 14 }}>
                {t('attendance.noRecords')}
              </span>
            </div>
          ) : (
            history.map((rec, i) => (
              <div
                key={rec.id || i}
                style={{
                  backgroundColor: GLASS,
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 8,
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: `1px solid ${GLASS_BORDER}`,
                }}
              >
                <div>
                  <p
                    style={{
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {rec.date}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 12,
                      marginTop: 6,
                    }}
                  >
                    <span
                      style={{
                        color: '#34D399',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      ↓ {fmt(rec.check_in)}
                    </span>
                    <span
                      style={{
                        color: '#FF4D6A',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      ↑ {fmt(rec.check_out)}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: rec.hours_worked
                      ? 'rgba(200,16,46,0.12)'
                      : GLASS,
                    paddingLeft: 14,
                    paddingRight: 14,
                    paddingTop: 8,
                    paddingBottom: 8,
                    borderRadius: 12,
                    border: `1px solid ${
                      rec.hours_worked
                        ? 'rgba(200,16,46,0.2)'
                        : GLASS_BORDER
                    }`,
                  }}
                >
                  <span
                    style={{
                      color: rec.hours_worked ? RED : '#4A5568',
                      fontSize: 16,
                      fontWeight: 800,
                    }}
                  >
                    {rec.hours_worked ? `${rec.hours_worked}h` : '—'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
