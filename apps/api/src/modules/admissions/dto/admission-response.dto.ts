import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdmissionStatusEnum } from '@prisma/client';

export class AdmissionResponseDto {
  @ApiProperty({ description: 'Admission UUID', example: 'admission-uuid' })
  id: string;

  @ApiProperty({ description: 'Admission number', example: '2026-000001' })
  admissionNumber: string;

  @ApiProperty({ description: 'Student profile UUID', example: 'student-uuid' })
  studentId: string;

  @ApiProperty({
    enum: AdmissionStatusEnum,
    example: AdmissionStatusEnum.ACTIVE,
  })
  admissionStatus: AdmissionStatusEnum;

  @ApiProperty({
    description: 'Academic year UUID',
    example: 'academic-year-uuid',
  })
  academicYearId: string;

  @ApiProperty({ description: 'Course UUID', example: 'course-uuid' })
  courseId: string;

  @ApiProperty({ description: 'Branch UUID', example: 'branch-uuid' })
  branchId: string;

  @ApiProperty({
    description: 'Admission date',
    example: '2026-07-16T00:00:00.000Z',
  })
  admissionDate: Date;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2026-07-16T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2026-07-16T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Status history record count',
    example: 2,
  })
  historyCount?: number;
}
