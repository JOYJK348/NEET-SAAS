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
import { batchMockService } from '@/features/batches/mock/batches.mock';

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
}

export const batchService: BatchService = {
  getBatches: (filters) => batchMockService.getBatches(filters),
  getBatchById: (id) => batchMockService.getBatchById(id),
  getBatchStats: () => batchMockService.getBatchStats(),
  createBatch: (input) => batchMockService.createBatch(input),
  updateBatch: (input) => batchMockService.updateBatch(input),
  archiveBatch: (id) => batchMockService.archiveBatch(id),
  getTimelineEvents: (batchId) => batchMockService.getTimelineEvents(batchId),
  getBatchStudents: (batchId) => batchMockService.getBatchStudents(batchId),
  getBatchStaffAssignments: (batchId) => batchMockService.getBatchStaffAssignments(batchId),
  getDeliveryTypes: () => batchMockService.getDeliveryTypes(),
  getCourses: () => batchMockService.getCourses(),
  getBranches: () => batchMockService.getBranches(),
  getAcademicYears: () => batchMockService.getAcademicYears(),
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
