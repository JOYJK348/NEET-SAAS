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

export function isCancellationError(error: unknown): boolean {
  if (!error) return false;
  if (axios.isCancel(error)) return true;
  const err = error as any;
  // NOTE: ECONNABORTED is a *timeout* error, NOT a user cancellation - do not suppress it here
  if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
    return true;
  }
  const msg = (err.message || '').toString().toLowerCase();
  // Only match explicit user-initiated cancellations, not generic 'aborted' which can be timeouts
  if (
    msg === 'canceled' ||
    msg === 'cancelled' ||
    msg.includes('request aborted') ||
    msg.includes('request canceled') ||
    msg.includes('request cancelled')
  ) {
    return true;
  }
  if (err.config?.signal?.aborted) {
    return true;
  }
  return false;
}

export function sanitizeErrorMessage(msg: unknown, status?: number): string {
  if (!msg) {
    if (status === 401) return 'Unable to sign you in. Please check your details and try again.';
    if (status === 403) return "You don't have permission to perform this action.";
    if (status === 404) return 'The requested information could not be found.';
    return 'Something went wrong. Please try again later.';
  }

  const str = typeof msg === 'string' ? msg : String(msg);
  const lower = str.toLowerCase();

  const techKeywords = [
    'prisma',
    'this.prisma',
    'findfirst',
    'findmany',
    'findunique',
    'findraw',
    'aggregate',
    'groupby',
    "can't reach database",
    'database server',
    'supabase.co',
    'connection pool',
    'econnrefused',
    'etimedout',
    'invocation in',
    'at object.',
    'invalid `',
    'prismaclient',
    'clientknownrequesterror',
    'clientinitializationerror',
    'sqlstate',
    'd:\\',
    'c:\\',
    'node_modules',
    '.ts:',
    '.js:',
    'select ',
    'insert into',
    'update ',
    'delete from',
  ];

  const uploadKeywords = ['upload', 'multipart', 'storage', 's3', 'supabase storage'];

  if (techKeywords.some((keyword) => lower.includes(keyword))) {
    return 'Something went wrong. Please try again in a few moments.';
  }

  if (uploadKeywords.some((keyword) => lower.includes(keyword)) && status === 400) {
    return 'Unable to upload the file. Please try again.';
  }

  if (
    status === 401 &&
    (lower.includes('unauthorized') || lower.includes('jwt') || lower.includes('token'))
  ) {
    return 'Unable to sign you in. Please check your details and try again.';
  }

  if (status === 403 && (lower.includes('forbidden') || lower.includes('permission'))) {
    return "You don't have permission to perform this action.";
  }

  if (status === 404 && (lower.includes('not found') || lower.includes('cannot find'))) {
    return 'The requested information could not be found.';
  }

  return str;
}

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    const isLocal =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.local') ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^[\d.]+$/.test(host);

    if (isLocal) {
      return `http://${host}:3000/api/v1`;
    }
  }
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'https://neet-saas.onrender.com/api/v1'
  );
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - attach access token, tenant context, and dynamic baseURL
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        config.baseURL = getApiBaseUrl();
        const state = useAuthStore.getState();
        const accessToken = state.accessToken;
        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        if (state.user?.tenantId && config.headers) {
          config.headers['x-tenant-id'] = state.user.tenantId;
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
        // Ignore silent request cancellations (AbortSignal / fast typing / route changes / tab switches)
        // NOTE: ECONNABORTED (timeout) is NOT a cancellation — let it fall through to error handling
        if (isCancellationError(error)) {
          return Promise.reject(error);
        }

        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        const isAuthRequest =
          originalRequest.url?.includes('/auth/login') ||
          originalRequest.url?.includes('/auth/register') ||
          originalRequest.url?.includes('/auth/refresh') ||
          originalRequest.url?.includes('/login') ||
          originalRequest.url?.includes('/register');

        const resData = error.response?.data as any;
        const isInvalidJwt =
          error.response?.status === 401 ||
          (error.response?.status === 400 &&
            (resData?.error === 'InvalidJWT' ||
              resData?.code === 'InvalidJWT' ||
              (typeof resData?.message === 'string' && resData.message.includes('"exp" claim'))));

        // Handle 401 Unauthorized / InvalidJWT - attempt token refresh (except for login/register requests)
        if (isInvalidJwt && !originalRequest._retry && !isAuthRequest) {
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
            const rfToken = useAuthStore.getState().refreshToken;
            const response = await axios.post(
              `${getApiBaseUrl()}/auth/refresh`,
              rfToken ? { refreshToken: rfToken } : {},
              { withCredentials: true },
            );

            const refreshData = response.data?.data ?? response.data;
            const { accessToken: newAccessToken } = refreshData;
            useAuthStore.getState().setTokens(newAccessToken);

            // Process queued requests
            this.failedQueue.forEach(({ resolve }) => resolve(newAccessToken));
            this.failedQueue = [];

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }

            return this.client(originalRequest);
          } catch (refreshError) {
            const isCancel = isCancellationError(refreshError);
            const isAxiosErr = axios.isAxiosError(refreshError);
            const errorPayload = refreshError as AxiosError;

            const isNetworkError = isAxiosErr && !errorPayload.response;
            const isServerError =
              isAxiosErr &&
              errorPayload.response &&
              errorPayload.response.status &&
              errorPayload.response.status >= 500;

            if (isCancel || isNetworkError || isServerError) {
              // Aborted request, network dropout, or server error - reject queue without logging out
              this.failedQueue.forEach(({ reject }) => reject(refreshError));
              this.failedQueue = [];
              return Promise.reject(refreshError);
            }

            // Reject queued requests and log out the user
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
        const skipGlobalToast = originalRequest?.skipGlobalToast;
        if (!skipGlobalToast) {
          this.handleGlobalError(error);
        }

        return Promise.reject(error);
      },
    );
  }

  private handleGlobalError(error: AxiosError): void {
    // Suppress toasts for intentional request cancellations (AbortSignal / fast typing / route changes / tab switches)
    if (isCancellationError(error)) {
      return;
    }

    const status = error.response?.status;
    const rawMessage = (error.response?.data as { message?: string })?.message || error.message;
    const message = sanitizeErrorMessage(rawMessage, status);

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
          if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            toast.error('Request Timed Out', {
              description: 'The operation took too long to complete. Please try again.',
            });
          } else {
            toast.error('Network Error', {
              description:
                message || 'Unable to connect to the server. Please check your connection.',
            });
          }
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
