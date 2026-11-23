import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UnpublishNotesDto {
  @ApiPropertyOptional({
    description: 'Reason for unpublishing the study notes',
    example: 'Faculty requested revision of diagrams and formula definitions',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

