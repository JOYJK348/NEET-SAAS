import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AttendanceModeType {
  CLASSROOM = 'CLASSROOM',
  ONLINE = 'ONLINE',
  HYBRID = 'HYBRID',
}

export class CreateBatchDeliveryTypeDto {
  @ApiProperty({ example: 'CLASSROOM-FULL' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Full Classroom' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: AttendanceModeType,
    example: AttendanceModeType.CLASSROOM,
  })
  @IsEnum(AttendanceModeType)
  attendanceMode: AttendanceModeType;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt()
  defaultMaxStudents?: number = 40;

  @ApiProperty({ example: '2026-01-01T09:00:00.000Z' })
  @IsString()
  defaultStartTime: string;

  @ApiProperty({ example: '2026-01-01T17:00:00.000Z' })
  @IsString()
  defaultEndTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colorCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconName?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  displayOrder?: number = 1;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
