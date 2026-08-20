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
import { api, AxiosRequestConfig } from '@/lib/api';

export interface StudentService {
  getStudents(filters?: StudentFilters, options?: AxiosRequestConfig): Promise<PaginatedResponse<StudentListItem>>;
  getStudentById(id: string, options?: AxiosRequestConfig): Promise<Student | null>;
  getStudentStats(options?: AxiosRequestConfig): Promise<StudentStats>;
  createStudent(input: CreateStudentInput): Promise<Student>;
  updateStudent(input: UpdateStudentInput): Promise<Student | null>;
  deleteStudent(id: string): Promise<boolean>;
  bulkUpdateStatus(
    ids: string[],
    status: StudentStatus,
  ): Promise<{ success: number; failed: number }>;
  archiveStudent(id: string): Promise<boolean>;
  getTimelineEvents(studentId: string): Promise<TimelineEvent[]>;
  getBatches(options?: AxiosRequestConfig): Promise<{ id: string; name: string }[]>;
  getCourses(options?: AxiosRequestConfig): Promise<{ id: string; name: string }[]>;
}

export const studentService: StudentService = {
  async getStudents(filters: StudentFilters = {}, options?: AxiosRequestConfig) {
    const params: Record<string, unknown> = {
      page: filters.page,
      limit: filters.perPage || 10,
      search: filters.search || undefined,
      sortBy: filters.sortBy || undefined,
      sortOrder: filters.sortOrder || undefined,
      batchId: filters.batchId || undefined,
      courseId: filters.courseId || undefined,
    };
    if (filters.status && filters.status !== 'ALL') {
      params.academicStatus = filters.status === 'INACTIVE' ? 'SUSPENDED' : filters.status;
    }
    const res = await api.get<PaginatedResponse<StudentListItem & { academicStatus?: string }>>(
      '/students',
      { ...options, params },
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

  async getStudentById(id: string, options?: AxiosRequestConfig) {
    const res = await api.get<Student & { academicStatus?: string }>(`/students/${id}`, options);
    return {
      ...res,
      status: (res.academicStatus || 'ACTIVE') as StudentStatus,
    };
  },

  async getStudentStats(options?: AxiosRequestConfig) {
    return api.get<StudentStats>('/students/stats', options);
  },

  async createStudent(input: CreateStudentInput) {
    const { bloodGroup, profileImage: _profileImage, ...rest } = input as any;
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
    }
    // Remove empty string fields that would fail backend whitelist validation
    Object.keys(data).forEach((key) => {
      if (data[key] === '' || data[key] === null || data[key] === undefined) {
        delete data[key];
      }
    });
    console.log('[STUDENT CREATE] Exact payload being sent to POST /api/v1/students:', JSON.stringify(data, null, 2));
    return api.post<Student>('/students', data, { skipGlobalToast: true } as any);
  },

  async updateStudent(input: UpdateStudentInput) {
    const { id, status, bloodGroup, profileImage: _profileImage, ...rest } = input as any;
    const data: Record<string, unknown> = { ...rest };
    if (status !== undefined) {
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
        data.bloodGroup = undefined;
      }
    } else if (bloodGroup === '') {
      data.bloodGroup = undefined;
    }
    // Remove empty string fields that would fail backend whitelist validation
    Object.keys(data).forEach((key) => {
      if (data[key] === '' || data[key] === null || data[key] === undefined) {
        delete data[key];
      }
    });
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

  async getBatches(options?: AxiosRequestConfig) {
    const res = await api.get<PaginatedResponse<any>>('/master/batches', {
      ...options,
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

  async getCourses(options?: AxiosRequestConfig) {
    const res = await api.get<PaginatedResponse<any>>('/master/courses', {
      ...options,
      params: { limit: 100 },
    });
    return (res.data || []).map((c: any) => ({ id: c.id, name: c.name }));
  },
};

export function createStudentService(): StudentService {
  return studentService;
}

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
