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
import { admissionMockService } from '@/features/admissions/mock/admissions.mock';

export interface AdmissionService {
  getAdmissions(filters?: AdmissionFilters): Promise<PaginatedResponse<AdmissionListItem>>;
  getAdmissionById(id: string): Promise<Admission | null>;
  getAdmissionStats(): Promise<AdmissionStats>;
  createAdmission(input: CreateAdmissionInput): Promise<Admission>;
  updateAdmissionStatus(input: UpdateAdmissionStatusInput): Promise<Admission | null>;
  getTimelineEvents(admissionId: string): Promise<TimelineEvent[]>;
  getStudents(): Promise<AdmissionStudent[]>;
  getCourses(): Promise<AdmissionCourse[]>;
  getBranches(): Promise<AdmissionBranch[]>;
  getBatches(courseId?: string): Promise<AdmissionBatch[]>;
  getAcademicYears(): Promise<{ id: string; name: string }[]>;
}

export const admissionService: AdmissionService = {
  getAdmissions: (filters) => admissionMockService.getAdmissions(filters),
  getAdmissionById: (id) => admissionMockService.getAdmissionById(id),
  getAdmissionStats: () => admissionMockService.getAdmissionStats(),
  createAdmission: (input) => admissionMockService.createAdmission(input),
  updateAdmissionStatus: (input) => admissionMockService.updateAdmissionStatus(input),
  getTimelineEvents: (id) => admissionMockService.getTimelineEvents(id),
  getStudents: () => admissionMockService.getStudents(),
  getCourses: () => admissionMockService.getCourses(),
  getBranches: () => admissionMockService.getBranches(),
  getBatches: (courseId) => admissionMockService.getBatches(courseId),
  getAcademicYears: () => admissionMockService.getAcademicYears(),
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
  return { ...admissionService };
}
