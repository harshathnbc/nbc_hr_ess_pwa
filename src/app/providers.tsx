'use client';
import { AuthProvider } from '@/context/AuthContext';
import '@/i18n';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
