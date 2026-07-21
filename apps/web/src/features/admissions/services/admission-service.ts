import { api } from '@/lib/api';
import type {
  Admission,
  AdmissionListItem,
  AdmissionStats,
  AdmissionFilters,
  AdmissionStudent,
  AdmissionCourse,
  AdmissionBranch,
  AdmissionBatch,
  CreateAdmissionInput,
  UpdateAdmissionStatusInput,
  TimelineEvent,
} from '@/features/admissions/types/admission';
import type { PaginatedResponse } from '@/types/api';
import { coursesApi } from '@/features/master-data/api/courses.api';
import { branchesApi } from '@/features/master-data/api/branches.api';
import { academicYearsApi } from '@/features/master-data/api/academic-years.api';

export interface AdmissionService {
  getAdmissions(filters?: AdmissionFilters): Promise<PaginatedResponse<AdmissionListItem>>;
  getAdmissionById(id: string): Promise<Admission | null>;
  getAdmissionStats(): Promise<AdmissionStats>;
  createAdmission(input: CreateAdmissionInput): Promise<Admission>;
  updateAdmissionStatus(input: UpdateAdmissionStatusInput): Promise<Admission | null>;
  updateAdmissionBatch(input: { id: string; batchId: string }): Promise<Admission | null>;
  getTimelineEvents(admissionId: string): Promise<TimelineEvent[]>;
  getStudents(): Promise<AdmissionStudent[]>;
  getCourses(): Promise<AdmissionCourse[]>;
  getBranches(): Promise<AdmissionBranch[]>;
  getBatches(courseId?: string, branchId?: string): Promise<AdmissionBatch[]>;
  getAcademicYears(): Promise<{ id: string; name: string }[]>;
}

export const admissionService: AdmissionService = {
  async getAdmissions(filters) {
    const raw = await api.get<any>('/admissions', {
      params: {
        page: filters?.page,
        limit: filters?.perPage || 10,
        search: filters?.search || undefined,
        status: filters?.status && filters.status !== 'ALL' ? filters.status : undefined,
        courseId: filters?.courseId || undefined,
        branchId: filters?.branchId || undefined,
        academicYearId: filters?.academicYearId || undefined,
        studentProfileId: filters?.studentProfileId || undefined,
      },
    });
    const backendMeta = raw?.meta || {};
    const page = backendMeta.page || 1;
    const limit = backendMeta.limit || 10;
    const total = backendMeta.total || 0;
    const totalPages = backendMeta.totalPages || 1;
    return {
      data: raw?.data || [],
      meta: {
        currentPage: page,
        perPage: limit,
        total,
        lastPage: totalPages,
        from: total > 0 ? (page - 1) * limit + 1 : null,
        to: total > 0 ? Math.min(page * limit, total) : null,
      },
    };
  },

  async getAdmissionById(id) {
    return api.get<Admission>(`/admissions/${id}`);
  },

  async getAdmissionStats() {
    return api.get<AdmissionStats>('/admissions/stats');
  },

  async createAdmission(input) {
    const { studentProfileId, ...body } = input;
    return api.post<Admission>(`/students/${studentProfileId}/admissions`, body, {
      skipGlobalToast: true,
    } as any);
  },

  async updateAdmissionStatus(input) {
    const { id, status, notes } = input;
    return api.patch<Admission>(`/admissions/${id}/status`, {
      status,
      reason: notes,
    });
  },

  async updateAdmissionBatch(input: { id: string; batchId: string }) {
    const { id, batchId } = input;
    return api.patch<Admission>(`/admissions/${id}/batch`, {
      batchId,
    });
  },

  async getTimelineEvents(admissionId) {
    const history = await api.get<any[]>(`/admissions/${admissionId}/history`);
    return (history || []).map((h: any) => ({
      id: h.id,
      type: 'STATUS_CHANGE' as const,
      title: `Status changed to ${h.toStatus}`,
      description: h.reason || undefined,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      createdBy: h.changedBy,
      createdAt: h.changedAt || h.createdAt,
    }));
  },

  async getStudents() {
    const res = await api.get<PaginatedResponse<any>>('/students', {
      params: { limit: 100, academicStatus: 'ACTIVE' },
    });
    return (res.data || []).map((s: any) => ({
      id: s.id,
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      email: s.email || '',
      phone: s.phone || '',
      gender: s.gender || '',
    }));
  },

  async getCourses() {
    const res = await coursesApi.getCourses({ limit: 100 });
    return res.data.map((c) => ({ id: c.id, name: c.name, code: c.code }));
  },

  async getBranches() {
    const res = await branchesApi.getBranches({ limit: 100, status: 'ACTIVE' } as any);
    return res.data.map((b) => ({ id: b.id, name: b.name, code: b.code }));
  },

  async getBatches(courseId?: string, branchId?: string) {
    const res = await api.get<PaginatedResponse<any>>('/master/batches', {
      params: {
        limit: 100,
        ...(courseId ? { courseId } : {}),
        ...(branchId ? { branchId } : {}),
      },
    });
    return (res.data || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      courseName: b.courseName,
      branchId: b.branchId,
      courseId: b.courseId,
      academicYearId: b.academicYearId,
    }));
  },

  async getAcademicYears() {
    const res = await academicYearsApi.getAcademicYears({ limit: 100, status: 'ACTIVE' } as any);
    return res.data.map((y) => ({ id: y.id, name: y.name }));
  },
};

export const admissionServiceKeys = {
  all: ['admissions'] as const,
  lists: () => [...admissionServiceKeys.all, 'list'] as const,
  list: (filters?: AdmissionFilters) => [...admissionServiceKeys.lists(), filters] as const,
  details: () => [...admissionServiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...admissionServiceKeys.details(), id] as const,
  timeline: (admissionId: string) =>
    [...admissionServiceKeys.detail(admissionId), 'timeline'] as const,
  stats: () => [...admissionServiceKeys.all, 'stats'] as const,
  students: () => [...admissionServiceKeys.all, 'students'] as const,
  courses: () => [...admissionServiceKeys.all, 'courses'] as const,
  branches: () => [...admissionServiceKeys.all, 'branches'] as const,
  batches: (courseId?: string) =>
    courseId
      ? ([...admissionServiceKeys.all, 'batches', courseId] as const)
      : ([...admissionServiceKeys.all, 'batches'] as const),
  academicYears: () => [...admissionServiceKeys.all, 'academicYears'] as const,
};

export function createAdmissionService(): AdmissionService {
  return admissionService;
}
