import type { PaginationParams, PaginatedResponse } from '@/types/api';

export type BatchStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';

export type AttendanceMode = 'CLASSROOM' | 'ONLINE' | 'HYBRID';

export interface Batch {
  id: string;
  code: string;
  name: string;
  description: string;
  branchId: string;
  branchName: string;
  courseId: string;
  courseName: string;
  academicYearId: string;
  academicYearName: string;
  deliveryTypeId: string;
  deliveryType?: BatchDeliveryType;
  status: BatchStatus;
  maxStudents: number;
  enrolledCount: number;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  allowNewAdmissions: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BatchListItem {
  id: string;
  code: string;
  name: string;
  status: BatchStatus;
  branchId: string;
  branchName: string;
  courseId: string;
  courseName: string;
  academicYearId: string;
  academicYearName: string;
  deliveryTypeName: string;
  attendanceMode: AttendanceMode;
  maxStudents: number;
  enrolledCount: number;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  allowNewAdmissions: boolean;
}

export interface BatchDeliveryType {
  id: string;
  code: string;
  name: string;
  description: string;
  attendanceMode: AttendanceMode;
  defaultMaxStudents: number;
  colorCode: string;
  iconName: string;
}

export interface BatchFilters extends PaginationParams {
  search?: string;
  status?: BatchStatus | 'ALL';
  courseId?: string;
  branchId?: string;
  academicYearId?: string;
  deliveryTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface BatchStats {
  total: number;
  planned: number;
  active: number;
  completed: number;
  cancelled: number;
  archived: number;
  totalCapacity: number;
  totalEnrolled: number;
  utilizationRate: number;
}

export interface CreateBatchInput {
  code: string;
  name: string;
  description: string;
  branchId: string;
  courseId: string;
  academicYearId: string;
  deliveryTypeId: string;
  maxStudents: number;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  allowNewAdmissions: boolean;
}

export interface UpdateBatchInput extends Partial<CreateBatchInput> {
  id: string;
  status?: BatchStatus;
}

export interface BatchStudentEnrollment {
  id: string;
  studentId: string;
  studentName: string;
  email: string;
  phone: string;
  joinedAt: string;
  status: BatchStatus;
  isPrimary: boolean;
}

export interface BatchStaffAssignment {
  id: string;
  staffId: string;
  staffName: string;
  subject: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
}

export interface BatchTimelineEvent {
  id: string;
  batchId: string;
  type:
    | 'CREATED'
    | 'STATUS_CHANGED'
    | 'UPDATED'
    | 'STUDENT_ENROLLED'
    | 'STUDENT_REMOVED'
    | 'STAFF_ASSIGNED'
    | 'STAFF_REMOVED';
  title: string;
  description?: string;
  fromStatus?: BatchStatus;
  toStatus?: BatchStatus;
  createdBy: string;
  createdAt: string;
}

export type BatchListResponse = PaginatedResponse<BatchListItem>;

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  PLANNED: 'Planned',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ARCHIVED: 'Archived',
};

export const BATCH_STATUS_COLORS: Record<BatchStatus, string> = {
  PLANNED: 'bg-blue-100 text-blue-800 border-blue-200',
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  ARCHIVED: 'bg-purple-100 text-purple-800 border-purple-200',
};

export const BATCH_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const;

export const BATCH_ATTENDANCE_MODE_LABELS: Record<AttendanceMode, string> = {
  CLASSROOM: 'Classroom',
  ONLINE: 'Online',
  HYBRID: 'Hybrid',
};

export const VALID_TRANSITIONS: Record<BatchStatus, BatchStatus[]> = {
  PLANNED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['ARCHIVED'],
  CANCELLED: ['ARCHIVED'],
  ARCHIVED: [],
};
