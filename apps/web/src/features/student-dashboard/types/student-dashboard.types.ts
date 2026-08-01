// ─── Shared DTOs ─────────────────────────────────────────────────────────────

export interface SubjectDto {
  id: string;
  name: string;
  code: string;
}

export interface BatchDto {
  id: string;
  name: string;
  code: string;
  deliveryTypeId?: string;
}

export interface BranchDto {
  id: string;
  name: string;
}

export interface DeliveryTypeDto {
  id: string;
  name: string;
  code: string;
}

export interface CourseDto {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface AcademicYearDto {
  id: string;
  name: string;
  code: string;
}

// ─── Session DTO (used in overview + timetable) ───────────────────────────────

export type LiveStatus = 'UPCOMING' | 'LIVE_NOW' | 'COMPLETED';
export type DeliveryMode = 'CLASSROOM' | 'ONLINE' | 'HYBRID';

export interface StudentSessionDto {
  id: string;
  date: string; // YYYY-MM-DD
  startsAt: string; // HH:mm
  endsAt: string; // HH:mm
  dayOfWeek: string;
  subject: SubjectDto | null;
  batch: BatchDto | null;
  tutorName?: string | null;
  sessionStatus: string;
  sessionSource?: string | null;
  deliveryMode: DeliveryMode | null;
  liveStatus: LiveStatus;
  canJoin: boolean;
}

// ─── Overview ────────────────────────────────────────────────────────────────

export interface StudentOverviewStats {
  todaysClasses: number;
  upcomingClasses: number;
  activeBatches: number;
  attendanceRate: number | null; // real % or null if no history
}

export interface StudentOverviewResponseDto {
  enrolledCourses?: string[];
  enrolledBatches?: string[];
  stats: StudentOverviewStats;
  todaysSchedule: StudentSessionDto[];
  liveNow: StudentSessionDto[];
}

// ─── Timetable ───────────────────────────────────────────────────────────────

export interface TimetableDayDto {
  date: string;
  dayOfWeek: string;
  sessions: StudentSessionDto[];
}

export interface StudentTimetableResponseDto {
  fromDate: string;
  toDate: string;
  timetable: TimetableDayDto[];
}

// ─── Join Session ────────────────────────────────────────────────────────────

export interface JoinSessionResponseDto {
  sessionId: string;
  joinUrl: string;
  provider: string;
  expiresAt: string;
}

// ─── Batches ─────────────────────────────────────────────────────────────────

export interface EnrolledBatchDto {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  maxStudents?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  isActive: boolean;
  branch: BranchDto | null;
  academicYear: AcademicYearDto | null;
  course: CourseDto | null;
  deliveryType: DeliveryTypeDto | null;
  totalEnrolled: number;
}

export interface StudentEnrollmentDto {
  enrollmentId: string;
  isPrimary: boolean;
  batch: EnrolledBatchDto;
}

export interface StudentBatchesResponseDto {
  batches: StudentEnrollmentDto[];
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface AttendanceSummaryDto {
  total: number;
  present: number;
  absent: number;
  late: number;
  rate: number | null;
}

export interface SubjectAttendanceDto {
  subjectId: string;
  subjectName: string;
  total: number;
  present: number;
  absent: number;
  rate: number | null;
}

export interface AttendanceRecordDto {
  id: string;
  date: string | null;
  startsAt: string | null;
  subject: SubjectDto | null;
  batch: { id: string; name: string; code: string } | null;
  status: string;
  lateMinutes: number;
  remarks?: string;
  markedAt: string;
}

export interface StudentAttendanceResponseDto {
  summary: AttendanceSummaryDto;
  subjectBreakdown: SubjectAttendanceDto[];
  records: AttendanceRecordDto[];
}

// ─── Courses / Syllabus Tree ──────────────────────────────────────────────────

export interface TopicItemCountDto {
  id: string;
  code: string;
  name: string;
  shortName?: string | null;
  description?: string | null;
  difficultyLevel?: string | null;
  plannedHours?: number | null;
  displayOrder: number;
  publishedItemCount: number;
}

export interface ChapterDto {
  id: string;
  code: string;
  name: string;
  shortName?: string | null;
  description?: string | null;
  plannedHours?: number | null;
  displayOrder: number;
  topics: TopicItemCountDto[];
}

export interface CourseSubjectDto {
  id: string;
  displayOrder: number;
  isMandatory: boolean;
  subject: {
    id: string;
    code: string;
    name: string;
    shortName?: string | null;
    displayName?: string | null;
    subjectType?: string | null;
  };
  chapters: ChapterDto[];
}

export interface StudentCourseDto {
  id: string;
  code: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  courseType?: string | null;
  durationMonths?: number | null;
  isActive: boolean;
  batches: { id: string; name: string; status: string }[];
  subjects: CourseSubjectDto[];
}

export interface StudentCoursesResponseDto {
  courses: StudentCourseDto[];
}
