import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── NESTED OBJECT DTOs ─────────────────────────────────────────────────────

class SubjectDto {
  @ApiProperty({ example: 'subject-uuid' })
  id!: string;

  @ApiProperty({ example: 'Physics' })
  name!: string;

  @ApiProperty({ example: 'PHY' })
  code!: string;
}

class BatchDto {
  @ApiProperty({ example: 'batch-uuid' })
  id!: string;

  @ApiProperty({ example: 'NEET 2027 Batch A' })
  name!: string;

  @ApiProperty({ example: 'NEET27-A' })
  code!: string;
}

class BranchDto {
  @ApiProperty({ example: 'branch-uuid' })
  id!: string;

  @ApiProperty({ example: 'Chennai Main' })
  name!: string;
}

class RoomDto {
  @ApiProperty({ example: 'room-uuid' })
  id!: string;

  @ApiProperty({ example: 'Room 101' })
  name!: string;

  @ApiProperty({ example: 'R101' })
  code!: string;
}

class RoomDetailDto extends RoomDto {
  @ApiPropertyOptional({ example: 50 })
  capacity?: number;
}

class ScheduleDto {
  @ApiProperty({ example: 'schedule-uuid' })
  id!: string;

  @ApiProperty({ example: 'MONDAY' })
  dayOfWeek!: string;

  @ApiProperty({ example: '08:00' })
  startTime!: string;

  @ApiProperty({ example: '10:00' })
  endTime!: string;

  @ApiPropertyOptional({ type: RoomDto })
  room?: RoomDto | null;
}

// ─── TUITION DETAIL DTOs ────────────────────────────────────────────────────

class BatchDetailDto extends BatchDto {
  @ApiPropertyOptional({ example: 'Intensive NEET preparation batch' })
  description?: string | null;

  @ApiPropertyOptional({ example: 60 })
  maxStudents?: number | null;

  @ApiPropertyOptional()
  startDate?: Date | null;

  @ApiPropertyOptional()
  endDate?: Date | null;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ type: BranchDto })
  branch?: BranchDto | null;

  @ApiPropertyOptional()
  academicYear?: { id: string; name: string } | null;

  @ApiPropertyOptional()
  course?: { id: string; name: string; code: string } | null;

  @ApiPropertyOptional()
  deliveryType?: { id: string; name: string; code: string } | null;

  @ApiProperty({ example: 45 })
  studentCount!: number;
}

class BatchAssignmentDto {
  @ApiProperty({ example: 'assignment-uuid' })
  assignmentId!: string;

  @ApiPropertyOptional({ type: BatchDetailDto })
  batch?: BatchDetailDto | null;

  @ApiPropertyOptional({ type: SubjectDto })
  subject?: SubjectDto | null;
}

class TutorialSessionDto {
  @ApiProperty({ example: 'session-uuid' })
  id!: string;

  @ApiProperty()
  date!: Date;

  @ApiProperty({ example: '08:00' })
  startsAt!: string;

  @ApiProperty({ example: '10:00' })
  endsAt!: string;

  @ApiPropertyOptional({ type: SubjectDto })
  subject?: SubjectDto | null;

  @ApiPropertyOptional({ type: BatchDto })
  batch?: BatchDto | null;

  @ApiPropertyOptional({ type: BranchDto })
  branch?: BranchDto | null;

  @ApiProperty({ example: 'SCHEDULED' })
  sessionStatus!: string;

  @ApiPropertyOptional()
  sessionSource?: string | null;

  @ApiPropertyOptional()
  overrideType?: string | null;

  @ApiPropertyOptional()
  cancelledReason?: string | null;

  @ApiProperty({ example: 'Monday' })
  dayOfWeek!: string | null;
}

class TimetableSessionDto {
  @ApiProperty({ example: 'session-uuid' })
  id!: string;

  @ApiProperty({ example: '08:00' })
  startsAt!: string;

  @ApiProperty({ example: '10:00' })
  endsAt!: string;

  @ApiPropertyOptional({ type: SubjectDto })
  subject?: SubjectDto | null;

  @ApiPropertyOptional({ type: BatchDto })
  batch?: BatchDto | null;

  @ApiPropertyOptional({ type: BranchDto })
  branch?: BranchDto | null;

  @ApiPropertyOptional({ type: RoomDto })
  room?: RoomDto | null;

  @ApiProperty({ example: 'SCHEDULED' })
  sessionStatus!: string;

  @ApiPropertyOptional()
  sessionSource?: string | null;

  @ApiPropertyOptional()
  overrideType?: string | null;

  @ApiPropertyOptional()
  cancelledReason?: string | null;

  @ApiPropertyOptional({ type: ScheduleDto })
  schedule?: ScheduleDto | null;
}

class TimetableDayDto {
  @ApiProperty({ example: '2026-07-20' })
  date!: string;

  @ApiProperty({ example: 'Monday' })
  dayOfWeek!: string;

  @ApiProperty({ type: [TimetableSessionDto] })
  sessions!: TimetableSessionDto[];
}

// ─── STUDENT ATTENDANCE DTOs ────────────────────────────────────────────────

class StudentDto {
  @ApiProperty({ example: 'user-uuid' })
  id!: string;

  @ApiProperty({ example: 'Rajesh' })
  firstName!: string;

  @ApiProperty({ example: 'Kumar' })
  lastName!: string;

  @ApiProperty({ example: 'rajesh@example.com' })
  email!: string;
}

class AdmissionInfoDto {
  @ApiProperty({ example: 'admission-uuid' })
  id!: string;

  @ApiProperty({ example: 'ADM-2026-0001' })
  admissionNumber!: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  admissionStatus?: string | null;
}

class BatchStudentDto {
  @ApiProperty({ example: 'enrollment-uuid' })
  enrollmentId!: string;

  @ApiProperty()
  joinedAt!: Date;

  @ApiProperty({ example: true })
  isPrimary!: boolean;

  @ApiPropertyOptional({ type: StudentDto })
  student?: StudentDto | null;

  @ApiPropertyOptional({ type: AdmissionInfoDto })
  admission?: AdmissionInfoDto | null;
}

class AttendanceRecordDto {
  @ApiProperty({ example: 'record-uuid' })
  id!: string;

  @ApiProperty({ example: 'PRESENT' })
  attendanceStatus!: string;

  @ApiPropertyOptional({ example: 15 })
  lateMinutes?: number | null;

  @ApiPropertyOptional({ example: 'Came late due to traffic' })
  remarks?: string | null;

  @ApiProperty()
  markedAt!: Date;

  @ApiPropertyOptional({ type: StudentDto })
  student?: StudentDto | null;

  @ApiPropertyOptional({ type: AdmissionInfoDto })
  admission?: AdmissionInfoDto | null;
}

class EnrolledStudentDto {
  @ApiProperty({ example: 'admission-uuid' })
  admissionId!: string;

  @ApiProperty({ example: 'ADM-2026-0001' })
  admissionNumber!: string;

  @ApiProperty({ example: 'user-uuid' })
  studentId!: string;

  @ApiProperty({ example: 'Rajesh' })
  firstName!: string;

  @ApiProperty({ example: 'Kumar' })
  lastName!: string;

  @ApiProperty({ example: 'rajesh@example.com' })
  email!: string;
}

class AttendanceStatsDto {
  @ApiProperty({ example: 45 })
  totalStudents!: number;

  @ApiProperty({ example: 40 })
  markedCount!: number;

  @ApiProperty({ example: 35 })
  presentCount!: number;

  @ApiProperty({ example: 3 })
  absentCount!: number;

  @ApiProperty({ example: 2 })
  lateCount!: number;

  @ApiProperty({ example: 5 })
  unmarkedCount!: number;

  @ApiProperty({ type: [AttendanceRecordDto] })
  records!: AttendanceRecordDto[];

  @ApiProperty({ type: [EnrolledStudentDto] })
  enrolledStudents!: EnrolledStudentDto[];
}

class SessionDetailDto {
  @ApiProperty({ example: 'session-uuid' })
  id!: string;

  @ApiProperty()
  attendanceDate!: Date;

  @ApiProperty({ example: '08:00' })
  startsAt!: string;

  @ApiProperty({ example: '10:00' })
  endsAt!: string;

  @ApiProperty({ example: 'SCHEDULED' })
  sessionStatus!: string;

  @ApiPropertyOptional()
  sessionSource?: string | null;

  @ApiPropertyOptional()
  overrideType?: string | null;

  @ApiPropertyOptional()
  cancelledReason?: string | null;

  @ApiPropertyOptional()
  remarks?: string | null;

  @ApiPropertyOptional({ type: SubjectDto })
  subject?: SubjectDto | null;

  @ApiPropertyOptional({ type: BatchDto })
  batch?: BatchDto | null;

  @ApiPropertyOptional({ type: BranchDto })
  branch?: BranchDto | null;

  @ApiPropertyOptional({ type: RoomDetailDto })
  room?: RoomDetailDto | null;

  @ApiPropertyOptional({ type: ScheduleDto })
  schedule?: ScheduleDto | null;
}

// ─── TOP-LEVEL RESPONSE DTOs ────────────────────────────────────────────────

export class TutorOverviewStatsDto {
  @ApiProperty({ example: 3 })
  todaysClasses!: number;

  @ApiProperty({ example: 12 })
  upcomingClasses!: number;

  @ApiProperty({ example: 5 })
  myBatches!: number;

  @ApiProperty({ example: 180 })
  totalStudents!: number;
}

export class TutorOverviewResponseDto {
  @ApiProperty({ type: TutorOverviewStatsDto })
  stats!: TutorOverviewStatsDto;

  @ApiProperty({ type: [TutorialSessionDto] })
  todaysSchedule!: TutorialSessionDto[];

  @ApiProperty({ type: [TutorialSessionDto] })
  upcomingSchedule!: TutorialSessionDto[];
}

export class TutorTimetableResponseDto {
  @ApiProperty()
  fromDate!: string;

  @ApiProperty()
  toDate!: string;

  @ApiProperty({ type: [TimetableDayDto] })
  timetable!: TimetableDayDto[];
}

export class TutorBatchListResponseDto {
  @ApiProperty({ type: [BatchAssignmentDto] })
  batches!: BatchAssignmentDto[];
}

export class TutorBatchStudentsResponseDto {
  @ApiProperty({ type: BatchDetailDto })
  batch!: BatchDetailDto;

  @ApiProperty({ type: [BatchStudentDto] })
  students!: BatchStudentDto[];
}

export class SessionDetailsResponseDto {
  @ApiProperty({ type: SessionDetailDto })
  session!: SessionDetailDto;

  @ApiProperty({ type: AttendanceStatsDto })
  attendance!: AttendanceStatsDto;
}

// ─── BULK ATTENDANCE REQUEST DTO ────────────────────────────────────────────

export class BulkAttendanceItemDto {
  @ApiProperty({ example: 'admission-uuid' })
  @IsString()
  @IsNotEmpty()
  studentAdmissionId!: string;

  @ApiProperty({ enum: ['PRESENT', 'ABSENT', 'LATE'] })
  @IsEnum(['PRESENT', 'ABSENT', 'LATE'] as const)
  attendanceStatus!: 'PRESENT' | 'ABSENT' | 'LATE';

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lateMinutes?: number;

  @ApiPropertyOptional({ example: 'Medical appointment' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkAttendanceRequestDto {
  @ApiProperty({ type: [BulkAttendanceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceItemDto)
  records!: BulkAttendanceItemDto[];
}

export class BulkAttendanceResponseDto {
  @ApiProperty({ example: 45 })
  totalProcessed!: number;

  @ApiProperty({ example: 45 })
  successCount!: number;

  @ApiProperty({ example: 0 })
  errorCount!: number;

  @ApiPropertyOptional({ type: [String] })
  errors?: string[];
}
