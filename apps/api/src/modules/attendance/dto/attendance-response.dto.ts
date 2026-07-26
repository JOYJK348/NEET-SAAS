import { ApiProperty } from '@nestjs/swagger';

export class AttendanceOverviewDto {
  @ApiProperty() overallRate: number;
  @ApiProperty() totalSessions: number;
  @ApiProperty() markedSessions: number;
  @ApiProperty() pendingSessions: number;
  @ApiProperty() lowAttendanceStudents: number;
}

export class BatchAttendanceSummaryDto {
  @ApiProperty() batchId: string;
  @ApiProperty() batchName: string;
  @ApiProperty() batchCode: string;
  @ApiProperty() overallRate: number;
  @ApiProperty() totalStudents: number;
  @ApiProperty() sessionsConducted: number;
  @ApiProperty() sessionsMarked: number;
  @ApiProperty() studentsBelow75: number;
}

export class StudentAttendanceSummaryDto {
  @ApiProperty() studentAdmissionId: string;
  @ApiProperty() studentName: string;
  @ApiProperty() studentCode: string;
  @ApiProperty() present: number;
  @ApiProperty() absent: number;
  @ApiProperty() late: number;
  @ApiProperty() total: number;
  @ApiProperty() rate: number | null;
}

export class AttendanceRecordDto {
  @ApiProperty() id: string;
  @ApiProperty() date: string | null;
  @ApiProperty() subject: { id: string; name: string; code: string } | null;
  @ApiProperty() attendanceStatus: string;
  @ApiProperty() lateMinutes: number;
  @ApiProperty() remarks: string;
  @ApiProperty() markedAt: Date;
}

export class BatchAttendanceDetailDto {
  @ApiProperty() batchId: string;
  @ApiProperty() batchName: string;
  @ApiProperty() batchCode: string;
  @ApiProperty() overallRate: number;
  @ApiProperty() totalStudents: number;
  @ApiProperty() sessionsConducted: number;
  @ApiProperty() sessionsMarked: number;
  @ApiProperty() students: StudentAttendanceSummaryDto[];
}

export class OverviewResponseDto {
  @ApiProperty() overview: AttendanceOverviewDto;
  @ApiProperty({ type: [BatchAttendanceSummaryDto] })
  batches: BatchAttendanceSummaryDto[];
}
