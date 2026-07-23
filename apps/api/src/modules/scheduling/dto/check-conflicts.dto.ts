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

/**
 * Used by POST /scheduling/schedules/check-conflicts
 * Identical shape to CreateScheduleDto — runs conflict check without saving.
 */
export class CheckConflictsDto {
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

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string;

  @IsDateString()
  effectiveFrom: string;

  @IsDateString()
  effectiveUntil: string;

  @IsEnum(AttendanceModeType)
  deliveryMode: AttendanceModeType;

  @IsString()
  @IsOptional()
  roomId?: string;

  @IsEnum(MeetingProviderEnum)
  @IsOptional()
  meetingProvider?: MeetingProviderEnum;

  @IsString()
  @IsOptional()
  meetingLink?: string;

  /** Used on update — exclude this scheduleId from conflict checks (don't conflict with self) */
  @IsString()
  @IsOptional()
  excludeScheduleId?: string;

  @IsBoolean()
  @IsOptional()
  bypassStudentConflict?: boolean;
}
