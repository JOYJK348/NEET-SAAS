import {
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty({ example: 'NEET25A' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'NEET 2026 Batch A' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  branchId: string;

  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiProperty()
  @IsString()
  academicYearId: string;

  @ApiProperty()
  @IsString()
  deliveryTypeId: string;

  @ApiProperty({ example: 40 })
  @IsInt()
  @Min(1)
  @Max(500)
  maxStudents: number;

  @ApiProperty({ example: '2025-06-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-04-30T00:00:00.000Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowNewAdmissions?: boolean = true;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @IsString()
  endTime?: string;
}
