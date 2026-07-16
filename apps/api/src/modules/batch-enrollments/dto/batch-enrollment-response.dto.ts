import { ApiProperty } from '@nestjs/swagger';
import { BatchStatusType } from '@prisma/client';

export class BatchEnrollmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  admissionId: string;

  @ApiProperty()
  batchId: string;

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty({ enum: BatchStatusType })
  status: BatchStatusType;

  @ApiProperty()
  isPrimary: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
