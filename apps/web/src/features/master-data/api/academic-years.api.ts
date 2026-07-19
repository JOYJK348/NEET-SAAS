import { api } from '@/lib/api';
import type { PaginatedResponse, FilterParams } from '@/types/api';
import type { AcademicYear, CreateAcademicYearInput, UpdateAcademicYearInput } from '../types';

export const academicYearsApi = {
  async getAcademicYears(params?: FilterParams): Promise<PaginatedResponse<AcademicYear>> {
    return api.get<PaginatedResponse<AcademicYear>>('/master/academic-years', { params });
  },

  async getAcademicYearById(id: string): Promise<AcademicYear> {
    return api.get<AcademicYear>(`/master/academic-years/${id}`);
  },

  async createAcademicYear(input: CreateAcademicYearInput): Promise<AcademicYear> {
    return api.post<AcademicYear>('/master/academic-years', input);
  },

  async updateAcademicYear(id: string, input: UpdateAcademicYearInput): Promise<AcademicYear> {
    const { code, ...updatePayload } = input;
    return api.patch<AcademicYear>(`/master/academic-years/${id}`, updatePayload);
  },

  async deleteAcademicYear(id: string): Promise<void> {
    return api.delete<void>(`/master/academic-years/${id}`);
  },
};
