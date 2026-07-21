import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdmissionStatusEnum } from '@prisma/client';

export class AdmissionHistoryResponseDto {
  @ApiProperty({ description: 'History record UUID', example: 'history-uuid' })
  id: string;

  @ApiProperty({ description: 'Admission UUID', example: 'admission-uuid' })
  admissionId: string;

  @ApiProperty({ enum: AdmissionStatusEnum, nullable: true, example: null })
  fromStatus: AdmissionStatusEnum | null;

  @ApiProperty({
    enum: AdmissionStatusEnum,
    example: AdmissionStatusEnum.ACTIVE,
  })
  toStatus: AdmissionStatusEnum;

  @ApiPropertyOptional({ example: 'Student documents verified' })
  reason: string | null;

  @ApiProperty({
    description: 'User who performed the change',
    example: 'user-uuid',
  })
  changedBy: string;

  @ApiProperty({ example: '2026-07-16T12:00:00.000Z' })
  changedAt: Date;

  @ApiProperty({ example: '2026-07-16T12:00:00.000Z' })
  createdAt: Date;
}
