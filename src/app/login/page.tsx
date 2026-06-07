'use client';

import '@/i18n';
import { useState, useEffect, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2, UserCircle, Lock } from 'lucide-react';
import axios from 'axios';

/* ─── colour tokens ─── */
const C = {
  NAVY_DEEP: '#0F1A2E',
  NAVY:      '#1B2A4A',
  NAVY_LIGHT:'#243656',
  RED:       '#C8102E',
  RED_DARK:  '#A00D24',
  SILVER:    '#8E99A8',
  LIGHT:     '#C4CDD9',
  GLASS_BG:  'rgba(255,255,255,0.06)',
  GLASS_BRD: 'rgba(255,255,255,0.10)',
  WHITE:     '#FFFFFF',
};

/* ─── keyframe CSS injected once ─── */
const KEYFRAMES = `
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(32px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 30px rgba(200,16,46,0.25), 0 0 60px rgba(200,16,46,0.10); }
  50%      { box-shadow: 0 0 50px rgba(200,16,46,0.40), 0 0 90px rgba(200,16,46,0.18); }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-8px); }
  40%      { transform: translateX(8px); }
  60%      { transform: translateX(-6px); }
  80%      { transform: translateX(6px); }
}
`;

export default function LoginPage() {
  const { t }    = useTranslation();
  const router   = useRouter();
  const { login, isLoggedIn, isManager, loading: authLoading } = useAuth();

  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [shaking, setShaking]         = useState(false);
  const [mounted, setMounted]         = useState(false);

  /* fade-in on mount */
  useEffect(() => { setMounted(true); }, []);

  /* redirect if already logged in */
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      router.replace(isManager ? '/mgmt' : '/home');
    }
  }, [authLoading, isLoggedIn, isManager, router]);

  /* ─── decode helper ─── */
  function decodeJWT(token: string) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  /* ─── submit ─── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { data } = await axios.post('https://api.nbcerp.com/api/token/', {
        username: username.trim(),
        password,
      });

      const { access, refresh } = data;
      login(access, refresh);

      const claims = decodeJWT(access);
      const mgr    = !!(claims?.is_superuser || claims?.is_manager);
      router.replace(mgr ? '/mgmt' : '/home');
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number } };
      setError(
        axErr?.response?.status === 401
          ? t('login.invalidCreds')
          : t('login.failed')
      );
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setLoading(false);
    }
  };

  /* ─── styles ─── */
  const s: Record<string, CSSProperties> = {
    page: {
      minHeight: '100dvh',
      background: `linear-gradient(165deg, ${C.NAVY} 0%, ${C.NAVY_DEEP} 40%, #0a1220 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      position: 'relative',
      overflow: 'hidden',
      animation: mounted ? 'fadeIn 0.6s ease-out' : 'none',
    },
    /* decorative blurred orbs */
    orbTop: {
      position: 'absolute',
      top: '-120px',
      right: '-80px',
      width: '300px',
      height: '300px',
      borderRadius: '50%',
      background: `radial-gradient(circle, rgba(200,16,46,0.12) 0%, transparent 70%)`,
      filter: 'blur(60px)',
      pointerEvents: 'none',
    },
    orbBot: {
      position: 'absolute',
      bottom: '-100px',
      left: '-60px',
      width: '260px',
      height: '260px',
      borderRadius: '50%',
      background: `radial-gradient(circle, rgba(36,54,86,0.30) 0%, transparent 70%)`,
      filter: 'blur(50px)',
      pointerEvents: 'none',
    },

    card: {
      width: '100%',
      maxWidth: '400px',
      background: C.GLASS_BG,
      border: `1px solid ${C.GLASS_BRD}`,
      borderRadius: '24px',
      padding: '40px 28px 32px',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      animation: mounted ? 'slideUp 0.7s ease-out' : 'none',
      position: 'relative',
      zIndex: 1,
    },

    /* logo area */
    logoWrap: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '32px',
    },
    logoCircle: {
      width: '88px',
      height: '88px',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${C.NAVY_LIGHT}, ${C.NAVY})`,
      border: `2px solid ${C.GLASS_BRD}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'pulse-glow 3s ease-in-out infinite',
      marginBottom: '18px',
    },
    logoN: {
      fontSize: '40px',
      fontWeight: 800,
      color: C.RED,
      letterSpacing: '-1px',
      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
    },
    brandName: {
      fontSize: '22px',
      fontWeight: 700,
      color: C.WHITE,
      letterSpacing: '0.5px',
      margin: 0,
    },
    subtitle: {
      fontSize: '13px',
      color: C.SILVER,
      marginTop: '6px',
      letterSpacing: '1.5px',
      textTransform: 'uppercase' as const,
    },

    /* form */
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
    },
    inputGroup: {
      position: 'relative',
    },
    inputIcon: {
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: C.SILVER,
      pointerEvents: 'none',
      zIndex: 2,
    },
    input: {
      width: '100%',
      height: '52px',
      background: 'rgba(255,255,255,0.05)',
      border: `1px solid ${C.GLASS_BRD}`,
      borderRadius: '14px',
      padding: '0 48px',
      fontSize: '15px',
      color: C.WHITE,
      outline: 'none',
      transition: 'border-color 0.2s, background 0.2s',
      boxSizing: 'border-box',
      fontFamily: "'Inter', system-ui, sans-serif",
    },
    eyeBtn: {
      position: 'absolute',
      right: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: C.SILVER,
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },

    /* error */
    errorBox: {
      background: 'rgba(200,16,46,0.12)',
      border: '1px solid rgba(200,16,46,0.25)',
      borderRadius: '12px',
      padding: '12px 16px',
      color: '#FF6B7A',
      fontSize: '13px',
      textAlign: 'center',
      animation: shaking ? 'shake 0.4s ease-out' : 'none',
    },

    /* button */
    btn: {
      width: '100%',
      height: '52px',
      border: 'none',
      borderRadius: '14px',
      background: loading
        ? C.RED_DARK
        : `linear-gradient(135deg, ${C.RED} 0%, ${C.RED_DARK} 100%)`,
      color: C.WHITE,
      fontSize: '16px',
      fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      transition: 'transform 0.15s, box-shadow 0.2s',
      boxShadow: '0 4px 20px rgba(200,16,46,0.30)',
      marginTop: '4px',
      fontFamily: "'Inter', system-ui, sans-serif",
      opacity: loading ? 0.85 : 1,
    },

    /* footer */
    footer: {
      marginTop: '28px',
      textAlign: 'center',
      color: C.SILVER,
      fontSize: '12px',
      letterSpacing: '0.3px',
      animation: mounted ? 'fadeIn 1s ease-out 0.4s both' : 'none',
      position: 'relative',
      zIndex: 1,
    },
  };

  /* don't flash the page while checking auth */
  if (authLoading) {
    return (
      <div style={{ ...s.page, justifyContent: 'center' }}>
        <style>{KEYFRAMES}</style>
        <Loader2 size={32} color={C.SILVER} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <>
      {/* inject keyframes */}
      <style>{KEYFRAMES}</style>

      <div style={s.page}>
        {/* decorative orbs */}
        <div style={s.orbTop} />
        <div style={s.orbBot} />

        {/* ── glass card ── */}
        <div style={s.card}>
          {/* logo */}
          <div style={s.logoWrap}>
            <div style={s.logoCircle}>
              <span style={s.logoN}>N</span>
            </div>
            <h1 style={s.brandName}>{t('login.brand')}</h1>
            <p style={s.subtitle}>{t('login.title')}</p>
          </div>

          {/* form */}
          <form style={s.form} onSubmit={handleLogin} autoComplete="off">
            {/* employee ID */}
            <div style={s.inputGroup}>
              <div style={s.inputIcon}>
                <UserCircle size={20} />
              </div>
              <input
                type="text"
                placeholder={t('login.employeeId')}
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                style={s.input}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.RED;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = C.GLASS_BRD;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
              />
            </div>

            {/* password */}
            <div style={s.inputGroup}>
              <div style={s.inputIcon}>
                <Lock size={20} />
              </div>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder={t('login.password')}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                style={{ ...s.input, paddingRight: '52px' }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.RED;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = C.GLASS_BRD;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
              />
              <button
                type="button"
                style={s.eyeBtn}
                onClick={() => setShowPwd(!showPwd)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* error message */}
            {error && <div style={s.errorBox}>{error}</div>}

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              style={s.btn}
              onMouseDown={(e) => {
                if (!loading) (e.currentTarget.style.transform = 'scale(0.97)');
              }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onTouchStart={(e) => {
                if (!loading) (e.currentTarget.style.transform = 'scale(0.97)');
              }}
              onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {loading ? (
                <>
                  <Loader2
                    size={20}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  {t('login.signingIn')}
                </>
              ) : (
                t('login.signIn')
              )}
            </button>
          </form>
        </div>

        {/* footer */}
        <p style={s.footer}>{t('login.contactHr')}</p>
      </div>
    </>
  );
}
