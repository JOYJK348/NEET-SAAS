import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
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

  @ApiProperty({ example: 'STU-2026-0001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  studentCode: string;

  @ApiProperty({ example: '2005-06-15T00:00:00.000Z' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: GenderType, example: GenderType.MALE })
  @IsEnum(GenderType)
  gender: GenderType;

  @ApiProperty({ enum: BloodGroupType, example: BloodGroupType.O_POS })
  @IsEnum(BloodGroupType)
  bloodGroup: BloodGroupType;

  @ApiProperty({ enum: AcademicStatusEnum, example: AcademicStatusEnum.ACTIVE })
  @IsEnum(AcademicStatusEnum)
  academicStatus: AcademicStatusEnum;
}
