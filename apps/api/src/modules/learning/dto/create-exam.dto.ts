import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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

  @ApiProperty({ description: 'Target Batch ID' })
  @IsString()
  batchId: string;

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

  @ApiProperty({ description: 'Scheduled start timestamp' })
  @IsDateString()
  scheduledStartAt: string;

  @ApiProperty({ description: 'Scheduled end timestamp' })
  @IsDateString()
  scheduledEndAt: string;

  @ApiPropertyOptional({ description: 'Exam instructions for students' })
  @IsOptional()
  @IsString()
  instructions?: string;
}
