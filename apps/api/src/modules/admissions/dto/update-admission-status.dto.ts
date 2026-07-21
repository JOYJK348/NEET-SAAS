import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AdmissionStatusEnum } from '@prisma/client';

export class UpdateAdmissionStatusDto {
  @ApiProperty({
    enum: AdmissionStatusEnum,
    example: AdmissionStatusEnum.ACTIVE,
  })
  @IsEnum(AdmissionStatusEnum)
  @IsNotEmpty()
  status: AdmissionStatusEnum;

  @ApiPropertyOptional({ example: 'Student documents verified' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'All documents verified and approved' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
