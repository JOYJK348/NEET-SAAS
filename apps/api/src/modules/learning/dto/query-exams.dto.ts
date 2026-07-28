import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ExamPublishStatusEnum, ExamStatusEnum } from '@prisma/client';
import { QueryParamsDto } from '../../../common/dto/query-params.dto';

export class QueryExamsDto extends QueryParamsDto {
  @ApiPropertyOptional({ description: 'Filter by Course ID' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter by Batch ID' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ description: 'Filter by Subject ID' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    enum: ExamPublishStatusEnum,
    description: 'Filter by Publish Status',
  })
  @IsOptional()
  @IsEnum(ExamPublishStatusEnum)
  publishStatus?: ExamPublishStatusEnum;

  @ApiPropertyOptional({
    enum: ExamStatusEnum,
    description: 'Filter by Exam Status',
  })
  @IsOptional()
  @IsEnum(ExamStatusEnum)
  declare status?: ExamStatusEnum;
}
