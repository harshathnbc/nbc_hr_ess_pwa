'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Globe, Shield, FileText, Info, ExternalLink, Phone, Lock, LogOut, ChevronRight, LayoutDashboard, Eye, EyeOff } from 'lucide-react';

const NAVY = '#1B2A4A', RED = '#C8102E', SILVER = '#8E99A8',
  GLASS = 'rgba(255,255,255,0.06)', GLASS_BORDER = 'rgba(255,255,255,0.10)', GREEN = '#34D399';

export default function MorePage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { isManager, logout } = useAuth();
  const [pwdModal, setPwdModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const isAr = i18n.language === 'ar';

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const handleChangePassword = async () => {
    setPwdError('');
    if (!currentPwd || !newPwd || !confirmPwd) { setPwdError(t('more.allFieldsRequired')); return; }
    if (newPwd.length < 6) { setPwdError(t('more.passwordTooShort')); return; }
    if (newPwd !== confirmPwd) { setPwdError(t('more.passwordMismatch')); return; }
    setPwdLoading(true);
    try {
      await api.post('/users/api/v1/change-password/', { old_password: currentPwd, new_password: newPwd });
      setPwdSuccess(true);
      setTimeout(() => { setPwdModal(false); setPwdSuccess(false); setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); }, 2000);
    } catch (err: unknown) {
      setPwdError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || t('common.error'));
    }
    finally { setPwdLoading(false); }
  };

  const handleSignOut = () => {
    if (confirm(t('common.signOutConfirm'))) logout();
  };

  const MenuItem = ({ icon: Icon, label, sub, onClick, color = '#fff' }: { icon: React.ElementType; label: string; sub?: string; onClick?: () => void; color?: string }) => (
    <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${GLASS_BORDER}`, textAlign: 'left' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: GLASS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color, fontSize: 14, fontWeight: 600 }}>{label}</p>
        {sub && <p style={{ color: SILVER, fontSize: 11, marginTop: 2 }}>{sub}</p>}
      </div>
      <ChevronRight size={16} color={SILVER} />
    </button>
  );

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Header */}
      <div style={{ background: NAVY, paddingTop: 48, paddingBottom: 24, paddingInline: 20, borderRadius: '0 0 28px 28px' }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{t('more.moreTitle')}</h1>
      </div>

      {/* Language */}
      <div style={{ padding: '20px 16px 0' }}>
        <p style={{ color: SILVER, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>{t('more.language').toUpperCase()}</p>
        <div style={{ display: 'flex', background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
          <button onClick={() => changeLang('en')} style={{ flex: 1, padding: 12, background: !isAr ? RED : 'transparent', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>English</button>
          <button onClick={() => changeLang('ar')} style={{ flex: 1, padding: 12, background: isAr ? RED : 'transparent', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>العربية</button>
        </div>
      </div>

      {/* Management Portal */}
      {isManager && (
        <div style={{ padding: '20px 16px 0' }}>
          <p style={{ color: SILVER, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>{t('more.portal').toUpperCase()}</p>
          <div style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 16, padding: '4px 16px' }}>
            <MenuItem icon={LayoutDashboard} label={t('more.managementView')} sub={t('more.switchToMgmt')} onClick={() => router.push('/mgmt')} color={GREEN} />
          </div>
        </div>
      )}

      {/* Account */}
      <div style={{ padding: '20px 16px 0' }}>
        <p style={{ color: SILVER, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>{t('more.account').toUpperCase()}</p>
        <div style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 16, padding: '4px 16px' }}>
          <MenuItem icon={Lock} label={t('more.changePassword')} sub={t('more.changePasswordSub')} onClick={() => setPwdModal(true)} />
          <MenuItem icon={LogOut} label={t('common.signOut')} onClick={handleSignOut} color={RED} />
        </div>
      </div>

      {/* Information */}
      <div style={{ padding: '20px 16px 0' }}>
        <p style={{ color: SILVER, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>{t('more.information').toUpperCase()}</p>
        <div style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 16, padding: '4px 16px' }}>
          <MenuItem icon={Info} label={t('more.companyInfo')} onClick={() => alert('National Basics Company\nDammam, Saudi Arabia')} />
          <MenuItem icon={ExternalLink} label={t('more.webPortal')} onClick={() => window.open('https://www.nbcerp.com', '_blank')} />
          <MenuItem icon={Phone} label={t('more.contactHr')} sub={t('more.getHelp')} onClick={() => alert('Contact HR Department')} />
          <MenuItem icon={Shield} label={t('more.aboutApp')} sub="v1.0.0 (PWA)" />
        </div>
      </div>

      {/* Change Password Modal */}
      {pwdModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setPwdModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: NAVY, borderRadius: '24px 24px 0 0', padding: 24, animation: 'slideUp 0.3s ease' }}>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 20 }}>{t('more.changePassword')}</h2>
            {pwdSuccess && <div style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: 12, marginBottom: 16, color: GREEN, fontSize: 13, fontWeight: 700 }}>✓ {t('more.passwordChanged')}</div>}
            {pwdError && <div style={{ background: 'rgba(255,77,106,0.12)', border: '1px solid rgba(255,77,106,0.2)', borderRadius: 12, padding: 12, marginBottom: 16, color: '#FF4D6A', fontSize: 13, fontWeight: 700 }}>{pwdError}</div>}

            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input type={showCurrent ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder={t('more.currentPassword')} className="input" />
              <button onClick={() => setShowCurrent(!showCurrent)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: SILVER }}>{showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input type={showNew ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder={t('more.newPassword')} className="input" />
              <button onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: SILVER }}>{showNew ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder={t('more.confirmPassword')} className="input" style={{ marginBottom: 20 }} />

            <button onClick={handleChangePassword} disabled={pwdLoading} style={{ width: '100%', padding: 14, background: RED, color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: pwdLoading ? 0.6 : 1 }}>
              {pwdLoading ? t('more.updating') : t('more.updatePassword')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
