'use client';

import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useAuthStore, User } from '@/stores/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
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
  } = useAuthStore();

  const router = useRouter();
  const pathname = usePathname();

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      logoutStore();
      router.push('/auth/login');
      return;
    }

    try {
      const data = await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        refreshToken,
      });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data;
      setTokens(newAccessToken, newRefreshToken);
    } catch {
      logoutStore();
      router.push('/auth/login');
    }
  }, [refreshToken, logoutStore, setTokens, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/login',
        { email, password },
      );
      const { user, accessToken, refreshToken } = data;
      setAuth(user, accessToken, refreshToken);
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
      router.push('/auth/login');
      router.refresh();
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // Check auth status on mount and route changes
  useEffect(() => {
    const checkAuth = async () => {
      if (accessToken && !isAuthenticated) {
        try {
          const user = await api.get<User>('/auth/me');
          setUser(user);
          setLoading(false);
        } catch {
          if (refreshToken) {
            await refreshAccessToken();
          } else {
            logoutStore();
            setLoading(false);
          }
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [
    pathname,
    accessToken,
    isAuthenticated,
    refreshToken,
    refreshAccessToken,
    logoutStore,
    setLoading,
    setUser,
  ]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
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
