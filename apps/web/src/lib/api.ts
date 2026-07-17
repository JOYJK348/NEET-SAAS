import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

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
    // Request interceptor - attach access token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const accessToken = useAuthStore.getState().accessToken;
        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
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

        // Handle 401 Unauthorized - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue the request while token is being refreshed
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = useAuthStore.getState().refreshToken;
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              { refreshToken },
              { withCredentials: true },
            );

            const refreshData = response.data?.data ?? response.data;
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshData;
            useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

            // Process queued requests
            this.failedQueue.forEach(({ resolve }) => resolve(newAccessToken));
            this.failedQueue = [];

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }

            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - logout user
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];

            useAuthStore.getState().logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Global error handling
        this.handleGlobalError(error);

        return Promise.reject(error);
      },
    );
  }

  private handleGlobalError(error: AxiosError): void {
    const status = error.response?.status;
    const message = (error.response?.data as { message?: string })?.message || error.message;

    // Don't show toast for 401 (handled by refresh) or 422 (validation errors handled by forms)
    if (status === 401 || status === 422) {
      return;
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
      case 409:
        toast.error('Conflict', { description: message });
        break;
      case 429:
        toast.error('Too Many Requests', { description: 'Please try again later' });
        break;
      case 500:
        toast.error('Server Error', {
          description: 'An unexpected error occurred. Please try again later.',
        });
        break;
      case 503:
        toast.error('Service Unavailable', {
          description: 'The service is temporarily unavailable. Please try again later.',
        });
        break;
      default:
        if (status && status >= 500) {
          toast.error('Server Error', {
            description: 'An unexpected error occurred. Please try again later.',
          });
        } else if (!status) {
          toast.error('Network Error', {
            description: 'Unable to connect to the server. Please check your connection.',
          });
        }
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
