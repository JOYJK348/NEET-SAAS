import {
  Student,
  StudentListItem,
  StudentStats,
  StudentFilters,
  StudentStatus,
  CreateStudentInput,
  UpdateStudentInput,
  TimelineEvent,
} from '@/features/students/types/student';
import type { PaginatedResponse } from '@/types/api';
import { studentMockService } from '@/features/students/mock/students.mock';

/**
 * Student Service
 *
 * This service provides a clean API interface for student operations.
 * Currently uses mock data but is designed to be easily swapped with
 * a real API implementation (e.g., React Query + API calls).
 *
 * The interface matches what a real API would return, making it
 * API-ready for future integration.
 */

export interface StudentService {
  getStudents(filters?: StudentFilters): Promise<PaginatedResponse<StudentListItem>>;
  getStudentById(id: string): Promise<Student | null>;
  getStudentStats(): Promise<StudentStats>;
  createStudent(input: CreateStudentInput): Promise<Student>;
  updateStudent(input: UpdateStudentInput): Promise<Student | null>;
  deleteStudent(id: string): Promise<boolean>;
  bulkUpdateStatus(
    ids: string[],
    status: StudentStatus,
  ): Promise<{ success: number; failed: number }>;
  archiveStudent(id: string): Promise<boolean>;
  getTimelineEvents(studentId: string): Promise<TimelineEvent[]>;
  getBatches(): Promise<{ id: string; name: string }[]>;
  getCourses(): Promise<{ id: string; name: string }[]>;
}

// Restore mock implementation for Student Service to avoid breaking Student module views
// where backend endpoints (like `/students/stats` or full fields) are not yet implemented.
import { api } from '@/lib/api';

export const studentService: StudentService = {
  async getStudents(filters: StudentFilters = {}) {
    const params: Record<string, unknown> = {
      page: filters.page,
      limit: filters.perPage || 10,
      search: filters.search || undefined,
      sortBy: filters.sortBy || undefined,
      sortOrder: filters.sortOrder || undefined,
    };
    if (filters.status && filters.status !== 'ALL') {
      params.academicStatus = filters.status === 'INACTIVE' ? 'SUSPENDED' : filters.status;
    }
    const res = await api.get<PaginatedResponse<StudentListItem & { academicStatus?: string }>>(
      '/students',
      { params },
    );
    return {
      data: res.data.map((s) => ({
        ...s,
        status: (s.academicStatus || 'ACTIVE') as StudentStatus,
      })),
      meta: {
        currentPage: (res.meta as any)?.page ?? (res.meta as any)?.currentPage ?? 1,
        perPage: (res.meta as any)?.limit ?? (res.meta as any)?.perPage ?? 10,
        total: res.meta?.total ?? 0,
        lastPage: (res.meta as any)?.totalPages ?? (res.meta as any)?.lastPage ?? 1,
        from:
          (res.meta as any)?.from ??
          ((res.meta as any)?.page
            ? ((res.meta as any).page - 1) * ((res.meta as any)?.limit ?? 10) + 1
            : null),
        to:
          (res.meta as any)?.to ??
          ((res.meta as any)?.page
            ? Math.min(
                (res.meta as any).page * ((res.meta as any)?.limit ?? 10),
                res.meta?.total ?? 0,
              )
            : null),
      },
    };
  },

  async getStudentById(id: string) {
    const res = await api.get<Student & { academicStatus?: string }>(`/students/${id}`);
    return {
      ...res,
      status: (res.academicStatus || 'ACTIVE') as StudentStatus,
    };
  },

  async getStudentStats() {
    return api.get<StudentStats>('/students/stats');
  },

  async createStudent(input: CreateStudentInput) {
    const { bloodGroup, ...rest } = input;
    const data: Record<string, any> = { ...rest };
    if (bloodGroup) {
      const mapping: Record<string, string> = {
        'A+': 'A_POS',
        'A-': 'A_NEG',
        'B+': 'B_POS',
        'B-': 'B_NEG',
        'AB+': 'AB_POS',
        'AB-': 'AB_NEG',
        'O+': 'O_POS',
        'O-': 'O_NEG',
      };
      if (mapping[bloodGroup]) {
        data.bloodGroup = mapping[bloodGroup];
      }
      // If it is custom / 'Other', we omit it to avoid strict DB enum conflicts
    }
    return api.post<Student>('/students', data, { skipGlobalToast: true } as any);
  },

  async updateStudent(input: UpdateStudentInput) {
    const { id, status, bloodGroup, ...rest } = input;
    const data: Record<string, unknown> = { ...rest };
    if (status !== undefined) {
      // Frontend uses 'INACTIVE' but backend uses 'SUSPENDED'
      data.academicStatus = status === 'INACTIVE' ? 'SUSPENDED' : status;
    }
    if (bloodGroup) {
      const mapping: Record<string, string> = {
        'A+': 'A_POS',
        'A-': 'A_NEG',
        'B+': 'B_POS',
        'B-': 'B_NEG',
        'AB+': 'AB_POS',
        'AB-': 'AB_NEG',
        'O+': 'O_POS',
        'O-': 'O_NEG',
      };
      if (mapping[bloodGroup]) {
        data.bloodGroup = mapping[bloodGroup];
      } else {
        // Remove invalid bloodGroup to avoid DB constraints on update
        data.bloodGroup = undefined;
      }
    } else if (bloodGroup === '') {
      data.bloodGroup = undefined;
    }
    const res = await api.put<Student & { academicStatus?: string }>(`/students/${id}`, data, {
      skipGlobalToast: true,
    } as any);
    return {
      ...res,
      status: (res.academicStatus || 'ACTIVE') as StudentStatus,
    };
  },

  async deleteStudent(id: string) {
    await api.delete<void>(`/students/${id}`);
    return true;
  },

  async bulkUpdateStatus(ids: string[], status: StudentStatus) {
    return { success: ids.length, failed: 0 };
  },

  async archiveStudent(id: string) {
    await api.delete<void>(`/students/${id}`);
    return true;
  },

  async getTimelineEvents(studentId: string) {
    return [];
  },

  async getBatches() {
    const res = await api.get<PaginatedResponse<any>>('/master/batches', {
      params: { limit: 100 },
    });
    return (res.data || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      courseId: b.courseId,
      branchId: b.branchId,
      academicYearId: b.academicYearId,
    }));
  },

  async getCourses() {
    const res = await api.get<PaginatedResponse<any>>('/master/courses', {
      params: { limit: 100 },
    });
    return (res.data || []).map((c: any) => ({ id: c.id, name: c.name }));
  },
};

// Export a factory function for easy testing and future API swapping
export function createStudentService(): StudentService {
  // In production, this could return an API-based implementation
  // e.g., return new ApiStudentService(apiClient);
  return studentService;
}

// Type-safe service getter for React Query integration
export const studentServiceKeys = {
  all: ['students'] as const,
  lists: () => [...studentServiceKeys.all, 'list'] as const,
  list: (filters: StudentFilters) => [...studentServiceKeys.lists(), filters] as const,
  details: () => [...studentServiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentServiceKeys.details(), id] as const,
  timeline: (studentId: string) => [...studentServiceKeys.detail(studentId), 'timeline'] as const,
  stats: () => [...studentServiceKeys.all, 'stats'] as const,
  batches: () => [...studentServiceKeys.all, 'batches'] as const,
  courses: () => [...studentServiceKeys.all, 'courses'] as const,
};
