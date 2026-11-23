import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class SaveNotesDraftDto {
  @ApiProperty({
    description: 'Updated structured NEET study notes conforming to curriculum schema',
  })
  @IsNotEmpty()
  notes: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Brief description of changes made in this draft revision',
    example: 'Corrected fringe width SI unit and refined worked example 2',
  })
  @IsOptional()
  @IsString()
  changeSummary?: string;

  @ApiProperty({
    description:
      'Expected version number for optimistic concurrency control (prevents silent overwrite collisions). Mandatory at runtime.',
    example: 1,
  })
  @IsNotEmpty({ message: 'expectedVersion is mandatory for concurrency control' })
  @IsInt()
  @Min(1)
  expectedVersion: number;
}

