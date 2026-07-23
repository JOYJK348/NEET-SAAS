import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import {
  WeekdayType,
  AttendanceModeType,
  ScheduleStatusEnum,
} from '@prisma/client';

export class QueryScheduleDto {
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

  @IsEnum(AttendanceModeType)
  @IsOptional()
  deliveryMode?: AttendanceModeType;

  @IsEnum(ScheduleStatusEnum)
  @IsOptional()
  status?: ScheduleStatusEnum;

  /** Filter schedules active on this date (within effectiveFrom–effectiveUntil) */
  @IsDateString()
  @IsOptional()
  onDate?: string;
}
