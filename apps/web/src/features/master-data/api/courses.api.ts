import { api, AxiosRequestConfig } from '@/lib/api';
import type { PaginatedResponse, FilterParams } from '@/types/api';
import type { Course, CreateCourseInput, UpdateCourseInput } from '../types';

export const coursesApi = {
  async getCourses(params?: FilterParams, options?: AxiosRequestConfig): Promise<PaginatedResponse<Course>> {
    return api.get<PaginatedResponse<Course>>('/master/courses', { ...options, params });
  },

  async getCourseById(id: string, options?: AxiosRequestConfig): Promise<Course> {
    return api.get<Course>(`/master/courses/${id}`, options);
  },

  async createCourse(input: CreateCourseInput): Promise<Course> {
    const { branchIds, ...courseData } = input;
    const course = await api.post<Course>('/master/courses', courseData);

    if (branchIds && branchIds.length > 0 && course.id) {
      // Fetch active academic year
      try {
        const activeYears = await api.get<any>('/master/academic-years?limit=1');
        const academicYearId = activeYears?.data?.[0]?.id;
        if (academicYearId) {
          for (const branchId of branchIds) {
            await api.post('/master/branch-courses', {
              branchId,
              courseId: course.id,
              academicYearId,
            }).catch(() => {});
          }
        }
      } catch {
        // Ignore branch-courses mapping error
      }
    }

    return course;
  },

  async updateCourse(id: string, input: UpdateCourseInput): Promise<Course> {
    const { code, ...updatePayload } = input;
    return api.patch<Course>(`/master/courses/${id}`, updatePayload);
  },

  async deleteCourse(id: string): Promise<void> {
    return api.delete<void>(`/master/courses/${id}`, { skipGlobalToast: true });
  },
};
