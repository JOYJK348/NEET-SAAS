import { api, AxiosRequestConfig } from '@/lib/api';
import type { PaginatedResponse, FilterParams } from '@/types/api';
import type { Branch, CreateBranchInput, UpdateBranchInput } from '../types';

export const branchesApi = {
  async getBranches(params?: FilterParams, options?: AxiosRequestConfig): Promise<PaginatedResponse<Branch>> {
    return api.get<PaginatedResponse<Branch>>('/master/branches', { ...options, params });
  },

  async getBranchById(id: string, options?: AxiosRequestConfig): Promise<Branch> {
    return api.get<Branch>(`/master/branches/${id}`, options);
  },

  async createBranch(input: CreateBranchInput): Promise<Branch> {
    return api.post<Branch>('/master/branches', input);
  },

  async updateBranch(id: string, input: UpdateBranchInput): Promise<Branch> {
    const { code, ...updatePayload } = input;
    return api.patch<Branch>(`/master/branches/${id}`, updatePayload);
  },

  async deleteBranch(id: string): Promise<void> {
    return api.delete<void>(`/master/branches/${id}`);
  },
};
