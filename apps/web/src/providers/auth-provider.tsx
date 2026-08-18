'use client';

import { createContext, useContext, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, User } from '@/stores/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { prefetchCriticalData } from '@/lib/prefetchOrchestrator';
import { CACHE_STORAGE_KEY } from '@/lib/queryPersister';

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
    // Mark all cached data as stale (NOT cleared) so the dashboard can show
    // last-known values INSTANTLY while fresh data revalidates in background.
    // We only fully wipe cache on logout (different user scenario).
    await queryClient.invalidateQueries();
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    try {
      const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/login',
        { email, password },
        tenantId ? { headers: { 'x-tenant-id': tenantId } } : undefined,
      );
      const { user, accessToken, refreshToken } = data;
      // 1. Set auth state immediately — unblocks the router.replace() in login page
      setAuth(user, accessToken, refreshToken, rememberMe);
      setLoading(false);
      // 2. Fire prefetch IN PARALLEL with navigation — dashboard data is already
      //    loading by the time the page renders. This is the key to instant UI.
      void prefetchCriticalData(queryClient, user.tenantId, user.roleCode);
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
      setLoading(false);
      void prefetchCriticalData(queryClient, user.tenantId, user.roleCode);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    const currentRfToken = refreshToken;

    // 1. Wipe ENTIRE cache on logout (security: different user may log in next)
    queryClient.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    }
    logoutStore();
    router.replace('/auth/login');

    // 2. Fire backend logout request silently in the background (non-blocking)
    if (currentRfToken) {
      void api.post('/auth/logout', { refreshToken: currentRfToken }, { skipGlobalToast: true }).catch(() => {});
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const hasCheckedAuthRef = useRef(false);

  // Check auth status on mount (runs EXACTLY ONCE to prevent infinite loop)
  useEffect(() => {
    if (hasCheckedAuthRef.current) return;

    if (hasHydrated) {
      hasCheckedAuthRef.current = true;
      const checkAuth = async () => {
        if (accessToken && !isAuthenticated) {
          try {
            const fetchedUser = await api.get<User>('/auth/me', { skipGlobalToast: true });
            setUser(fetchedUser);
            void prefetchCriticalData(queryClient, fetchedUser.tenantId, fetchedUser.roleCode);
          } catch {
            // silent catch
          }
        }
        setLoading(false);
      };

      checkAuth();
    } else {
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [hasHydrated, accessToken, isAuthenticated, setUser, setLoading, queryClient]);

  const prefetchedRef = useRef(false);

  // Trigger prefetching once authenticated
  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.tenantId && !prefetchedRef.current) {
      prefetchedRef.current = true;
      prefetchCriticalData(queryClient, user.tenantId, user.roleCode);
    }
  }, [hasHydrated, isAuthenticated, user?.tenantId, user?.roleCode, queryClient]);

  // Strict Role Route Guard across tabs
  useEffect(() => {
    if (!hasHydrated || isLoading || !isAuthenticated || !user) return;

    const role = (user.roleCode || (user as any).role || '').toUpperCase();
    const isStudent = role === 'STUDENT';
    const isTutor = role === 'TUTOR' || role === 'FACULTY';
    const isParent = role === 'PARENT';
    const isAdmin = role === 'TENANT_ADMIN' || role.startsWith('TENANT_ADMIN') || role === 'SUPER_ADMIN' || role === 'PLATFORM_ADMIN';

    // Routes that are ONLY for admins
    const isAdminOnlyPath =
      pathname === '/dashboard/students' ||
      pathname.startsWith('/dashboard/students/') ||
      pathname === '/dashboard/tutors' ||
      pathname.startsWith('/dashboard/tutors/') ||
      pathname.startsWith('/tenant-admin');

    const isGoogleCalendarSyncPath = pathname.startsWith('/dashboard/settings/integrations/google-calendar');

    if (isStudent) {
      if (!isGoogleCalendarSyncPath && (isAdminOnlyPath || (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/student')))) {
        router.replace('/dashboard/student');
      }
    } else if (isTutor) {
      if (!isGoogleCalendarSyncPath && (isAdminOnlyPath || (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/tutor')))) {
        router.replace('/dashboard/tutor');
      }
    } else if (isParent) {
      if (!pathname.startsWith('/dashboard/parent')) {
        router.replace('/dashboard/parent/academics');
      }
    } else if (!isAdmin && pathname.startsWith('/dashboard/parent')) {
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
