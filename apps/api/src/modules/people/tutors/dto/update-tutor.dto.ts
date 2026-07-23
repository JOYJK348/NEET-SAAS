import {
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  IsArray,
  IsUUID,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTutorDto {
  @ApiPropertyOptional({ example: 'Arun' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Kumar' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'arun.kumar@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'FAC-001' })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiPropertyOptional({ example: 'Senior Physics Faculty' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: 'M.Sc Physics' })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ example: 'Mechanics, Electrodynamics' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ example: 'Previous Institute Name' })
  @IsOptional()
  @IsString()
  previousInstitution?: string;

  @ApiPropertyOptional({
    example: 'Experienced Physics faculty with 8+ years...',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  createLogin?: boolean;

  @ApiPropertyOptional({ example: ['subject-uuid-1', 'subject-uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsUUID('loose', { each: true })
  subjectIds?: string[];

  @ApiPropertyOptional({ example: ['branch-uuid-1'] })
  @IsOptional()
  @IsArray()
  @IsUUID('loose', { each: true })
  branchIds?: string[];
}
