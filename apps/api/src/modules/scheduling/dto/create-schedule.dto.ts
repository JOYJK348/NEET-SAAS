import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  Matches,
  IsBoolean,
} from 'class-validator';
import {
  WeekdayType,
  AttendanceModeType,
  MeetingProviderEnum,
} from '@prisma/client';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  @IsString()
  @IsNotEmpty()
  batchId: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  staffProfileId: string;

  @IsEnum(WeekdayType)
  dayOfWeek: WeekdayType;

  /** "HH:mm" format e.g. "08:00" */
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format (e.g. "08:00")',
  })
  startTime: string;

  /** "HH:mm" format e.g. "10:00" */
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:mm format (e.g. "10:00")',
  })
  endTime: string;

  @IsDateString()
  effectiveFrom: string;

  @IsDateString()
  effectiveUntil: string;

  @IsEnum(AttendanceModeType)
  deliveryMode: AttendanceModeType;

  /** Required for CLASSROOM, optional for HYBRID, null for ONLINE */
  @IsString()
  @IsOptional()
  roomId?: string;

  @IsEnum(MeetingProviderEnum)
  @IsOptional()
  meetingProvider?: MeetingProviderEnum;

  @IsString()
  @IsOptional()
  meetingLink?: string;

  @IsString()
  @IsOptional()
  meetingCode?: string;

  @IsString()
  @IsOptional()
  meetingPassword?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  bypassStudentConflict?: boolean;
}
