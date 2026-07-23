import { api } from '@/lib/api';
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

  findAll: (filters?: TutorFilters): Promise<PaginatedResult<Tutor>> =>
    api.get('/people/tutors', { params: filters }),

  findOne: (id: string): Promise<Tutor> => api.get(`/people/tutors/${id}`),

  update: (id: string, data: UpdateTutorInput): Promise<Tutor> =>
    api.patch(`/people/tutors/${id}`, data),

  remove: (id: string): Promise<void> => api.delete(`/people/tutors/${id}`),

  getSubjects: async (): Promise<{ id: string; name: string; code: string }[]> => {
    const res =
      await api.get<PaginatedResponse<{ id: string; name: string; code: string }>>(
        '/master/subjects',
      );
    return res.data;
  },

  getBranches: async (): Promise<{ id: string; name: string; code: string }[]> => {
    const res =
      await api.get<PaginatedResponse<{ id: string; name: string; code: string }>>(
        '/master/branches',
      );
    return res.data;
  },
};
