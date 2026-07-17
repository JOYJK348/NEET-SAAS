import { api } from '@/lib/api';
import type { PaginatedResponse, PaginationParams } from '@/types/api';

export interface BaseServiceConfig {
  baseUrl: string;
}

export abstract class BaseService {
  protected api = api;
  protected baseUrl: string;

  constructor(config: BaseServiceConfig) {
    this.baseUrl = config.baseUrl;
  }

  protected getUrl(url: string): string {
    return `${this.baseUrl}${url}`;
  }

  protected async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.api.get<T>(this.getUrl(url), { params });
    return response;
  }

  protected async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.api.post<T>(this.getUrl(url), data);
    return response;
  }

  protected async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.api.put<T>(this.getUrl(url), data);
    return response;
  }

  protected async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.api.patch<T>(this.getUrl(url), data);
    return response;
  }

  protected async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete<T>(this.getUrl(url));
    return response;
  }

  protected async getPaginated<T>(
    url: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<T>> {
    const response = await this.api.get<PaginatedResponse<T>>(this.getUrl(url), { params });
    return response;
  }
}
