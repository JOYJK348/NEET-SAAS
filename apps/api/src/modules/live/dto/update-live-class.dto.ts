import { IsString, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLiveClassDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'New scheduled start (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  scheduledStart?: string;

  @ApiPropertyOptional({ description: 'New scheduled end (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  scheduledEnd?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  recordingEnabled?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  whiteboardEnabled?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  chatEnabled?: boolean;
}
