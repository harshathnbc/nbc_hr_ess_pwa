'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Home, MapPin, Palmtree, Wallet, Settings } from 'lucide-react';

const tabs = [
  { key: 'home', href: '/home', icon: Home, labelKey: 'tabs.home' },
  { key: 'attendance', href: '/attendance', icon: MapPin, labelKey: 'tabs.clock' },
  { key: 'leave', href: '/leave', icon: Palmtree, labelKey: 'tabs.leave' },
  { key: 'payslip', href: '/payslip', icon: Wallet, labelKey: 'tabs.pay' },
  { key: 'more', href: '/more', icon: Settings, labelKey: 'tabs.more' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isManager } = useAuth();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: '#0F1A2E',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      {isManager && (
        <Link href="/mgmt" style={{
          display: 'block',
          textAlign: 'center',
          padding: '4px 0 0 0',
          fontSize: '10px',
          fontWeight: 600,
          color: '#C8102E',
          textDecoration: 'none',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          {t('more.managementView')}
        </Link>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: isManager ? '6px 0 10px 0' : '10px 0 12px 0',
        maxWidth: 500,
        margin: '0 auto',
      }}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname?.startsWith(tab.href + '/');
          const Icon = tab.icon;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                textDecoration: 'none',
                position: 'relative',
                padding: '6px 14px',
                borderRadius: 14,
                background: isActive ? 'rgba(200,16,46,0.12)' : 'transparent',
                transition: 'all 0.25s ease',
                minWidth: 56,
              }}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.4 : 1.8}
                color={isActive ? '#C8102E' : '#8E99A8'}
                style={{ transition: 'color 0.25s ease' }}
              />
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#C8102E' : '#8E99A8',
                letterSpacing: '0.2px',
                transition: 'color 0.25s ease',
              }}>
                {t(tab.labelKey)}
              </span>
              {isActive && (
                <span style={{
                  position: 'absolute',
                  top: -1,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 20,
                  height: 3,
                  borderRadius: 2,
                  background: '#C8102E',
                }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
