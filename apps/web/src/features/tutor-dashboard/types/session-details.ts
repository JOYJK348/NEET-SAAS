// ─── Strictly mirrors backend SessionDetailsResponseDto ────────────────────
// Source of truth: apps/api/src/modules/tutor-dashboard/dto/tutor-dashboard-response.dto.ts

interface SubjectDto {
  id: string;
  name: string;
  code: string;
}

interface BatchDto {
  id: string;
  name: string;
  code: string;
}

interface BranchDto {
  id: string;
  name: string;
}

interface RoomDetailDto {
  id: string;
  name: string;
  code: string;
  capacity?: number;
}

interface ScheduleDto {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: { id: string; name: string; code: string } | null;
}

export interface SessionDetailDto {
  id: string;
  attendanceDate: string; // ISO date
  startsAt: string; // HH:mm
  endsAt: string; // HH:mm
  sessionStatus: string; // SCHEDULED, COMPLETED, CANCELLED, DRAFT
  sessionSource?: string | null;
  overrideType?: string | null;
  cancelledReason?: string | null;
  remarks?: string | null;
  subject?: SubjectDto | null;
  batch?: BatchDto | null;
  branch?: BranchDto | null;
  room?: RoomDetailDto | null;
  schedule?: ScheduleDto | null;
}

interface StudentDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AdmissionRefDto {
  id: string;
  admissionNumber: string;
}

export interface AttendanceRecordDto {
  id: string;
  attendanceStatus: string; // PRESENT, ABSENT, LATE
  lateMinutes?: number | null;
  remarks?: string | null;
  markedAt: string; // ISO datetime
  student?: StudentDto | null;
  admission?: AdmissionRefDto | null;
}

export interface EnrolledStudentDto {
  admissionId: string;
  admissionNumber: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AttendanceStatsDto {
  totalStudents: number;
  markedCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  unmarkedCount: number;
  records: AttendanceRecordDto[];
  enrolledStudents: EnrolledStudentDto[];
}

export interface SessionDetailsResponseDto {
  session: SessionDetailDto;
  attendance: AttendanceStatsDto;
}
