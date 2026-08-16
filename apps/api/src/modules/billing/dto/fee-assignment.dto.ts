import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AssignStudentFeeDto {
  @ApiProperty({ example: 'student-admission-uuid' })
  @IsString()
  @IsNotEmpty()
  studentAdmissionId: string;

  @ApiProperty({ example: 'fee-structure-uuid' })
  @IsString()
  @IsNotEmpty()
  feeStructureId: string;

  @ApiPropertyOptional({ example: 'installment-plan-uuid' })
  @IsOptional()
  @IsString()
  installmentPlanId?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ example: 'Initial enrollment fee assignment' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
