import { ApiProperty } from '@nestjs/swagger';
import { GenderType, BloodGroupType, AcademicStatusEnum } from '@prisma/client';

export class StudentResponseDto {
  @ApiProperty({ example: 'user-id-uuid' })
  id: string;

  @ApiProperty({ example: 'tenant-id-uuid' })
  tenantId: string;

  @ApiProperty({ example: 'STU-2026-0001' })
  studentCode: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: '2005-06-15T00:00:00.000Z' })
  dateOfBirth: Date;

  @ApiProperty({ enum: GenderType, example: GenderType.MALE })
  gender: GenderType;

  @ApiProperty({ enum: BloodGroupType, example: BloodGroupType.O_POS })
  bloodGroup: BloodGroupType;

  @ApiProperty({ enum: AcademicStatusEnum, example: AcademicStatusEnum.ACTIVE })
  academicStatus: AcademicStatusEnum;

  @ApiProperty({ example: '2026-07-15T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-15T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 'system-user-id' })
  createdBy: string;

  @ApiProperty({ example: 'system-user-id' })
  updatedBy: string;
}
