import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateAdmissionDto {
  @ApiProperty({
    description: 'Academic year UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @ApiProperty({
    description: 'Course UUID',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    description: 'Branch UUID',
    example: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
  })
  @IsUUID()
  @IsNotEmpty()
  branchId: string;
}
