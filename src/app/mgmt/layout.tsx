'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ReactNode } from 'react';

const tabs = [
  { key: 'dashboard', href: '/mgmt', icon: '📊' },
  { key: 'employees', href: '/mgmt/employees', icon: '👥' },
  { key: 'assets', href: '/mgmt/assets', icon: '🚗' },
  { key: 'settings', href: '/mgmt/settings', icon: '⚙️' },
];

export default function MgmtLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const isActive = (href: string) => {
    if (href === '/mgmt') return pathname === '/mgmt';
    return pathname.startsWith(href);
  };

  return (
    <div className="mgmt-page" style={{ paddingBottom: 80 }}>
      {children}

      {/* ── Bottom Navigation ── */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: 68,
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
          zIndex: 1000,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
        }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                textDecoration: 'none',
                flex: 1,
                height: '100%',
                position: 'relative',
              }}
            >
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 32,
                    height: 3,
                    borderRadius: '0 0 4px 4px',
                    background: '#16A34A',
                  }}
                />
              )}
              <span
                style={{
                  fontSize: 22,
                  filter: active ? 'none' : 'grayscale(0.6)',
                  opacity: active ? 1 : 0.5,
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.icon}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#16A34A' : '#94A3B8',
                  letterSpacing: '0.02em',
                  transition: 'color 0.2s ease',
                }}
              >
                {t(`tabs.${tab.key}`)}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
