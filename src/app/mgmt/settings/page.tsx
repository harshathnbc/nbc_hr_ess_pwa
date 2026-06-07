'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api, { TOKEN_KEY, REFRESH_KEY } from '@/utils/api';

/* ── MenuItem Component ─────────────────────────────────────── */
function MenuItem({ emoji, label, subtitle, color = '#4F46E5', onPress, danger }: {
  emoji: string; label: string; subtitle?: string; color?: string; onPress?: () => void; danger?: boolean;
}) {
  return (
    <div
      onClick={onPress}
      style={{
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
        border: danger ? '1.5px solid #FECACA' : '1.5px solid transparent',
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 14,
        backgroundColor: danger ? '#FEF2F2' : `${color}12`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: danger ? '#DC2626' : '#1E293B', fontSize: 15, fontWeight: 700 }}>{label}</div>
        {subtitle && <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <span style={{ color: '#CBD5E1', fontSize: 18 }}>›</span>
    </div>
  );
}

/* ── Interfaces ─────────────────────────────────────────────── */
interface UserData {
  first_name?: string;
  last_name?: string;
  employee_code?: string;
  employee_type?: { name_en: string };
}

/* ══════════════════════════════════════════════════════════════
   ██  SETTINGS SCREEN
   ══════════════════════════════════════════════════════════════ */
export default function MgmtSettings() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<UserData | null>(null);
  const lang = i18n.language || 'en';

  useEffect(() => {
    api.get('/hr/api/v1/me/').then(r => setUser(r.data)).catch(() => {});
  }, []);

  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
  const initials = user ? `${(user.first_name || '?')[0]}${(user.last_name || '')[0] || ''}` : '?';

  const setLang = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const logout = () => {
    if (window.confirm(`${t('common.signOut')}\n\n${t('common.signOutConfirm')}`)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      router.replace('/login');
    }
  };

  const openWebPortal = () => {
    window.open('https://www.nbcerp.com', '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', overflowY: 'auto' }}>
      {/* ── Header ── */}
      <div style={{ backgroundColor: '#64748B', paddingTop: 56, paddingBottom: 24, paddingLeft: 24, paddingRight: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <div style={{ color: '#E2E8F0', fontSize: 13 }}>{t('mgmtSettings.management')}</div>
        <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginTop: 4 }}>{t('mgmtSettings.settings')}</div>
      </div>

      {/* ── Logged-in User Card ── */}
      <div style={{ margin: '0 16px', marginTop: -16 }}>
        <div style={{
          backgroundColor: '#fff', borderRadius: 20, padding: 18,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 18, backgroundColor: '#4F46E5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>{initials}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#1E293B', fontSize: 17, fontWeight: 800 }}>{userName || t('common.loading')}</div>
            <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 3 }}>{user?.employee_code || ''} • {user?.employee_type?.name_en || t('mgmtSettings.manager')}</div>
          </div>
          <div style={{ backgroundColor: '#ECFDF5', padding: '5px 10px', borderRadius: 12 }}>
            <span style={{ color: '#16A34A', fontSize: 10, fontWeight: 800 }}>{t('common.online')}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        {/* ── Language Toggle ── */}
        <div style={{ color: '#64748B', fontSize: 12, fontWeight: 700, marginBottom: 8, marginLeft: 4 }}>{t('mgmtSettings.language')}</div>
        <div style={{
          backgroundColor: '#fff', borderRadius: 16, padding: 5, marginBottom: 16,
          display: 'flex', border: '1px solid #E2E8F0',
        }}>
          <button
            onClick={() => setLang('en')}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
              backgroundColor: lang === 'en' ? '#4F46E5' : 'transparent',
              color: lang === 'en' ? '#fff' : '#94A3B8',
              fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
            }}
          >
            English
          </button>
          <button
            onClick={() => setLang('ar')}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
              backgroundColor: lang === 'ar' ? '#4F46E5' : 'transparent',
              color: lang === 'ar' ? '#fff' : '#94A3B8',
              fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
            }}
          >
            عربي
          </button>
        </div>

        {/* ── Portal ── */}
        <div style={{ color: '#64748B', fontSize: 12, fontWeight: 700, marginBottom: 8, marginLeft: 4 }}>{t('mgmtSettings.portal')}</div>
        <MenuItem emoji="👤" label={t('mgmtSettings.employeeView')} subtitle={t('mgmtSettings.switchToEss')} color="#4F46E5" onPress={() => router.replace('/home')} />
        <MenuItem emoji="🔔" label={t('mgmtSettings.notifications')} subtitle={t('mgmtSettings.alertPrefs')} color="#D97706" onPress={() => window.alert(`${t('common.comingSoon')}\n\n${t('mgmtSettings.pushNotifV2')}`)} />

        {/* ── Information ── */}
        <div style={{ color: '#64748B', fontSize: 12, fontWeight: 700, marginTop: 16, marginBottom: 8, marginLeft: 4 }}>{t('mgmtSettings.information')}</div>
        <MenuItem emoji="🏢" label={t('mgmtSettings.companyInfo')} subtitle="National Basics Company" color="#D97706" onPress={() => window.alert('NBC\n\nAl-Khobar, Saudi Arabia\nwww.national-basics.com')} />
        <MenuItem emoji="🌐" label={t('mgmtSettings.webPortal')} subtitle="nbcerp.com" color="#2563EB" onPress={openWebPortal} />
        <MenuItem emoji="ℹ️" label={t('mgmtSettings.about')} subtitle="Version 1.0.0" color="#7C3AED" onPress={() => window.alert('NBC HR ESS\n\nv1.0.0 • Management Portal')} />

        {/* ── Account ── */}
        <div style={{ color: '#64748B', fontSize: 12, fontWeight: 700, marginTop: 16, marginBottom: 8, marginLeft: 4 }}>{t('mgmtSettings.account')}</div>
        <MenuItem emoji="🚪" label={t('mgmtSettings.signOut')} subtitle={t('mgmtSettings.signOutSubtitle')} onPress={logout} danger />
      </div>

      <div style={{ height: 40 }} />
    </div>
  );
}
