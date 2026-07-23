import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  Matches,
  IsBoolean,
} from 'class-validator';
import {
  WeekdayType,
  AttendanceModeType,
  MeetingProviderEnum,
  ScheduleStatusEnum,
} from '@prisma/client';

export class UpdateScheduleDto {
  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  academicYearId?: string;

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsString()
  @IsOptional()
  subjectId?: string;

  @IsString()
  @IsOptional()
  staffProfileId?: string;

  @IsEnum(WeekdayType)
  @IsOptional()
  dayOfWeek?: WeekdayType;

  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format (e.g. "08:00")',
  })
  startTime?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:mm format (e.g. "10:00")',
  })
  endTime?: string;

  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @IsEnum(AttendanceModeType)
  @IsOptional()
  deliveryMode?: AttendanceModeType;

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

  @IsEnum(ScheduleStatusEnum)
  @IsOptional()
  status?: ScheduleStatusEnum;

  @IsBoolean()
  @IsOptional()
  bypassStudentConflict?: boolean;
}
