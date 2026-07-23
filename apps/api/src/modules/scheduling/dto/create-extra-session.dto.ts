import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import {
  AttendanceModeType,
  MeetingProviderEnum,
  SessionSourceEnum,
} from '@prisma/client';

export class CreateExtraSessionDto {
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  staffProfileId: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  /** ISO date "2026-08-10" */
  @IsDateString()
  attendanceDate: string;

  /** ISO datetime for startsAt */
  @IsDateString()
  startsAt: string;

  /** ISO datetime for endsAt */
  @IsDateString()
  endsAt: string;

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

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsEnum(SessionSourceEnum)
  @IsOptional()
  sessionSource?: SessionSourceEnum; // Defaults to MANUAL in service
}
