import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { GenderType, BloodGroupType, AcademicStatusEnum } from '@prisma/client';

export class UpdateStudentDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Smith' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'STU-2026-0002' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  studentCode?: string;

  @ApiPropertyOptional({ example: '2005-06-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: GenderType, example: GenderType.FEMALE })
  @IsOptional()
  @IsEnum(GenderType)
  gender?: GenderType;

  @ApiPropertyOptional({ enum: BloodGroupType, example: BloodGroupType.A_POS })
  @IsOptional()
  @IsEnum(BloodGroupType)
  bloodGroup?: BloodGroupType;

  @ApiPropertyOptional({
    enum: AcademicStatusEnum,
    example: AcademicStatusEnum.ACTIVE,
  })
  @IsOptional()
  @IsEnum(AcademicStatusEnum)
  academicStatus?: AcademicStatusEnum;
}
