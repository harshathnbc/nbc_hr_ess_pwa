'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

const NAVY = '#1B2A4A', NAVY_DEEP = '#0F1A2E', RED = '#C8102E', SILVER = '#8E99A8',
  GLASS = 'rgba(255,255,255,0.06)', GLASS_BORDER = 'rgba(255,255,255,0.10)',
  GREEN = '#34D399', YELLOW = '#FFB020', ORANGE = '#FF8C42', PINK = '#FF4D6A';

interface Profile {
  id: number; first_name: string; last_name: string; employee_code: string;
  iqama_number: string; iqama_expiry_date: string; passport_number: string;
  passport_expiry_date: string; joining_date: string; employee_contact_number: string;
  nationality?: { name_en: string }; workarea?: { name_en: string };
  sponsor?: { name_en: string }; employee_type?: { name_en: string };
}

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? t('home.greetingMorning') : h < 17 ? t('home.greetingAfternoon') : t('home.greetingEvening'));
  }, [t]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/hr/api/v1/me/');
      setProfile(res.data);
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const calcExpiry = (dateStr: string | null) => {
    if (!dateStr) return { days: null, color: SILVER, label: t('home.na'), bg: GLASS };
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    if (days < 0) return { days, color: PINK, label: t('home.expired'), bg: 'rgba(255,77,106,0.12)' };
    if (days <= 30) return { days, color: YELLOW, label: `${days} ${t('home.daysLeft')}`, bg: 'rgba(255,176,32,0.12)' };
    if (days <= 60) return { days, color: ORANGE, label: `${days} ${t('home.daysLeft')}`, bg: 'rgba(255,140,66,0.12)' };
    return { days, color: GREEN, label: `${days} ${t('home.daysLeft')}`, bg: 'rgba(52,211,153,0.12)' };
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80dvh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: RED, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`;
  const iqama = calcExpiry(profile?.iqama_expiry_date || null);
  const passport = calcExpiry(profile?.passport_expiry_date || null);

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Header */}
      <div style={{ background: NAVY, paddingTop: 48, paddingBottom: 72, paddingInline: 20, borderRadius: '0 0 28px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, padding: '5px 12px', borderRadius: 20, color: SILVER, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{t('home.nbcEss')}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)', padding: '4px 10px', borderRadius: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: GREEN }} />
            <span style={{ color: GREEN, fontSize: 10, fontWeight: 700 }}>{t('common.online')}</span>
          </span>
        </div>
        <p style={{ color: SILVER, fontSize: 14 }}>{greeting} 👋</p>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 900, marginTop: 4, letterSpacing: -0.5 }}>{profile?.first_name} {profile?.last_name}</h1>
      </div>

      {/* Profile Card */}
      <div style={{ margin: '-48px 16px 0', background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 22, padding: 18, backdropFilter: 'blur(12px)', animation: 'fadeIn 0.5s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 18, background: 'rgba(200,16,46,0.15)', border: '1.5px solid rgba(200,16,46,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: RED, fontSize: 17, fontWeight: 900 }}>{initials}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ background: 'rgba(200,16,46,0.12)', border: '1px solid rgba(200,16,46,0.2)', padding: '3px 10px', borderRadius: 20, color: RED, fontSize: 11, fontWeight: 700 }}>{profile?.employee_code || '—'}</span>
              <span style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)', padding: '3px 10px', borderRadius: 20, color: GREEN, fontSize: 11, fontWeight: 700 }}>{profile?.employee_type?.name_en || '—'}</span>
            </div>
            <p style={{ color: SILVER, fontSize: 12, marginTop: 6 }}>{profile?.workarea?.name_en || '—'}</p>
          </div>
        </div>
      </div>

      {/* Iqama Alert */}
      {iqama.days !== null && iqama.days <= 60 && (
        <div style={{ margin: '14px 16px 0', background: iqama.bg, borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${iqama.color}30` }}>
          <span style={{ fontSize: 22 }}>{iqama.days < 0 ? '⚠️' : '⏰'}</span>
          <div>
            <p style={{ color: iqama.color, fontSize: 13, fontWeight: 800 }}>{iqama.days < 0 ? 'Iqama Expired!' : `Iqama expires in ${iqama.days} days`}</p>
            <p style={{ color: SILVER, fontSize: 11, marginTop: 2 }}>Expiry: {profile?.iqama_expiry_date}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ padding: '20px 16px 0' }}>
        <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 12 }}>{t('home.quickActions')}</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { emoji: '📍', label: t('home.checkIn'), color: GREEN, bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.2)', href: '/attendance' },
            { emoji: '🏖️', label: t('home.leave'), color: YELLOW, bg: 'rgba(255,176,32,0.10)', border: 'rgba(255,176,32,0.2)', href: '/leave' },
            { emoji: '💰', label: t('home.payslip'), color: RED, bg: 'rgba(200,16,46,0.10)', border: 'rgba(200,16,46,0.2)', href: '/payslip' },
          ].map((item, i) => (
            <button key={i} onClick={() => router.push(item.href)} style={{ flex: 1, background: item.bg, borderRadius: 20, padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, border: `1px solid ${item.border}`, cursor: 'pointer' }}>
              <span style={{ fontSize: 28 }}>{item.emoji}</span>
              <span style={{ color: item.color, fontSize: 12, fontWeight: 700 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Document Status */}
      <div style={{ padding: '20px 16px 0' }}>
        <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 12 }}>{t('home.documentStatus')}</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { title: t('home.iqama'), exp: iqama, number: profile?.iqama_number, date: profile?.iqama_expiry_date },
            { title: t('home.passport'), exp: passport, number: profile?.passport_number, date: profile?.passport_expiry_date },
          ].map((doc, i) => (
            <div key={i} style={{ flex: 1, background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 20, padding: 16 }}>
              <p style={{ color: SILVER, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>{doc.title.toUpperCase()}</p>
              <span style={{ display: 'inline-block', background: doc.exp.bg, padding: '4px 10px', borderRadius: 10, color: doc.exp.color, fontSize: 12, fontWeight: 800, marginBottom: 10 }}>{doc.exp.label}</span>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{doc.number || '—'}</p>
              <p style={{ color: SILVER, fontSize: 11, marginTop: 4 }}>Exp: {doc.date || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Details */}
      <div style={{ padding: '20px 16px 0' }}>
        <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 12 }}>{t('home.details')}</h2>
        <div style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 20, padding: 16 }}>
          {[
            { label: t('home.nationality'), value: profile?.nationality?.name_en },
            { label: t('home.workArea'), value: profile?.workarea?.name_en },
            { label: t('home.sponsor'), value: profile?.sponsor?.name_en },
            { label: t('home.joiningDate'), value: profile?.joining_date },
            { label: t('home.contact'), value: profile?.employee_contact_number },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${GLASS_BORDER}` : 'none' }}>
              <span style={{ color: SILVER, fontSize: 13 }}>{item.label}</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{item.value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
