export interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  employeeCode: string | null;
  designation: string | null;
  qualification: string | null;
  specialization: string | null;
  yearsOfExperience: number;
  previousInstitution: string | null;
  bio: string | null;
  createdLogin: boolean;
  subjects: { id: string; subjectId: string }[];
  branches: { id: string; branchId: string; departmentId: string | null }[];
  batchCount: number;
  batchAssignments: {
    id: string;
    batchId: string;
    subjectId: string;
    isActive: boolean;
    effectiveFrom: string;
    effectiveTo: string;
  }[];
  createdAt: string;
}

export interface CreateTutorInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employeeCode?: string;
  designation?: string;
  qualification?: string;
  specialization?: string;
  yearsOfExperience?: number;
  previousInstitution?: string;
  bio?: string;
  createLogin?: boolean;
  subjectIds?: string[];
  branchIds?: string[];
  academicYearId?: string;
  branchId?: string;
  courseId?: string;
  batchId?: string;
}

export interface UpdateTutorInput extends Partial<CreateTutorInput> {
  status?: string;
}

export interface TutorFilters {
  search?: string;
  subjectId?: string;
  branchId?: string;
  tutorStatus?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
