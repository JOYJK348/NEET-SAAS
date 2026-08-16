import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListRecordingsQueryDto {
  @ApiPropertyOptional({
    description: 'Status filter: processing | ready | failed (or raw enum value)',
    enum: ['processing', 'ready', 'failed'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['processing', 'ready', 'failed'], {
    message: 'status must be processing, ready or failed',
  })
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by course' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter by subject' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Filter by chapter' })
  @IsOptional()
  @IsString()
  chapterId?: string;

  @ApiPropertyOptional({ description: 'Filter by topic' })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({ description: 'Filter by batch' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ description: 'Search in class title / subtitle' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
