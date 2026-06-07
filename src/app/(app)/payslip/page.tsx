'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api, { TOKEN_KEY } from '@/utils/api';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

const NAVY = '#1B2A4A', RED = '#C8102E', SILVER = '#8E99A8',
  GLASS = 'rgba(255,255,255,0.06)', GLASS_BORDER = 'rgba(255,255,255,0.10)';

export default function PayslipPage() {
  const { t } = useTranslation();
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    api.get('/hr/api/v1/me/').then(res => setEmployeeId(res.data.id)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const months = t('payslip.months', { returnObjects: true }) as string[];
  const monthsFull = t('payslip.monthsFull', { returnObjects: true }) as string[];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleDownload = async () => {
    if (!employeeId) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`https://api.nbcerp.com/hr/api/v1/employees/${employeeId}/payslip/?month=${month + 1}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${year}_${String(month + 1).padStart(2, '0')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(t('payslip.downloadFailed'));
    }
    finally { setDownloading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80dvh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: RED, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Header */}
      <div style={{ background: NAVY, paddingTop: 48, paddingBottom: 24, paddingInline: 20, borderRadius: '0 0 28px 28px', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{t('payslip.title')}</h1>
      </div>

      {/* Month Selector */}
      <div style={{ margin: '20px 16px 0', background: GLASS, border: `1px solid ${GLASS_BORDER}`, borderRadius: 22, padding: 28, textAlign: 'center' }}>
        <p style={{ color: SILVER, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>{t('payslip.selectPeriod').toUpperCase()}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <button onClick={prevMonth} style={{ width: 40, height: 40, borderRadius: 12, background: GLASS, border: `1px solid ${GLASS_BORDER}`, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <p style={{ color: '#fff', fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>{Array.isArray(months) ? months[month] : ''}</p>
            <p style={{ color: SILVER, fontSize: 16, fontWeight: 600, marginTop: 2 }}>{year}</p>
          </div>
          <button onClick={nextMonth} style={{ width: 40, height: 40, borderRadius: 12, background: GLASS, border: `1px solid ${GLASS_BORDER}`, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={20} />
          </button>
        </div>
        <p style={{ color: SILVER, fontSize: 13, marginTop: 12 }}>{Array.isArray(monthsFull) ? monthsFull[month] : ''} {year}</p>
      </div>

      {/* Download Button */}
      <div style={{ padding: '20px 16px 0' }}>
        <button onClick={handleDownload} disabled={downloading} style={{
          width: '100%', padding: 16, background: RED, color: '#fff', border: 'none', borderRadius: 16,
          fontSize: 16, fontWeight: 800, cursor: 'pointer', opacity: downloading ? 0.6 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <Download size={20} />
          {downloading ? t('payslip.downloading') : t('payslip.downloadPdf')}
        </button>
        <p style={{ color: SILVER, fontSize: 12, textAlign: 'center', marginTop: 8 }}>{t('payslip.opensInViewer')}</p>
      </div>
    </div>
  );
}
