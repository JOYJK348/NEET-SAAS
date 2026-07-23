import { api } from '@/lib/api';
import type {
  Batch,
  BatchListItem,
  BatchStats,
  BatchFilters,
  BatchDeliveryType,
  BatchStudentEnrollment,
  BatchStaffAssignment,
  BatchTimelineEvent,
  CreateBatchInput,
  UpdateBatchInput,
} from '@/features/batches/types/batch';
import type { PaginatedResponse } from '@/types/api';
import { coursesApi } from '@/features/master-data/api/courses.api';
import { branchesApi } from '@/features/master-data/api/branches.api';
import { academicYearsApi } from '@/features/master-data/api/academic-years.api';
import { batchDeliveryTypesApi } from '@/features/master-data/api/batch-delivery-types.api';

export interface BatchService {
  getBatches(filters?: BatchFilters): Promise<PaginatedResponse<BatchListItem>>;
  getBatchById(id: string): Promise<Batch | null>;
  getBatchStats(): Promise<BatchStats>;
  createBatch(input: CreateBatchInput): Promise<Batch>;
  updateBatch(input: UpdateBatchInput): Promise<Batch | null>;
  archiveBatch(id: string): Promise<boolean>;
  getTimelineEvents(batchId: string): Promise<BatchTimelineEvent[]>;
  getBatchStudents(batchId: string): Promise<BatchStudentEnrollment[]>;
  getBatchStaffAssignments(batchId: string): Promise<BatchStaffAssignment[]>;
  getDeliveryTypes(): Promise<BatchDeliveryType[]>;
  getCourses(): Promise<{ id: string; name: string }[]>;
  getBranches(): Promise<{ id: string; name: string }[]>;
  getAcademicYears(): Promise<{ id: string; name: string }[]>;
  enrollStudent(admissionId: string, batchId: string): Promise<any>;
  assignStaff(batchId: string, staffProfileId: string, subjectId: string): Promise<any>;
  unassignStaff(batchId: string, assignmentId: string): Promise<void>;
}

export const batchService: BatchService = {
  async getBatches(filters) {
    const cleanedFilters = { ...filters };
    Object.keys(cleanedFilters).forEach((key) => {
      const val = cleanedFilters[key as keyof typeof cleanedFilters];
      if (val === '' || val === null || val === undefined) {
        delete cleanedFilters[key as keyof typeof cleanedFilters];
      }
    });
    return api.get<PaginatedResponse<BatchListItem>>('/master/batches', { params: cleanedFilters });
  },

  async getBatchById(id) {
    return api.get<Batch>(`/master/batches/${id}`);
  },

  async getBatchStats() {
    return api.get<BatchStats>('/master/batches/stats');
  },

  async createBatch(input) {
    return api.post<Batch>('/master/batches', input);
  },

  async updateBatch(input) {
    const { id, ...updatePayload } = input;
    return api.patch<Batch>(`/master/batches/${id}`, updatePayload);
  },

  async archiveBatch(id) {
    await api.patch(`/master/batches/${id}`, { status: 'ARCHIVED' });
    return true;
  },

  async getTimelineEvents(batchId) {
    return api.get<BatchTimelineEvent[]>(`/master/batches/${batchId}/timeline`);
  },

  async getBatchStudents(batchId) {
    return api.get<BatchStudentEnrollment[]>(`/master/batches/${batchId}/students`);
  },

  async getBatchStaffAssignments(batchId) {
    return api.get<BatchStaffAssignment[]>(`/master/batches/${batchId}/staff`);
  },

  async getDeliveryTypes() {
    const res = await batchDeliveryTypesApi.getDeliveryTypes({ limit: 10 });
    return res.data.map((dt) => ({
      ...dt,
      description: dt.description || '',
    })) as BatchDeliveryType[];
  },

  async getCourses() {
    const res = await coursesApi.getCourses({ limit: 100 });
    return res.data.map((c) => ({ id: c.id, name: c.name }));
  },

  async getBranches() {
    const res = await branchesApi.getBranches({ limit: 100, status: 'ACTIVE' } as any);
    return res.data.map((b) => ({ id: b.id, name: b.name }));
  },

  async getAcademicYears() {
    const res = await academicYearsApi.getAcademicYears({ limit: 100, status: 'ACTIVE' } as any);
    return res.data.map((y) => ({ id: y.id, name: y.name }));
  },

  async enrollStudent(admissionId, batchId) {
    return api.post(`/admissions/${admissionId}/batches`, { batchId });
  },

  async assignStaff(batchId, staffProfileId, subjectId) {
    return api.post(`/master/batches/${batchId}/staff`, { staffProfileId, subjectId });
  },

  async unassignStaff(batchId, assignmentId) {
    return api.delete(`/master/batches/${batchId}/staff/${assignmentId}`);
  },
};

export const batchServiceKeys = {
  all: ['batches'] as const,
  lists: () => [...batchServiceKeys.all, 'list'] as const,
  list: (filters: BatchFilters) => [...batchServiceKeys.lists(), filters] as const,
  details: () => [...batchServiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...batchServiceKeys.details(), id] as const,
  timeline: (batchId: string) => [...batchServiceKeys.detail(batchId), 'timeline'] as const,
  stats: () => [...batchServiceKeys.all, 'stats'] as const,
  students: (batchId: string) => [...batchServiceKeys.detail(batchId), 'students'] as const,
  staff: (batchId: string) => [...batchServiceKeys.detail(batchId), 'staff'] as const,
  deliveryTypes: () => [...batchServiceKeys.all, 'delivery-types'] as const,
  courses: () => [...batchServiceKeys.all, 'courses'] as const,
  branches: () => [...batchServiceKeys.all, 'branches'] as const,
  academicYears: () => [...batchServiceKeys.all, 'academic-years'] as const,
};
