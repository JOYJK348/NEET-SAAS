import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordingAnalysisStatusResponseDto {
  @ApiPropertyOptional({
    description: 'Unique identifier of the background analysis job (null if no job has been triggered)',
    example: 'd9b73678-75c9-4676-92f5-d5c4cfa9fbf4',
    nullable: true,
  })
  jobId!: string | null;

  @ApiProperty({
    description: 'Unique identifier of the recorded class',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  recordingId!: string;

  @ApiProperty({
    description: 'Lifecycle status of the analysis processing pipeline',
    enum: ['IDLE', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
    example: 'COMPLETED',
  })
  status!: string;

  @ApiProperty({
    description: 'Execution attempt count',
    example: 1,
  })
  attemptNumber!: number;

  @ApiProperty({
    description: 'Estimated completion progress percentage (0 - 100)',
    example: 100,
  })
  progressPercentage!: number;

  @ApiProperty({
    description: 'Current active processing step description',
    example: 'Analysis foundation staged and awaiting lecture analysis',
  })
  currentStep!: string;

  @ApiPropertyOptional({
    description: 'Failure error message if the job failed',
    example: null,
    nullable: true,
  })
  error!: string | null;

  @ApiPropertyOptional({
    description: 'ISO-8601 timestamp when the job was created',
    example: '2026-11-22T20:50:00.000Z',
    nullable: true,
  })
  createdAt!: string | null;

  @ApiPropertyOptional({
    description: 'ISO-8601 timestamp when the job was last updated',
    example: '2026-11-22T20:50:05.000Z',
    nullable: true,
  })
  updatedAt!: string | null;

  @ApiPropertyOptional({
    description: 'ISO-8601 timestamp when the job execution was completed',
    example: '2026-11-22T20:50:10.000Z',
    nullable: true,
  })
  completedAt?: string | null;

  @ApiPropertyOptional({
    description: 'Total execution runtime in milliseconds',
    example: 1420,
    nullable: true,
  })
  executionDurationMs?: number | null;

  @ApiProperty({
    description: 'Indicates whether actual generated lecture notes/study material exist and are ready for consumption. Remains false during Phase 1 preparation.',
    example: false,
  })
  hasContent!: boolean;

  @ApiPropertyOptional({
    description: 'Indicates whether the preparation pipeline has been staged and is ready for AI lecture analysis.',
    example: true,
  })
  isStaged?: boolean;
}
