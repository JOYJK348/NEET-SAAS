import { api } from '@/lib/api';
import type { PaginatedResponse, FilterParams } from '@/types/api';
import type { Branch, CreateBranchInput, UpdateBranchInput } from '../types';

export const branchesApi = {
  async getBranches(params?: FilterParams): Promise<PaginatedResponse<Branch>> {
    return api.get<PaginatedResponse<Branch>>('/master/branches', { params });
  },

  async getBranchById(id: string): Promise<Branch> {
    return api.get<Branch>(`/master/branches/${id}`);
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
