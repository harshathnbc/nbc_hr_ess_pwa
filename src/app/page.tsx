'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TOKEN_KEY } from '@/utils/api';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // Decode JWT to check role
      try {
        const claims = JSON.parse(atob(token.split('.')[1]));
        if (claims.is_superuser || claims.is_manager) {
          router.replace('/mgmt');
        } else {
          router.replace('/home');
        }
      } catch {
        router.replace('/home');
      }
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: '#0F1A2E' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#C8102E', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );
}
