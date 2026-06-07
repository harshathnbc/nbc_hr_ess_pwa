'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TOKEN_KEY, REFRESH_KEY } from '@/utils/api';

interface AuthUser {
  employee_id?: number;
  first_name?: string;
  last_name?: string;
  employee_code?: string;
  is_superuser?: boolean;
  is_manager?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isManager: boolean;
  loading: boolean;
  login: (access: string, refresh: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, isLoggedIn: false, isManager: false, loading: true,
  login: () => {}, logout: () => {},
});

function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const extractUser = useCallback((token: string): AuthUser | null => {
    const claims = decodeJWT(token);
    if (!claims) return null;
    return {
      employee_id: claims.employee_id as number | undefined,
      first_name: claims.first_name as string | undefined,
      last_name: claims.last_name as string | undefined,
      employee_code: claims.employee_code as string | undefined,
      is_superuser: !!claims.is_superuser,
      is_manager: !!claims.is_manager,
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const u = extractUser(token);
      setUser(u);
    }
    setLoading(false);
  }, [extractUser]);

  const login = useCallback((access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    const u = extractUser(access);
    setUser(u);
  }, [extractUser]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const isManager = !!(user?.is_superuser || user?.is_manager);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isManager, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
