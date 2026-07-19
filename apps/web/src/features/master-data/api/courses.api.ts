import { api } from '@/lib/api';
import type { PaginatedResponse, FilterParams } from '@/types/api';
import type { Course, CreateCourseInput, UpdateCourseInput } from '../types';

export const coursesApi = {
  async getCourses(params?: FilterParams): Promise<PaginatedResponse<Course>> {
    return api.get<PaginatedResponse<Course>>('/master/courses', { params });
  },

  async getCourseById(id: string): Promise<Course> {
    return api.get<Course>(`/master/courses/${id}`);
  },

  async createCourse(input: CreateCourseInput): Promise<Course> {
    return api.post<Course>('/master/courses', input);
  },

  async updateCourse(id: string, input: UpdateCourseInput): Promise<Course> {
    const { code, ...updatePayload } = input;
    return api.patch<Course>(`/master/courses/${id}`, updatePayload);
  },

  async deleteCourse(id: string): Promise<void> {
    return api.delete<void>(`/master/courses/${id}`, { skipGlobalToast: true });
  },
};
