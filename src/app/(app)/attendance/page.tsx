'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';

const NAVY = '#1B2A4A', NAVY_DEEP = '#0F1A2E', RED = '#C8102E', SILVER = '#8E99A8',
  GLASS = 'rgba(255,255,255,0.06)', GLASS_BORDER = 'rgba(255,255,255,0.10)', GREEN = '#34D399';

interface AttendanceRecord { id: number; date: string; check_in: string | null; check_out: string | null; }

export default function AttendancePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<{ id: number } | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    try {
      const me = await api.get('/hr/api/v1/me/');
      setProfile(me.data);
      const att = await api.get('/hr/api/v1/attendance/', { params: { employee: me.data.id } });
      const records: AttendanceRecord[] = att.data.results || att.data;
      const today = records.find(r => r.date === todayStr);
      setTodayRecord(today || null);
      setHistory(records.filter(r => r.date !== todayStr).slice(0, 14));
    } catch { /* */ }
    finally { setLoading(false); }
  }, [todayStr]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckIn = async () => {
    if (!profile) return;
    setCheckingIn(true);
    try {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      await api.post('/hr/api/v1/attendance/', { employee: profile.id, date: todayStr, check_in: timeStr });
      await fetchData();
    } catch { alert(t('attendance.checkInFailed')); }
    finally { setCheckingIn(false); }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    setCheckingIn(true);
    try {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      await api.patch(`/hr/api/v1/attendance/${todayRecord.id}/`, { check_out: timeStr });
      await fetchData();
    } catch { alert(t('attendance.checkOutFailed')); }
    finally { setCheckingIn(false); }
  };

  const formatTime = (t: string | null) => t ? t.slice(0, 5) : '—';

  const getElapsed = () => {
    if (!todayRecord?.check_in) return null;
    const [h, m, s] = todayRecord.check_in.split(':').map(Number);
    const start = new Date(); start.setHours(h, m, s || 0, 0);
    const diff = Math.max(0, Math.floor((currentTime.getTime() - start.getTime()) / 1000));
    const hrs = Math.floor(diff / 3600), mins = Math.floor((diff % 3600) / 60), secs = diff % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getHoursWorked = (rec: AttendanceRecord) => {
    if (!rec.check_in || !rec.check_out) return '—';
    const [h1, m1] = rec.check_in.split(':').map(Number);
    const [h2, m2] = rec.check_out.split(':').map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const dayName = currentTime.toLocaleDateString('en', { weekday: 'long' });
  const dateStr = currentTime.toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeDisplay = currentTime.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const hasCheckedIn = !!todayRecord?.check_in;
  const hasCheckedOut = !!todayRecord?.check_out;
  const elapsed = getElapsed();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80dvh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: RED, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Header */}
      <div style={{ background: NAVY, paddingTop: 48, paddingBottom: 24, paddingInline: 20, borderRadius: '0 0 28px 28px', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{t('attendance.title')}</h1>
        <p style={{ color: SILVER, fontSize: 13, marginTop: 4 }}>{dayName}, {dateStr}</p>
      </div>

      {/* Clock Card */}
      <div style={{ margin: '16px 16px 0', background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 22, padding: 24, textAlign: 'center' }}>
        <p style={{ color: SILVER, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{t('attendance.currentTime').toUpperCase()}</p>
        <p style={{ color: '#fff', fontSize: 36, fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: -1 }}>{timeDisplay}</p>

        {hasCheckedIn && !hasCheckedOut && elapsed && (
          <div style={{ marginTop: 16 }}>
            <p style={{ color: SILVER, fontSize: 11, fontWeight: 700 }}>{t('attendance.workingFor')}</p>
            <p style={{ color: GREEN, fontSize: 28, fontWeight: 900, fontVariantNumeric: 'tabular-nums', animation: 'pulse 2s ease-in-out infinite' }}>{elapsed}</p>
          </div>
        )}

        {/* IN / OUT / Total */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20 }}>
          <div>
            <p style={{ color: SILVER, fontSize: 10, fontWeight: 700 }}>{t('attendance.in')}</p>
            <p style={{ color: GREEN, fontSize: 16, fontWeight: 800 }}>{formatTime(todayRecord?.check_in || null)}</p>
          </div>
          <div style={{ width: 1, background: GLASS_BORDER }} />
          <div>
            <p style={{ color: SILVER, fontSize: 10, fontWeight: 700 }}>{t('attendance.out')}</p>
            <p style={{ color: RED, fontSize: 16, fontWeight: 800 }}>{formatTime(todayRecord?.check_out || null)}</p>
          </div>
          <div style={{ width: 1, background: GLASS_BORDER }} />
          <div>
            <p style={{ color: SILVER, fontSize: 10, fontWeight: 700 }}>{t('attendance.totalHours')}</p>
            <p style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>{todayRecord ? getHoursWorked(todayRecord) : '—'}</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ padding: '16px 16px 0' }}>
        {!hasCheckedIn ? (
          <button onClick={handleCheckIn} disabled={checkingIn} style={{ width: '100%', padding: 16, background: GREEN, color: '#fff', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: 'pointer', opacity: checkingIn ? 0.6 : 1 }}>
            {checkingIn ? '...' : `📍 ${t('attendance.checkInNow')}`}
          </button>
        ) : !hasCheckedOut ? (
          <button onClick={handleCheckOut} disabled={checkingIn} style={{ width: '100%', padding: 16, background: RED, color: '#fff', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: 'pointer', opacity: checkingIn ? 0.6 : 1 }}>
            {checkingIn ? '...' : `🏠 ${t('attendance.checkOut')}`}
          </button>
        ) : (
          <div style={{ width: '100%', padding: 16, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, textAlign: 'center', color: GREEN, fontSize: 16, fontWeight: 800 }}>
            {t('attendance.dayComplete')}
          </div>
        )}
      </div>

      {/* History */}
      <div style={{ padding: '20px 16px 0' }}>
        <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 12 }}>{t('attendance.recentHistory')}</h2>
        {history.length === 0 ? (
          <p style={{ color: SILVER, fontSize: 13, textAlign: 'center', padding: 20 }}>{t('attendance.noRecords')}</p>
        ) : history.map((rec, i) => (
          <div key={i} style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 14, padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{rec.date}</p>
              <p style={{ color: SILVER, fontSize: 11, marginTop: 2 }}>{formatTime(rec.check_in)} → {formatTime(rec.check_out)}</p>
            </div>
            <span style={{ color: GREEN, fontSize: 13, fontWeight: 700 }}>{getHoursWorked(rec)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
