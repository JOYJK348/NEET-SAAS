import type { PaginationParams, PaginatedResponse } from '@/types/api';

export type AdmissionStatus = 'ACTIVE' | 'INACTIVE';

export interface Admission {
  id: string;
  admissionNumber: string;
  studentProfileId: string;
  academicYearId: string;
  courseId: string;
  branchId: string;
  admissionStatus: AdmissionStatus;
  admissionDate: string;
  student: AdmissionStudent;
  course: AdmissionCourse;
  branch: AdmissionBranch;
  batch?: AdmissionBatch;
  parent?: AdmissionParent;
  timeline?: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionListItem {
  id: string;
  admissionNumber: string;
  studentName: string;
  studentPhoto?: string;
  courseId: string;
  courseName: string;
  branchId: string;
  branchName: string;
  batchId?: string | null;
  batchName?: string;
  admissionStatus: AdmissionStatus;
  admissionDate: string;
}

export interface AdmissionStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface AdmissionCourse {
  id: string;
  name: string;
  code?: string;
  duration?: string;
}

export interface AdmissionBranch {
  id: string;
  name: string;
  code?: string;
}

export interface AdmissionBatch {
  id: string;
  name: string;
  courseName?: string;
  academicYearId?: string;
  branchId?: string;
  courseId?: string;
}

export interface AdmissionParent {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface AdmissionFilters extends PaginationParams {
  search?: string;
  status?: AdmissionStatus | 'ALL';
  academicYearId?: string;
  courseId?: string;
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
  studentProfileId?: string;
}

export type AdmissionListResponse = PaginatedResponse<AdmissionListItem>;
export type AdmissionStatsResponse = AdmissionStats;

export interface AdmissionStats {
  total: number;
  active: number;
  inactive: number;
  changeFromLastMonth: number;
}

export interface CreateAdmissionInput {
  studentProfileId: string;
  academicYearId: string;
  courseId: string;
  branchId: string;
  admissionDate: string;
  notes?: string;
}

export interface UpdateAdmissionStatusInput {
  id: string;
  status: AdmissionStatus;
  notes?: string;
}

export interface AdmissionStatusHistory {
  id: string;
  fromStatus: AdmissionStatus;
  toStatus: AdmissionStatus;
  changedBy: string;
  changedAt: string;
  notes?: string;
}

export type TimelineEventType = 'STATUS_CHANGE' | 'CREATED' | 'UPDATED' | 'NOTE_ADDED';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  fromStatus?: AdmissionStatus;
  toStatus?: AdmissionStatus;
  createdBy: string;
  createdAt: string;
}

export const ADMISSION_STATUS_LABELS: Record<AdmissionStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const ADMISSION_STATUS_COLORS: Record<AdmissionStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INACTIVE: 'bg-red-100 text-red-800 border-red-200',
};

export const ADMISSION_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
] as const;
