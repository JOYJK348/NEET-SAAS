'use client';

import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
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
      await api.refreshTokens();
    } catch {
      // Ignore background failures, NEVER log out automatically
    }
  }, []);

  // Background refresh that never logs out — keeps token alive silently
  const silentRefresh = useCallback(async () => {
    try {
      await api.refreshTokens();
    } catch {
      // Ignore — the next cycle or a user action will trigger a real refresh
    }
  }, []);

  const getAuthChannel = useCallback(() => {
    if (typeof window !== 'undefined') {
      return new BroadcastChannel('neet_auth_channel');
    }
    return null;
  }, []);

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
      await api.post('/auth/logout', { refreshToken }, { skipGlobalToast: true });
    } catch {
      // Ignore background network/API errors — client-side session cleanup occurs in finally block
    } finally {
      logoutStore();
      getAuthChannel()?.postMessage({ type: 'SESSION_REVOKED' });
      router.replace('/auth/login');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
      getAuthChannel()?.postMessage({ type: 'SESSION_UPDATED' });
    }
  };

  const checkAuth = useCallback(async () => {
    if (accessToken && !isAuthenticated) {
      try {
        const user = await api.get<User>('/auth/me');
        setUser(user);
        setLoading(false);
      } catch {
        await refreshAccessToken();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, refreshAccessToken, setUser, setLoading]);

  // Check auth status on mount and route changes
  useEffect(() => {
    if (!hasHydrated) return;
    checkAuth();
  }, [hasHydrated, pathname, checkAuth]);

  // Multi-tab listener
  useEffect(() => {
    const channel = getAuthChannel();
    if (!channel) return;

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SESSION_REVOKED') {
        logoutStore();
        router.replace('/auth/login');
      }
    };

    channel.addEventListener('message', handleMessage);
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [getAuthChannel, logoutStore, router, setUser, setLoading]);

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

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && accessToken) {
        const exp = decodeJwtExp(accessToken);
        if (exp) {
          const timeLeftMs = exp * 1000 - Date.now();
          if (timeLeftMs < 180_000) {
            silentRefresh();
          }
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
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
