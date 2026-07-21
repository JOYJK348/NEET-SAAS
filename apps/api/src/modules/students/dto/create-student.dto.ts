/* eslint-disable @typescript-eslint/no-unsafe-return */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { GenderType, BloodGroupType, AcademicStatusEnum } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'STU-2026-0001' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(50)
  studentCode?: string;

  @ApiProperty({ example: '2005-06-15T00:00:00.000Z' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: GenderType, example: GenderType.MALE })
  @IsEnum(GenderType)
  gender: GenderType;

  @ApiPropertyOptional({ enum: BloodGroupType, example: BloodGroupType.O_POS })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(BloodGroupType)
  bloodGroup?: BloodGroupType;

  @ApiPropertyOptional({
    enum: AcademicStatusEnum,
    example: AcademicStatusEnum.ACTIVE,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(AcademicStatusEnum)
  academicStatus?: AcademicStatusEnum;

  // Extra frontend wizard fields to pass validation whitelist
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  pincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  batchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  admissionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  parentName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  parentPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  parentEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  aadharNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  academicYearId?: string;
}
