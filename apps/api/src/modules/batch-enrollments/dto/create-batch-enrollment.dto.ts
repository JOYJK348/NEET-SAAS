import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBatchEnrollmentDto {
  @ApiProperty({ example: 'batch-uuid' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
