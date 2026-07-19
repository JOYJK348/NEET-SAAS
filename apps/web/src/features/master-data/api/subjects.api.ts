import { api } from '@/lib/api';
import type { PaginatedResponse, FilterParams } from '@/types/api';
import type { Subject, CreateSubjectInput, UpdateSubjectInput } from '../types';

export const subjectsApi = {
  async getSubjects(params?: FilterParams): Promise<PaginatedResponse<Subject>> {
    return api.get<PaginatedResponse<Subject>>('/master/subjects', { params });
  },

  async getSubjectById(id: string): Promise<Subject> {
    return api.get<Subject>(`/master/subjects/${id}`);
  },

  async createSubject(input: CreateSubjectInput): Promise<Subject> {
    return api.post<Subject>('/master/subjects', input);
  },

  async updateSubject(id: string, input: UpdateSubjectInput): Promise<Subject> {
    const { code, ...updatePayload } = input;
    return api.patch<Subject>(`/master/subjects/${id}`, updatePayload);
  },

  async deleteSubject(id: string): Promise<void> {
    return api.delete<void>(`/master/subjects/${id}`);
  },
};
