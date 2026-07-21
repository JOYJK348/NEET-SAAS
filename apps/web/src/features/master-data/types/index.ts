export type BranchType = 'HEAD_OFFICE' | 'CAMPUS' | 'FRANCHISE' | 'ONLINE';

export interface Branch {
  id: string;
  code: string;
  slug: string;
  name: string;
  displayName: string;
  email: string;
  phone: string;
  branchType: BranchType;
  status: string;
  timezone: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchInput {
  code: string;
  slug: string;
  name: string;
  displayName: string;
  email: string;
  phone: string;
  branchType: BranchType;
  status?: string;
  timezone?: string;
  academicYearId?: string;
}

export interface UpdateBranchInput extends Partial<CreateBranchInput> {
  id?: string;
}

export interface AcademicYear {
  id: string;
  code: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  displayOrder: number;
  isCurrent: boolean;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAcademicYearInput {
  code: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  displayOrder?: number;
  isCurrent?: boolean;
  isActive?: boolean;
}

export interface UpdateAcademicYearInput extends Partial<CreateAcademicYearInput> {
  id?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  courseType: string;
  durationMonths: number;
  startDate?: string;
  endDate?: string;
  displayOrder: number;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  code: string;
  name: string;
  displayName: string;
  description?: string;
  courseType?: string;
  durationMonths?: number;
  startDate?: string;
  endDate?: string;
  displayOrder?: number;
  isActive?: boolean;
  branchIds?: string[];
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {
  id?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  displayName: string;
  description?: string;
  subjectType: string;
  displayOrder: number;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectInput {
  code: string;
  name: string;
  shortName?: string;
  displayName: string;
  description?: string;
  subjectType?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateSubjectInput extends Partial<CreateSubjectInput> {
  id?: string;
}

export interface CourseSubject {
  id: string;
  courseId: string;
  subjectId: string;
  displayOrder: number;
  isMandatory: boolean;
  totalMarks: number;
  passingMarks: number;
  credits: number;
  plannedHours: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  subject?: Subject;
}

export interface CreateCourseSubjectInput {
  courseId: string;
  subjectId: string;
  displayOrder?: number;
  isMandatory?: boolean;
  totalMarks?: number;
  passingMarks?: number;
  credits?: number;
  plannedHours?: number;
}

export interface Chapter {
  id: string;
  courseSubjectId: string;
  code: string;
  name: string;
  shortName?: string;
  description?: string;
  plannedHours: number;
  estimatedSessions: number;
  displayOrder: number;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChapterInput {
  courseSubjectId: string;
  code: string;
  name: string;
  shortName?: string;
  description?: string;
  plannedHours?: number;
  estimatedSessions?: number;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateChapterInput extends Partial<CreateChapterInput> {
  id?: string;
}

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface Topic {
  id: string;
  chapterId: string;
  code: string;
  name: string;
  shortName?: string;
  description?: string;
  learningObjectives?: string;
  difficultyLevel: DifficultyLevel;
  plannedHours: number;
  plannedSessions: number;
  displayOrder: number;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicInput {
  chapterId: string;
  code: string;
  name: string;
  shortName?: string;
  description?: string;
  learningObjectives?: string;
  difficultyLevel?: DifficultyLevel;
  plannedHours?: number;
  plannedSessions?: number;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateTopicInput extends Partial<CreateTopicInput> {
  id?: string;
}

export type AttendanceMode = 'CLASSROOM' | 'ONLINE' | 'HYBRID';

export interface BatchDeliveryType {
  id: string;
  code: string;
  name: string;
  description?: string;
  attendanceMode: AttendanceMode;
  defaultMaxStudents: number;
  defaultStartTime: string;
  defaultEndTime: string;
  colorCode?: string;
  iconName?: string;
  displayOrder: number;
  isDefault: boolean;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchDeliveryTypeInput {
  code: string;
  name: string;
  description?: string;
  attendanceMode: AttendanceMode;
  defaultMaxStudents?: number;
  defaultStartTime: string;
  defaultEndTime: string;
  colorCode?: string;
  iconName?: string;
  displayOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateBatchDeliveryTypeInput extends Partial<CreateBatchDeliveryTypeInput> {
  id?: string;
}
