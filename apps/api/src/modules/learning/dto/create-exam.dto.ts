import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ExamModeEnum, ExamTypeEnum } from '@prisma/client';

export class CreateExamDto {
  @ApiProperty({ description: 'Target Course ID' })
  @IsString()
  courseId: string;

  @ApiPropertyOptional({ description: 'Target Batch ID' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ description: 'Target Batch IDs for multi-batch exam assignment' })
  @IsOptional()
  @IsArray()
  batchIds?: string[];

  @ApiProperty({ description: 'Target Subject ID' })
  @IsString()
  subjectId: string;

  @ApiProperty({ description: 'Target Academic Year ID' })
  @IsString()
  academicYearId: string;

  @ApiProperty({ description: 'Exam Title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Detailed Exam Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ExamTypeEnum, description: 'Type of exam' })
  @IsEnum(ExamTypeEnum)
  examType: ExamTypeEnum;

  @ApiProperty({ enum: ExamModeEnum, description: 'Exam delivery mode' })
  @IsEnum(ExamModeEnum)
  mode: ExamModeEnum;

  @ApiProperty({ description: 'Total maximum marks' })
  @IsNumber()
  @Min(0)
  totalMarks: number;

  @ApiProperty({ description: 'Minimum passing marks' })
  @IsNumber()
  @Min(0)
  passingMarks: number;

  @ApiPropertyOptional({ description: 'Whether negative marking is active' })
  @IsOptional()
  @IsBoolean()
  negativeMarkingEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Negative marks per wrong answer' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  negativeMarkingValue?: number;

  @ApiProperty({ description: 'Duration in minutes' })
  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @ApiPropertyOptional({ description: 'Grace period in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  graceMinutes?: number;

  @ApiProperty({ description: 'Scheduled start timestamp' })
  @IsDateString()
  scheduledStartAt: string;

  @ApiProperty({ description: 'Scheduled end timestamp' })
  @IsDateString()
  scheduledEndAt: string;

  @ApiPropertyOptional({ description: 'Exam window start timestamp' })
  @IsOptional()
  @IsDateString()
  examWindowStart?: string;

  @ApiPropertyOptional({ description: 'Exam window end timestamp' })
  @IsOptional()
  @IsDateString()
  examWindowEnd?: string;

  @ApiPropertyOptional({
    description: 'Require full duration window remaining',
  })
  @IsOptional()
  @IsBoolean()
  requireFullDurationWindow?: boolean;

  @ApiPropertyOptional({
    description: 'Allow student upload during grace period',
  })
  @IsOptional()
  @IsBoolean()
  allowLateUpload?: boolean;

  @ApiPropertyOptional({
    description: 'Allow student to replace uploaded answer sheet',
  })
  @IsOptional()
  @IsBoolean()
  allowReplaceUpload?: boolean;

  @ApiPropertyOptional({ description: 'Section configuration list' })
  @IsOptional()
  @IsArray()
  sectionConfig?: Record<string, unknown>[];

  @ApiPropertyOptional({ description: 'Exam instructions for students' })
  @IsOptional()
  @IsString()
  instructions?: string;
}
