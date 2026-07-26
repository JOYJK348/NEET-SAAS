export interface AttendanceOverviewDto {
  overallRate: number;
  totalSessions: number;
  markedSessions: number;
  pendingSessions: number;
  lowAttendanceStudents: number;
}

export interface BatchAttendanceSummaryDto {
  batchId: string;
  batchName: string;
  batchCode: string;
  overallRate: number;
  totalStudents: number;
  sessionsConducted: number;
  sessionsMarked: number;
  studentsBelow75: number;
}

export interface StudentAttendanceSummaryDto {
  studentAdmissionId: string;
  studentName: string;
  studentCode: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number | null;
}

export interface AttendanceRecordDto {
  id: string;
  date: string | null;
  subject: { id: string; name: string; code: string } | null;
  attendanceStatus: string;
  lateMinutes: number;
  remarks: string;
  markedAt: string;
}

export interface BatchAttendanceDetailDto {
  batchId: string;
  batchName: string;
  batchCode: string;
  overallRate: number;
  totalStudents: number;
  sessionsConducted: number;
  sessionsMarked: number;
  students: StudentAttendanceSummaryDto[];
}

export interface OverviewResponseDto {
  overview: AttendanceOverviewDto;
  batches: BatchAttendanceSummaryDto[];
}

export interface StudentAttendanceDetailDto {
  studentAdmissionId: string;
  studentName: string;
  studentCode: string;
  summary: { total: number; present: number; absent: number; late: number; rate: number | null };
  records: AttendanceRecordDto[];
}
