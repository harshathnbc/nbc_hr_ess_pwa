'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api, { TOKEN_KEY, REFRESH_KEY } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

const NAVY = '#1B2A4A';
const NAVY_DEEP = '#0F1A2E';
const RED = '#C8102E';
const SILVER = '#8E99A8';
const GLASS = 'rgba(255,255,255,0.06)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';

interface MenuItemProps {
  emoji: string;
  label: string;
  subtitle?: string;
  color?: string;
  onPress: () => void;
  danger?: boolean;
  highlight?: boolean;
}

function MenuItem({
  emoji,
  label,
  subtitle,
  color = RED,
  onPress,
  danger,
  highlight,
}: MenuItemProps) {
  return (
    <button
      onClick={onPress}
      style={{
        width: '100%',
        backgroundColor: highlight ? 'rgba(200,16,46,0.08)' : GLASS,
        borderRadius: 18,
        padding: 16,
        marginBottom: 8,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        border: `1px solid ${
          danger
            ? 'rgba(255,77,106,0.25)'
            : highlight
            ? 'rgba(200,16,46,0.25)'
            : GLASS_BORDER
        }`,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 16,
          backgroundColor: danger ? 'rgba(255,77,106,0.12)' : `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 20 }}>{emoji}</span>
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            color: danger ? '#FF4D6A' : '#fff',
            fontSize: 15,
            fontWeight: 700,
            margin: 0,
          }}
        >
          {label}
        </p>
        {subtitle && (
          <p
            style={{
              color: SILVER,
              fontSize: 12,
              
              marginTop: 3,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <span
        style={{
          color: highlight ? RED : '#4A5568',
          fontSize: 20,
        }}
      >
        ›
      </span>
    </button>
  );
}

export default function MorePage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user, isManager, logout } = useAuth();

  const lang = i18n.language || 'en';
  const setLang = (l: string) => {
    i18n.changeLanguage(l);
  };

  // Change Password state
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const pwdTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleLogout = () => {
    if (window.confirm(`${t('common.signOut')}\n\n${t('common.signOutConfirm')}`)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      router.replace('/login');
    }
  };

  const openWebPortal = () => {
    window.open('https://www.nbcerp.com', '_blank');
  };

  const openPasswordModal = () => {
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setPwdError('');
    setPwdSuccess(false);
    setPwdModalOpen(true);
  };

  const handleChangePassword = async () => {
    setPwdError('');
    setPwdSuccess(false);

    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdError(t('more.allFieldsRequired'));
      return;
    }
    if (newPwd.length < 6) {
      setPwdError(t('more.passwordTooShort'));
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError(t('more.passwordMismatch'));
      return;
    }

    setPwdLoading(true);
    try {
      await api.post('/users/api/v1/change-password/', {
        old_password: currentPwd,
        new_password: newPwd,
      });
      setPwdSuccess(true);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      if (pwdTimerRef.current) clearTimeout(pwdTimerRef.current);
      pwdTimerRef.current = setTimeout(() => {
        setPwdModalOpen(false);
        setPwdSuccess(false);
      }, 2000);
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Failed to change password.';
      setPwdError(errMsg);
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div
        style={{
          minHeight: '100dvh',
          backgroundColor: NAVY_DEEP,
          overflowY: 'auto',
          paddingBottom: 40,
          position: 'relative',
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
          <p
            style={{
              color: SILVER,
              fontSize: 13,
              letterSpacing: 0.5,
              margin: 0,
            }}
          >
            {t('more.settingsTitle')}
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
            {t('more.moreTitle')}
          </h1>
        </div>

        <div
          style={{
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 22,
          }}
        >
          {/* Language Toggle */}
          <p
            style={{
              color: SILVER,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              
              marginBottom: 10,
              marginLeft: 4,
            }}
          >
            {t('more.language')}
          </p>
          <div
            style={{
              backgroundColor: GLASS,
              borderRadius: 18,
              padding: 6,
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'row',
              border: `1px solid ${GLASS_BORDER}`,
            }}
          >
            <button
              onClick={() => setLang('en')}
              style={{
                flex: 1,
                paddingTop: 14,
                paddingBottom: 14,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: lang === 'en' ? RED : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  color: lang === 'en' ? '#fff' : SILVER,
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                English
              </span>
            </button>
            <button
              onClick={() => setLang('ar')}
              style={{
                flex: 1,
                paddingTop: 14,
                paddingBottom: 14,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: lang === 'ar' ? RED : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  color: lang === 'ar' ? '#fff' : SILVER,
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                عربي
              </span>
            </button>
          </div>

          {/* Portal Toggle — only visible for managers */}
          {isManager && (
            <>
              <p
                style={{
                  color: SILVER,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  
                  marginBottom: 10,
                  marginLeft: 4,
                }}
              >
                {t('more.portal')}
              </p>
              <MenuItem
                emoji="📊"
                label={t('more.managementView')}
                subtitle={t('more.switchToMgmt')}
                color="#34D399"
                onPress={() => router.replace('/mgmt')}
                highlight
              />
            </>
          )}

          {/* Documents */}
          <p
            style={{
              color: SILVER,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              
              marginTop: isManager ? 20 : 0,
              marginBottom: 10,
              marginLeft: 4,
            }}
          >
            {t('more.documents')}
          </p>
          <MenuItem
            emoji="📑"
            label={t('more.myDocuments')}
            subtitle={t('more.viewDocuments')}
            color="#6366F1"
            onPress={() => {}}
          />
          <MenuItem
            emoji="📁"
            label={t('more.companyPolicies')}
            subtitle={t('more.hrPolicies')}
            color="#34D399"
            onPress={() => {}}
          />

          {/* Information */}
          <p
            style={{
              color: SILVER,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              
              marginTop: 20,
              marginBottom: 10,
              marginLeft: 4,
            }}
          >
            {t('more.information')}
          </p>
          <MenuItem
            emoji="🏢"
            label={t('more.companyInfo')}
            subtitle="National Basics Company"
            color="#FFB020"
            onPress={() =>
              alert('NBC\n\nAl-Khobar, Saudi Arabia\nwww.national-basics.com')
            }
          />
          <MenuItem
            emoji="🌐"
            label={t('more.webPortal')}
            subtitle="nbcerp.com"
            color="#2563EB"
            onPress={openWebPortal}
          />
          <MenuItem
            emoji="📞"
            label={t('more.contactHr')}
            subtitle={t('more.getHelp')}
            color="#38BDF8"
            onPress={() =>
              alert('HR Contact\n\nhr@national-basics.com\nwww.nbcerp.com')
            }
          />
          <MenuItem
            emoji="ℹ️"
            label={t('more.aboutApp')}
            subtitle="Version 1.0.0"
            color="#A78BFA"
            onPress={() => alert('NBC HR ESS\n\nv1.0.0 • Management Portal')}
          />

          {/* Account */}
          <p
            style={{
              color: SILVER,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              
              marginTop: 20,
              marginBottom: 10,
              marginLeft: 4,
            }}
          >
            {t('more.account')}
          </p>
          <MenuItem
            emoji="🔑"
            label={t('more.changePassword')}
            subtitle={t('more.changePasswordSub')}
            color="#F59E0B"
            onPress={openPasswordModal}
          />
          <MenuItem
            emoji="🚪"
            label={t('common.signOut')}
            subtitle={t('more.signOutSubtitle')}
            onPress={handleLogout}
            danger
          />
        </div>

        {/* ── Change Password Modal ── */}
        {pwdModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              paddingLeft: 20,
              paddingRight: 20,
              zIndex: 100,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setPwdModalOpen(false);
            }}
          >
            <div
              style={{
                backgroundColor: NAVY,
                borderRadius: 24,
                padding: 24,
                width: '100%',
                maxWidth: 400,
                border: `1px solid ${GLASS_BORDER}`,
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <h3
                  style={{
                    color: '#fff',
                    fontSize: 20,
                    fontWeight: 800,
                    margin: 0,
                  }}
                >
                  🔑 {t('more.changePassword')}
                </h3>
                <button
                  onClick={() => setPwdModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <span
                    style={{
                      color: SILVER,
                      fontSize: 28,
                      lineHeight: '28px',
                    }}
                  >
                    ×
                  </span>
                </button>
              </div>

              {/* Success */}
              {pwdSuccess && (
                <div
                  style={{
                    backgroundColor: 'rgba(52,211,153,0.15)',
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 16,
                    border: '1px solid rgba(52,211,153,0.3)',
                  }}
                >
                  <p
                    style={{
                      color: '#34D399',
                      fontSize: 14,
                      fontWeight: 700,
                      textAlign: 'center',
                      margin: 0,
                    }}
                  >
                    ✅ {t('more.passwordChanged')}
                  </p>
                </div>
              )}

              {/* Error */}
              {pwdError !== '' && (
                <div
                  style={{
                    backgroundColor: 'rgba(255,77,106,0.12)',
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 16,
                    border: '1px solid rgba(255,77,106,0.25)',
                  }}
                >
                  <p
                    style={{
                      color: '#FF4D6A',
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: 'center',
                      margin: 0,
                    }}
                  >
                    {pwdError}
                  </p>
                </div>
              )}

              {/* Current Password */}
              <p
                style={{
                  color: SILVER,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  
                  marginBottom: 6,
                }}
              >
                {t('more.currentPassword')}
              </p>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="••••••••"
                style={{
                  backgroundColor: GLASS,
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 15,
                  color: '#fff',
                  border: `1px solid ${GLASS_BORDER}`,
                  marginBottom: 14,
                  width: '100%',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />

              {/* New Password */}
              <p
                style={{
                  color: SILVER,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  
                  marginBottom: 6,
                }}
              >
                {t('more.newPassword')}
              </p>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="••••••••"
                style={{
                  backgroundColor: GLASS,
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 15,
                  color: '#fff',
                  border: `1px solid ${GLASS_BORDER}`,
                  marginBottom: 14,
                  width: '100%',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />

              {/* Confirm Password */}
              <p
                style={{
                  color: SILVER,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  
                  marginBottom: 6,
                }}
              >
                {t('more.confirmPassword')}
              </p>
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="••••••••"
                style={{
                  backgroundColor: GLASS,
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 15,
                  color: '#fff',
                  border: `1px solid ${GLASS_BORDER}`,
                  marginBottom: 20,
                  width: '100%',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />

              {/* Submit */}
              <button
                onClick={handleChangePassword}
                disabled={pwdLoading}
                style={{
                  backgroundColor: pwdLoading ? '#4A5568' : RED,
                  borderRadius: 16,
                  paddingTop: 16,
                  paddingBottom: 16,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  border: 'none',
                  cursor: pwdLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {pwdLoading && (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                )}
                <span
                  style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}
                >
                  {pwdLoading ? t('more.updating') : t('more.updatePassword')}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}