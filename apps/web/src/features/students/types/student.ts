import type { PaginationParams, PaginationMeta, PaginatedResponse } from '@/types/api';

export type StudentStatus =
  'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'GRADUATED' | 'DROPPED_OUT';

export type StudentGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Student {
  id: string;
  studentId: string; // Human-readable ID like "STU-2024-001"
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // ISO date string
  gender: StudentGender;
  status: StudentStatus;
  batchId: string;
  batchName: string;
  courseId: string;
  courseName: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  admissionDate: string; // ISO date string
  profileImage?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  aadharNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentListItem {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  batchName: string;
  courseName: string;
  status: StudentStatus;
  admissionDate: string;
  profileImage?: string;
}

export interface StudentFilters extends PaginationParams {
  search?: string;
  status?: StudentStatus | 'ALL';
  batchId?: string;
  courseId?: string;
  gender?: StudentGender;
  dateFrom?: string;
  dateTo?: string;
}

export interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suspended: number;
  graduated: number;
  droppedOut: number;
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: StudentGender;
  batchId: string;
  courseId: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  admissionDate: string;
  profileImage?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  aadharNumber?: string;
}

export interface UpdateStudentInput extends Partial<CreateStudentInput> {
  id: string;
  status?: StudentStatus;
}

export type StudentResponse = Student;
export type StudentListResponse = PaginatedResponse<StudentListItem>;
export type StudentStatsResponse = StudentStats;

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
  SUSPENDED: 'Suspended',
  GRADUATED: 'Graduated',
  DROPPED_OUT: 'Dropped Out',
};

export const STUDENT_STATUS_COLORS: Record<StudentStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  INACTIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  GRADUATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DROPPED_OUT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export const STUDENT_GENDER_LABELS: Record<StudentGender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

export const STUDENT_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'GRADUATED', label: 'Graduated' },
  { value: 'DROPPED_OUT', label: 'Dropped Out' },
] as const;

export const STUDENT_GENDER_OPTIONS = [
  { value: 'ALL', label: 'All Genders' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
] as const;

export type TimelineEventType =
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'BATCH_CHANGED'
  | 'COURSE_CHANGED'
  | 'PROFILE_UPDATED'
  | 'ARCHIVED'
  | 'NOTE_ADDED';

export interface TimelineEvent {
  id: string;
  studentId: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  createdAt: string;
  createdBy?: string;
}
