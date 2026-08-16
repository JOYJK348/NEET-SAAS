import { api, AxiosRequestConfig } from '@/lib/api';
import type {
  Tutor,
  CreateTutorInput,
  UpdateTutorInput,
  TutorFilters,
  PaginatedResult,
} from '../types/tutor';
import type { PaginatedResponse } from '@/types/api';

export const tutorService = {
  keys: {
    all: ['tutors'] as const,
    list: (filters?: TutorFilters) => ['tutors', 'list', filters] as const,
    detail: (id: string) => ['tutors', 'detail', id] as const,
    subjects: () => ['tutors', 'subjects'] as const,
    branches: () => ['tutors', 'branches'] as const,
  },

  create: (data: CreateTutorInput): Promise<Tutor> => api.post('/people/tutors', data),

  findAll: (filters?: TutorFilters, options?: AxiosRequestConfig): Promise<PaginatedResult<Tutor>> =>
    api.get('/people/tutors', { ...options, params: filters }),

  findOne: (id: string, options?: AxiosRequestConfig): Promise<Tutor> =>
    api.get(`/people/tutors/${id}`, options),

  update: (id: string, data: UpdateTutorInput): Promise<Tutor> =>
    api.patch(`/people/tutors/${id}`, data),

  remove: (id: string): Promise<void> => api.delete(`/people/tutors/${id}`),

  getSubjects: async (options?: AxiosRequestConfig): Promise<{ id: string; name: string; code: string }[]> => {
    const res = await api.get<PaginatedResponse<{ id: string; name: string; code: string }>>(
      '/master/subjects',
      options,
    );
    return res.data;
  },

  getBranches: async (options?: AxiosRequestConfig): Promise<{ id: string; name: string; code: string }[]> => {
    const res = await api.get<PaginatedResponse<{ id: string; name: string; code: string }>>(
      '/master/branches',
      options,
    );
    return res.data;
  },
};
