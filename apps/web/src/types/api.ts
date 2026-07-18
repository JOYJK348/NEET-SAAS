export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
  from: number | null;
  to: number | null;
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface FilterParams extends PaginationParams {
  [key: string]: unknown;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface BulkActionResponse {
  success: number;
  failed: number;
  errors: Array<{
    id: string | number;
    error: string;
  }>;
}
