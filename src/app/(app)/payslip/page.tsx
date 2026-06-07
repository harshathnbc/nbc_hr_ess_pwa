'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api, { TOKEN_KEY } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

const NAVY = '#1B2A4A';
const NAVY_DEEP = '#0F1A2E';
const RED = '#C8102E';
const SILVER = '#8E99A8';
const LIGHT = '#C4CDD9';
const GLASS = 'rgba(255,255,255,0.06)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';

export default function PayslipPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/hr/api/v1/me/');
        setEmployeeId(r.data.id);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response
            ?.data?.detail || 'Could not load profile.';
        alert(`${t('common.error')}\n\n${msg}`);
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [t]);

  const download = async () => {
    if (!employeeId) {
      alert(`${t('common.error')}\n\n${t('payslip.profileNotFound')}`);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const baseURL = api.defaults.baseURL;
      const url = `${baseURL}/hr/api/v1/employees/${employeeId}/payslip/?month=${month}&year=${year}`;

      // For PWA, open in new tab with auth header via fetch + blob
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      // Clean up after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err: unknown) {
      const msg =
        (err as Error)?.message || t('payslip.downloadFailed');
      alert(`${t('common.error')}\n\n${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const adj = (d: number) => {
    let m = month + d;
    let y = year;
    if (m > 12) {
      m = 1;
      y++;
    }
    if (m < 1) {
      m = 12;
      y--;
    }
    setMonth(m);
    setYear(y);
  };

  // Get translated month names
  const months = t('payslip.months', { returnObjects: true }) as string[];
  const monthsFull = t('payslip.monthsFull', {
    returnObjects: true,
  }) as string[];

  if (profileLoading) {
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
            {t('payslip.title')}
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
            {t('payslip.download')}
          </h1>
        </div>

        {/* Month Selector Card */}
        <div style={{ marginLeft: 16, marginRight: 16, marginTop: 28 }}>
          <div
            style={{
              backgroundColor: GLASS,
              borderRadius: 28,
              padding: 36,
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
                fontSize: 11,
                fontWeight: 700,
                marginBottom: 24,
                letterSpacing: 1,
              }}
            >
              {t('payslip.selectPeriod')}
            </span>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 24,
              }}
            >
              <button
                onClick={() => adj(-1)}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  backgroundColor: GLASS,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${GLASS_BORDER}`,
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{ fontSize: 24, color: RED, fontWeight: 700 }}
                >
                  ‹
                </span>
              </button>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 130,
                }}
              >
                <span
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    color: RED,
                    letterSpacing: -1,
                  }}
                >
                  {Array.isArray(months) ? months[month - 1] : month}
                </span>
                <span
                  style={{
                    fontSize: 20,
                    color: SILVER,
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  {year}
                </span>
              </div>
              <button
                onClick={() => adj(1)}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  backgroundColor: GLASS,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${GLASS_BORDER}`,
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{ fontSize: 24, color: RED, fontWeight: 700 }}
                >
                  ›
                </span>
              </button>
            </div>
            <span style={{ color: SILVER, fontSize: 13, marginTop: 16 }}>
              {Array.isArray(monthsFull) ? monthsFull[month - 1] : ''} {year}
            </span>
          </div>
        </div>

        {/* Download Button */}
        <div style={{ marginLeft: 16, marginRight: 16, marginTop: 28 }}>
          <button
            onClick={download}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#4A5568' : RED,
              borderRadius: 20,
              paddingTop: 20,
              paddingBottom: 20,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading
                ? 'none'
                : '0 6px 20px rgba(200,16,46,0.45)',
            }}
          >
            {loading ? (
              <>
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
                <span
                  style={{
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 15,
                    marginTop: 6,
                  }}
                >
                  {t('payslip.downloading')}
                </span>
              </>
            ) : (
              <span
                style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}
              >
                {t('payslip.downloadPdf')}
              </span>
            )}
          </button>
          <p
            style={{
              color: SILVER,
              fontSize: 11,
              textAlign: 'center',
              marginTop: 14,
            }}
          >
            {t('payslip.opensInViewer')}
          </p>
        </div>
      </div>
    </>
  );
}