'use client';

import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useAuthStore, User } from '@/stores/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: string;
  instituteId?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    setAuth,
    setUser,
    setTokens,
    logout: logoutStore,
    setLoading,
    accessToken,
    refreshToken,
    hasHydrated,
  } = useAuthStore();

  const router = useRouter();
  const pathname = usePathname();

  const refreshAccessToken = useCallback(async () => {
    try {
      const data = await api.post<{ accessToken: string }>('/auth/refresh', {});
      const { accessToken: newAccessToken } = data;
      setTokens(newAccessToken);
    } catch {
      logoutStore();
      router.replace('/auth/login');
    }
  }, [logoutStore, setTokens, router]);

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    setLoading(true);
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    try {
      const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/login',
        { email, password },
        tenantId ? { headers: { 'x-tenant-id': tenantId } } : undefined,
      );
      const { user, accessToken, refreshToken } = data;
      setAuth(user, accessToken, refreshToken, rememberMe);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (registerData: RegisterData) => {
    setLoading(true);
    try {
      const response = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/register',
        registerData,
      );
      const { user, accessToken, refreshToken } = response;
      setAuth(user, accessToken, refreshToken);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logoutStore();
      router.replace('/auth/login');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // Check auth status on mount and route changes
  useEffect(() => {
    if (!hasHydrated) return;

    const checkAuth = async () => {
      if (accessToken && !isAuthenticated) {
        try {
          const user = await api.get<User>('/auth/me');
          setUser(user);
          setLoading(false);
        } catch {
          await refreshAccessToken();
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [
    hasHydrated,
    pathname,
    accessToken,
    isAuthenticated,
    refreshAccessToken,
    logoutStore,
    setLoading,
    setUser,
  ]);

  // Proactive token refresh — keep access token fresh before it expires
  useEffect(() => {
    if (!isAuthenticated) return;

    // Default access token expiry is 900s (15 min); refresh every 10 min
    const INTERVAL_MS = 10 * 60 * 1000;
    const intervalId = setInterval(() => {
      refreshAccessToken();
    }, INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, refreshAccessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading: isLoading || !hasHydrated,
        login,
        register,
        logout,
        refreshAccessToken,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
