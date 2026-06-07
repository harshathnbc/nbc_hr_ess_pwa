'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import Link from 'next/link';

interface UserProfile {
  first_name: string;
  last_name: string;
  employee_code: string;
  employee_type?: string;
}

export default function MgmtSettings() {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    api.get('/hr/api/v1/me/').then((res) => {
      setProfile(res.data);
    }).catch(() => {});
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const getInitials = (first: string, last: string) => {
    return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
  };

  const handleSignOut = () => {
    setShowSignOutConfirm(false);
    logout();
  };

  /* ── Styles ── */
  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    color: '#fff',
    padding: '20px 20px 32px',
    borderRadius: '0 0 28px 28px',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    padding: '0 4px',
    marginBottom: 8,
  };

  const menuCard: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  };

  const menuItem: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderBottom: '1px solid #F1F5F9',
    cursor: 'pointer',
    textDecoration: 'none',
    color: '#1E293B',
    transition: 'background 0.15s ease',
  };

  const menuIcon: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
  };

  const modalOverlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  };

  const modalContent: React.CSSProperties = {
    background: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    padding: 24,
    textAlign: 'center' as const,
    animation: 'fadeIn 0.2s ease',
  };

  return (
    <div>
      {/* ── Header ── */}
      <header style={headerStyle} className="safe-top">
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 2 }}>{t('mgmtSettings.management')}</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{t('mgmtSettings.settings')}</div>
      </header>

      <div style={{ padding: '0 16px', marginTop: -16 }}>
        {/* ── User Profile Card ── */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 18,
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #475569, #64748B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            {profile ? getInitials(profile.first_name, profile.last_name) : '??'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
              {profile ? `${profile.first_name} ${profile.last_name}` : '...'}
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              {profile?.employee_code || ''}
            </div>
            {profile?.employee_type && (
              <div
                style={{
                  display: 'inline-block',
                  background: '#F0FDF4',
                  color: '#16A34A',
                  padding: '2px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  marginTop: 6,
                }}
              >
                {profile.employee_type}
              </div>
            )}
          </div>
        </div>

        {/* ── Language ── */}
        <div style={sectionTitle}>{t('mgmtSettings.language')}</div>
        <div style={{ ...menuCard, marginBottom: 20 }}>
          <div style={menuItem} onClick={toggleLanguage}>
            <div style={{ ...menuIcon, background: '#EFF6FF' }}>🌐</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{t('mgmtSettings.language')}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                {i18n.language === 'ar' ? 'العربية' : 'English'}
              </div>
            </div>
            <div
              style={{
                background: '#F1F5F9',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                color: '#4F46E5',
              }}
            >
              {i18n.language === 'ar' ? 'EN' : 'AR'}
            </div>
          </div>
        </div>

        {/* ── Portal ── */}
        <div style={sectionTitle}>{t('mgmtSettings.portal')}</div>
        <div style={{ ...menuCard, marginBottom: 20 }}>
          <Link href="/home" style={{ ...menuItem, borderBottom: 'none' }}>
            <div style={{ ...menuIcon, background: '#FEF2F2' }}>🔄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{t('mgmtSettings.employeeView')}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{t('mgmtSettings.switchToEss')}</div>
            </div>
            <span style={{ fontSize: 16, color: '#CBD5E1' }}>›</span>
          </Link>
        </div>

        {/* ── Notifications ── */}
        <div style={sectionTitle}>{t('mgmtSettings.notifications')}</div>
        <div style={{ ...menuCard, marginBottom: 20 }}>
          <div style={{ ...menuItem, borderBottom: 'none', opacity: 0.5 }}>
            <div style={{ ...menuIcon, background: '#FFFBEB' }}>🔔</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{t('mgmtSettings.alertPrefs')}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{t('mgmtSettings.pushNotifV2')}</div>
            </div>
            <div
              style={{
                background: '#FFFBEB',
                color: '#D97706',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {t('common.comingSoon')}
            </div>
          </div>
        </div>

        {/* ── Information ── */}
        <div style={sectionTitle}>{t('mgmtSettings.information')}</div>
        <div style={{ ...menuCard, marginBottom: 20 }}>
          <div style={menuItem}>
            <div style={{ ...menuIcon, background: '#F0FDF4' }}>🏢</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{t('mgmtSettings.companyInfo')}</div>
            </div>
            <span style={{ fontSize: 16, color: '#CBD5E1' }}>›</span>
          </div>
          <a
            href="https://portal.nbcerp.com"
            target="_blank"
            rel="noopener noreferrer"
            style={menuItem}
          >
            <div style={{ ...menuIcon, background: '#EFF6FF' }}>🌐</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{t('mgmtSettings.webPortal')}</div>
            </div>
            <span style={{ fontSize: 16, color: '#CBD5E1' }}>↗</span>
          </a>
          <div style={{ ...menuItem, borderBottom: 'none' }}>
            <div style={{ ...menuIcon, background: '#F8FAFC' }}>ℹ️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{t('mgmtSettings.about')}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>NBC ESS v2.0</div>
            </div>
          </div>
        </div>

        {/* ── Account ── */}
        <div style={sectionTitle}>{t('mgmtSettings.account')}</div>
        <div style={{ ...menuCard, marginBottom: 32 }}>
          <div
            style={{ ...menuItem, borderBottom: 'none', cursor: 'pointer' }}
            onClick={() => setShowSignOutConfirm(true)}
          >
            <div style={{ ...menuIcon, background: '#FEF2F2' }}>🚪</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#DC2626' }}>{t('mgmtSettings.signOut')}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{t('mgmtSettings.signOutSubtitle')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sign Out Confirmation Modal ── */}
      {showSignOutConfirm && (
        <div style={modalOverlay} onClick={() => setShowSignOutConfirm(false)}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
              {t('common.signOut')}
            </h3>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>
              {t('common.signOutConfirm')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                style={{
                  flex: 1,
                  padding: 14,
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: 14,
                  color: '#64748B',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSignOut}
                style={{
                  flex: 1,
                  padding: 14,
                  background: '#DC2626',
                  border: 'none',
                  borderRadius: 14,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                {t('common.signOut')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
