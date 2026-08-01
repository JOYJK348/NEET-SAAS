'use client';

import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, User } from '@/stores/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

const PROACTIVE_INTERVAL_MS = 12 * 60 * 60 * 1000; // every 12 hours

function decodeJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

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
  const queryClient = useQueryClient();
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
    const rfToken = useAuthStore.getState().refreshToken;
    try {
      const data = await api.post<{ accessToken: string }>(
        '/auth/refresh',
        rfToken ? { refreshToken: rfToken } : {},
        { skipGlobalToast: true },
      );
      const { accessToken: newAccessToken } = data;
      setTokens(newAccessToken);
    } catch {
      // Silently catch error — keep user logged in
    }
  }, [setTokens]);

  // Background refresh that never logs out — keeps token alive silently
  const silentRefresh = useCallback(async () => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      const exp = decodeJwtExp(token);
      // If token still has more than 5 minutes remaining, skip refresh
      if (exp && exp * 1000 - Date.now() > 5 * 60 * 1000) {
        return;
      }
    }

    const rfToken = useAuthStore.getState().refreshToken;
    try {
      const data = await api.post<{ accessToken: string }>(
        '/auth/refresh',
        rfToken ? { refreshToken: rfToken } : {},
        { skipGlobalToast: true },
      );
      const { accessToken: newAccessToken } = data;
      setTokens(newAccessToken);
    } catch {
      // Ignore — the next cycle or a user action will trigger a real refresh
    }
  }, [setTokens]);

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    setLoading(true);
    queryClient.clear();
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
    queryClient.clear();
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
      queryClient.clear();
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

  // Strict Role Route Guard across tabs
  useEffect(() => {
    if (!hasHydrated || isLoading || !isAuthenticated || !user) return;

    const isParentRole = user.roleCode === 'PARENT';
    const isParentPath = pathname.startsWith('/dashboard/parent');
    const isDashboardPath =
      pathname.startsWith('/dashboard') || pathname.startsWith('/tenant-admin');

    if (isParentRole && isDashboardPath && !isParentPath) {
      // PARENT user attempting to access non-parent routes -> redirect to parent portal
      router.replace('/dashboard/parent/academics');
    } else if (!isParentRole && isParentPath) {
      // NON-PARENT user attempting to access parent portal -> redirect to main dashboard
      router.replace('/dashboard');
    }
  }, [hasHydrated, isLoading, isAuthenticated, user, pathname, router]);

  // Proactive token refresh — silently keep access token fresh before it expires
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const scheduleNext = () => {
      const exp = decodeJwtExp(accessToken);
      const delay = exp ? Math.max(60_000, (exp * 1000 - Date.now()) * 0.9) : PROACTIVE_INTERVAL_MS;

      return setTimeout(
        () => {
          silentRefresh();
        },
        Math.min(delay, PROACTIVE_INTERVAL_MS),
      );
    };

    let timerId = scheduleNext();

    const onResume = () => {
      if (document.visibilityState === 'visible') {
        silentRefresh();
      }
    };

    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('online', onResume);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('online', onResume);
    };
  }, [isAuthenticated, accessToken, silentRefresh]);

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
