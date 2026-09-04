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
    const { branchIds, baseFee, feeStructureId, ...courseData } = input;
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

    // Auto-create Fee Plan if baseFee is provided and no pre-existing feeStructureId is selected
    if (baseFee && Number(baseFee) > 0 && course.id && !feeStructureId) {
      try {
        const activeYears = await api.get<any>('/master/academic-years?limit=1');
        const academicYearId = activeYears?.data?.[0]?.id || `AY_${Date.now()}`;
        const branches = await api.get<any>('/master/branches?limit=1');
        const branchId = branches?.data?.[0]?.id || `BRANCH_${Date.now()}`;

        await api.post('/billing/fee-plans', {
          courseId: course.id,
          academicYearId,
          branchId,
          departmentId: `DEPT_${Date.now()}`,
          code: `FEE-${(course.code || 'CRS').toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          name: `${course.displayName || course.name} Standard Fee Plan`,
          description: `Standard tuition fee plan for ${course.name}`,
          effectiveFrom: course.startDate ? new Date(course.startDate).toISOString() : new Date().toISOString(),
          effectiveTo: course.endDate ? new Date(course.endDate).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          items: [
            {
              itemName: 'Course Base Tuition Fee',
              amount: Number(baseFee),
              taxPercentage: 0,
              mandatory: true,
              refundable: false,
            },
          ],
        });
      } catch (err) {
        console.error('Failed to auto-create fee plan for course:', err);
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
