import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class FeePlanItemDto {
  @ApiProperty({ example: 'Tuition Fee' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercentage?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  mandatory?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  refundable?: boolean;
}

export class CreateFeePlanDto {
  @ApiProperty({ example: 'course-uuid' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ example: 'academic-year-uuid' })
  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  @ApiProperty({ example: 'branch-uuid' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'department-uuid' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ example: 'NEET-2027-STD' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'NEET 2027 Standard Fee Plan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Standard tuition and material fee structure for NEET 2027' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-06-01T00:00:00Z' })
  @IsDateString()
  effectiveFrom: string;

  @ApiProperty({ example: '2027-05-31T23:59:59Z' })
  @IsDateString()
  effectiveTo: string;

  @ApiProperty({ type: [FeePlanItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeePlanItemDto)
  items: FeePlanItemDto[];
}

export class InstallmentPlanItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  installmentNumber: number;

  @ApiProperty({ example: '1st Installment' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: '2026-06-10T00:00:00Z' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 20000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountFixed?: number;

  @ApiPropertyOptional({ example: 33.33 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPercentage?: number;
}

export class CreateInstallmentPlanDto {
  @ApiProperty({ example: '3 Installments Plan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Payable in 3 equal installments across the academic year' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ type: [InstallmentPlanItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstallmentPlanItemDto)
  items: InstallmentPlanItemDto[];
}

export class UpdateFeePlanDto extends PartialType(CreateFeePlanDto) {}
