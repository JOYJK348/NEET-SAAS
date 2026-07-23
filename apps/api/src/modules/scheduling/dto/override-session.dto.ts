import {
  IsString,
  IsOptional,
  IsDateString,
  Matches,
  IsEnum,
} from 'class-validator';

export type OverrideScope = 'ONLY_THIS' | 'THIS_AND_FUTURE' | 'ENTIRE_SERIES';

export class OverrideSessionDto {
  @IsEnum(['ONLY_THIS', 'THIS_AND_FUTURE', 'ENTIRE_SERIES'])
  scope: OverrideScope;

  /** New tutor — triggers TUTOR_CHANGED override */
  @IsString()
  @IsOptional()
  staffProfileId?: string;

  /** New date for reschedule — triggers TIME_CHANGED */
  @IsDateString()
  @IsOptional()
  newDate?: string; // ISO date "2026-08-05"

  /** New start time for reschedule e.g. "14:00" */
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format',
  })
  newStartTime?: string;

  /** New end time for reschedule e.g. "16:00" */
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:mm format',
  })
  newEndTime?: string;

  /** New room ID */
  @IsString()
  @IsOptional()
  roomId?: string;

  /** If true, cancel this session */
  @IsOptional()
  cancel?: boolean;

  /** Human-readable reason for the change — stored in audit log */
  @IsString()
  @IsOptional()
  reason?: string;
}
