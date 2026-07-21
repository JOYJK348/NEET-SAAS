import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class UpdateAdmissionBatchDto {
  @ApiProperty({
    description: 'New Batch UUID',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  })
  @IsUUID()
  @IsNotEmpty()
  batchId: string;
}
