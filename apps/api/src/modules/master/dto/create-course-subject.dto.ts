import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseSubjectDto {
  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiProperty()
  @IsString()
  subjectId: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  displayOrder?: number = 1;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean = true;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  totalMarks?: number = 100;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt()
  passingMarks?: number = 40;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  credits?: number = 0;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  plannedHours?: number = 100;
}
