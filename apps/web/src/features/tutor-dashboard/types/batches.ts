// ─── Strictly mirrors backend Tutor batch DTOs ─────────────────────────────
// Source of truth: apps/api/src/modules/tutor-dashboard/dto/tutor-dashboard-response.dto.ts

interface SubjectDto {
  id: string;
  name: string;
  code: string;
}

interface BranchDto {
  id: string;
  name: string;
}

interface AcademicYearRefDto {
  id: string;
  name: string;
}

interface CourseRefDto {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface DeliveryTypeDto {
  id: string;
  name: string;
  code: string;
}

export interface BatchDetailDto {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  maxStudents?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  isActive: boolean;
  studentCount: number;
  branch?: BranchDto | null;
  academicYear?: AcademicYearRefDto | null;
  course?: CourseRefDto | null;
  deliveryType?: DeliveryTypeDto | null;
}

export interface BatchAssignmentDto {
  assignmentId: string;
  batch?: BatchDetailDto | null;
  subject?: SubjectDto | null;
}

export interface TutorBatchListResponseDto {
  batches: BatchAssignmentDto[];
}

// ─── Batch Students ─────────────────────────────────────────────────────────

interface StudentDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AdmissionInfoDto {
  id: string;
  admissionNumber: string;
  admissionStatus?: string | null;
}

export interface BatchStudentDto {
  enrollmentId: string;
  joinedAt: string;
  isPrimary: boolean;
  student?: StudentDto | null;
  admission?: AdmissionInfoDto | null;
}

export interface TutorBatchStudentsResponseDto {
  batch: BatchDetailDto;
  students: BatchStudentDto[];
}

