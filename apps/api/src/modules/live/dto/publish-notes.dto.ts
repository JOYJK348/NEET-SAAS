import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';

export class PublishNotesDto {
  @ApiPropertyOptional({
    description:
      'Specific approved version to publish. Defaults to the current approved version if omitted.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

