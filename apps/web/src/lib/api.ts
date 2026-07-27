import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipGlobalToast?: boolean;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - attach access token and tenant context
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const state = useAuthStore.getState();
        const accessToken = state.accessToken;
        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        const tenantId = state.user?.tenantId || process.env.NEXT_PUBLIC_TENANT_ID;
        if (tenantId && config.headers) {
          config.headers['x-tenant-id'] = tenantId;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error),
    );

    // Response interceptor - handle token refresh and errors
    this.client.interceptors.response.use(
      (response) => {
        // Unwrap NestJS response envelope { success, data } → just data
        if (
          response.data &&
          typeof response.data === 'object' &&
          'success' in response.data &&
          'data' in response.data
        ) {
          response.data = response.data.data;
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        const isAuthRequest =
          originalRequest.url?.includes('/auth/login') ||
          originalRequest.url?.includes('/auth/register') ||
          originalRequest.url?.includes('/auth/refresh') ||
          originalRequest.url?.includes('/auth/logout') ||
          originalRequest.url?.includes('/login') ||
          originalRequest.url?.includes('/register') ||
          originalRequest.url?.includes('/logout');

        // Handle 401 Unauthorized - attempt token refresh (except for login/register/refresh requests themselves)
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await this.refreshTokens();

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }

            return this.client(originalRequest);
          } catch (refreshError: any) {
            // Reject the request so caller receives error, but NEVER clear store or redirect to login automatically
            return Promise.reject(refreshError);
          }
        }

        // Global error handling
        const skipGlobalToast = originalRequest?.skipGlobalToast;
        if (!skipGlobalToast) {
          this.handleGlobalError(error);
        }

        return Promise.reject(error);
      },
    );
  }

  private handleGlobalError(error: AxiosError): void {
    const status = error.response?.status;
    const message = (error.response?.data as { message?: string })?.message || error.message;

    // Don't show toast for 401 (handled by refresh), 422 (validation errors handled by forms),
    // or 400 VALIDATION_ERROR (handled by forms inline)
    if (status === 401 || status === 422) {
      return;
    }
    if (status === 400) {
      const responseData = error.response?.data as Record<string, unknown> | undefined;
      if (responseData?.code === 'VALIDATION_ERROR') return;
    }

    // Show user-friendly error messages
    switch (status) {
      case 400:
        toast.error('Bad Request', { description: message });
        break;
      case 403:
        toast.error('Access Denied', {
          description: "You don't have permission to perform this action",
        });
        break;
      case 404:
        toast.error('Not Found', {
          description: message || 'The requested resource was not found',
        });
        break;
      case 409: {
        const isCourseDependency =
          typeof message === 'string' && message.startsWith('Cannot delete course:');
        const displayMessage = isCourseDependency
          ? 'This course cannot be deleted because it is currently being used by active batches, admissions, exams, learning materials, or fee structures. Please remove or archive those dependencies first.'
          : message;
        toast.error('Conflict', { description: displayMessage });
        break;
      }
      case 429:
        toast.error('Too Many Requests', { description: 'Please try again later' });
        break;
      case 500:
        toast.error('Server Error', {
          description: message || 'An unexpected error occurred. Please try again later.',
        });
        break;
      case 503:
        toast.error('Service Unavailable', {
          description: message || 'The service is temporarily unavailable. Please try again later.',
        });
        break;
      default:
        if (status && status >= 500) {
          toast.error('Server Error', {
            description: message || 'An unexpected error occurred. Please try again later.',
          });
        } else if (!status) {
          toast.error('Network Error', {
            description:
              message || 'Unable to connect to the server. Please check your connection.',
          });
        }
    }
  }

  // Coordinate concurrent refresh token requests
  public async refreshTokens(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        this.failedQueue.push({
          resolve: (token: any) => resolve(token as string),
          reject,
        });
      });
    }

    this.isRefreshing = true;
    try {
      const currentRefreshToken = useAuthStore.getState().refreshToken;
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken: currentRefreshToken },
        {
          withCredentials: true,
          headers: currentRefreshToken ? { 'x-refresh-token': currentRefreshToken } : {},
        },
      );

      const refreshData = response.data?.data ?? response.data;
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshData;
      const nextRefreshToken = newRefreshToken || currentRefreshToken;
      useAuthStore.getState().setTokens(newAccessToken, nextRefreshToken);

      this.failedQueue.forEach(({ resolve }) => resolve(newAccessToken));
      this.failedQueue = [];
      return newAccessToken;
    } catch (err) {
      this.failedQueue.forEach(({ reject }) => reject(err));
      this.failedQueue = [];
      throw err;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Public methods for API calls
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Get the underlying axios instance for advanced usage
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export types for convenience
export type { AxiosError, AxiosRequestConfig, AxiosInstance };
