'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

const NAVY = '#1B2A4A';
const NAVY_DEEP = '#0F1A2E';
const NAVY_LIGHT = '#243656';
const RED = '#C8102E';
const SILVER = '#8E99A8';
const LIGHT = '#C4CDD9';
const GLASS = 'rgba(255,255,255,0.06)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';

interface Profile {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  iqama_number: string;
  iqama_expiry_date: string;
  passport_number: string;
  passport_expiry_date: string;
  joining_date: string;
  employee_contact_number: string;
  nationality?: { name_en: string };
  workarea?: { name_en: string };
  sponsor?: { name_en: string };
  employee_type?: { name_en: string };
}

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(
      h < 12
        ? t('home.greetingMorning')
        : h < 17
        ? t('home.greetingAfternoon')
        : t('home.greetingEvening')
    );
  }, [t]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/hr/api/v1/me/');
      setProfile(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || 'Failed to load profile.';
      alert(`${t('common.error')}\n\n${msg}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const today = new Date();

  const calcExpiry = (dateStr: string | null | undefined) => {
    if (!dateStr)
      return { days: null as number | null, color: SILVER, label: t('home.na'), bg: GLASS };
    const days = Math.ceil(
      (new Date(dateStr).getTime() - today.getTime()) / 86400000
    );
    if (days < 0)
      return {
        days,
        color: '#FF4D6A',
        label: t('home.expired'),
        bg: 'rgba(255,77,106,0.12)',
      };
    if (days <= 30)
      return {
        days,
        color: '#FFB020',
        label: `${days} ${t('home.daysLeft')}`,
        bg: 'rgba(255,176,32,0.12)',
      };
    if (days <= 60)
      return {
        days,
        color: '#FF8C42',
        label: `${days} ${t('home.daysLeft')}`,
        bg: 'rgba(255,140,66,0.12)',
      };
    return {
      days,
      color: '#34D399',
      label: `${days} ${t('home.daysLeft')}`,
      bg: 'rgba(52,211,153,0.12)',
    };
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

  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`;
  const iqama = calcExpiry(profile?.iqama_expiry_date);
  const passport = calcExpiry(profile?.passport_expiry_date);

  return (
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
          paddingBottom: 80,
          paddingLeft: 24,
          paddingRight: 24,
          borderRadius: '0 0 32px 32px',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              backgroundColor: GLASS,
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 6,
              paddingBottom: 6,
              borderRadius: 20,
              border: `1px solid ${GLASS_BORDER}`,
            }}
          >
            <span
              style={{
                color: SILVER,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              {t('home.nbcEss')}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(52,211,153,0.12)',
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 5,
              paddingBottom: 5,
              borderRadius: 20,
              border: '1px solid rgba(52,211,153,0.2)',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#34D399',
              }}
            />
            <span
              style={{ color: '#34D399', fontSize: 10, fontWeight: 700 }}
            >
              {t('common.online')}
            </span>
          </div>
        </div>
        <p style={{ color: SILVER, fontSize: 14, margin: 0 }}>
          {greeting} 👋
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
          {profile?.first_name} {profile?.last_name}
        </h1>
      </div>

      {/* Profile Card — Glass overlay */}
      <div
        style={{
          marginTop: -50,
          marginLeft: 16,
          marginRight: 16,
        }}
      >
        <div
          style={{
            backgroundColor: GLASS,
            borderRadius: 24,
            padding: 20,
            border: `1px solid ${GLASS_BORDER}`,
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 20,
                backgroundColor: 'rgba(200,16,46,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid rgba(200,16,46,0.3)',
                flexShrink: 0,
              }}
            >
              <span style={{ color: RED, fontSize: 18, fontWeight: 900 }}>
                {initials}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    backgroundColor: 'rgba(200,16,46,0.12)',
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderRadius: 20,
                    border: '1px solid rgba(200,16,46,0.2)',
                    color: RED,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {profile?.employee_code || '—'}
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(52,211,153,0.12)',
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderRadius: 20,
                    border: '1px solid rgba(52,211,153,0.2)',
                    color: '#34D399',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {profile?.employee_type?.name_en || '—'}
                </span>
              </div>
              <p style={{ color: SILVER, fontSize: 12, marginTop: 6 }}>
                {profile?.workarea?.name_en || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {iqama.days !== null && iqama.days <= 60 && (
        <div
          style={{
            marginLeft: 16,
            marginRight: 16,
            marginTop: 14,
            backgroundColor: iqama.bg,
            borderRadius: 18,
            padding: 16,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            border: `1px solid ${iqama.color}30`,
          }}
        >
          <span style={{ fontSize: 22 }}>
            {iqama.days < 0 ? '⚠️' : '⏰'}
          </span>
          <div style={{ flex: 1 }}>
            <p
              style={{
                color: iqama.color,
                fontSize: 14,
                fontWeight: 800,
                margin: 0,
              }}
            >
              {iqama.days < 0
                ? 'Iqama Expired!'
                : `Iqama expires in ${iqama.days} days`}
            </p>
            <p
              style={{
                color: SILVER,
                fontSize: 12,
                
                marginTop: 2,
              }}
            >
              Expiry: {profile?.iqama_expiry_date}
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ paddingLeft: 16, paddingRight: 16, marginTop: 22 }}>
        <h2
          style={{
            color: '#fff',
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: -0.3,
            
            marginBottom: 14,
          }}
        >
          {t('home.quickActions')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
          {[
            {
              emoji: '📍',
              label: t('home.checkIn'),
              color: '#34D399',
              bg: 'rgba(52,211,153,0.10)',
              border: 'rgba(52,211,153,0.2)',
              href: '/attendance',
            },
            {
              emoji: '🏖️',
              label: t('home.leave'),
              color: '#FFB020',
              bg: 'rgba(255,176,32,0.10)',
              border: 'rgba(255,176,32,0.2)',
              href: '/leave',
            },
            {
              emoji: '💰',
              label: t('home.payslip'),
              color: RED,
              bg: 'rgba(200,16,46,0.10)',
              border: 'rgba(200,16,46,0.2)',
              href: '/payslip',
            },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => router.push(item.href)}
              style={{
                flex: 1,
                backgroundColor: item.bg,
                borderRadius: 22,
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                border: `1px solid ${item.border}`,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 30 }}>{item.emoji}</span>
              <span
                style={{ color: item.color, fontSize: 13, fontWeight: 700 }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Document Status */}
      <div style={{ paddingLeft: 16, paddingRight: 16, marginTop: 22 }}>
        <h2
          style={{
            color: '#fff',
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: -0.3,
            
            marginBottom: 14,
          }}
        >
          {t('home.documentStatus')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
          {[
            {
              title: t('home.iqama'),
              exp: iqama,
              number: profile?.iqama_number,
              date: profile?.iqama_expiry_date,
            },
            {
              title: t('home.passport'),
              exp: passport,
              number: profile?.passport_number,
              date: profile?.passport_expiry_date,
            },
          ].map((doc, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                backgroundColor: GLASS,
                borderRadius: 22,
                padding: 18,
                border: `1px solid ${GLASS_BORDER}`,
              }}
            >
              <p
                style={{
                  color: SILVER,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  
                  marginBottom: 10,
                }}
              >
                {doc.title.toUpperCase()}
              </p>
              <div
                style={{
                  backgroundColor: doc.exp.bg,
                  paddingLeft: 10,
                  paddingRight: 10,
                  paddingTop: 5,
                  paddingBottom: 5,
                  borderRadius: 12,
                  display: 'inline-block',
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    color: doc.exp.color,
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {doc.exp.label}
                </span>
              </div>
              <p
                style={{
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {doc.number || '—'}
              </p>
              <p
                style={{
                  color: SILVER,
                  fontSize: 11,
                  
                  marginTop: 4,
                }}
              >
                Exp: {doc.date || '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Details */}
      <div style={{ paddingLeft: 16, paddingRight: 16, marginTop: 22 }}>
        <h2
          style={{
            color: '#fff',
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: -0.3,
            
            marginBottom: 14,
          }}
        >
          {t('home.details')}
        </h2>
        <div
          style={{
            backgroundColor: GLASS,
            borderRadius: 22,
            padding: 18,
            border: `1px solid ${GLASS_BORDER}`,
          }}
        >
          {[
            {
              label: t('home.nationality'),
              value: profile?.nationality?.name_en,
            },
            { label: t('home.workArea'), value: profile?.workarea?.name_en },
            { label: t('home.sponsor'), value: profile?.sponsor?.name_en },
            { label: t('home.joiningDate'), value: profile?.joining_date },
            {
              label: t('home.contact'),
              value: profile?.employee_contact_number,
            },
          ].map((item, i, arr) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: 14,
                paddingBottom: 14,
                borderBottom:
                  i < arr.length - 1
                    ? `1px solid ${GLASS_BORDER}`
                    : 'none',
              }}
            >
              <span style={{ color: SILVER, fontSize: 14 }}>
                {item.label}
              </span>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                {item.value || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}