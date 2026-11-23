import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyzeRecordingResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the background analysis job',
    example: 'd9b73678-75c9-4676-92f5-d5c4cfa9fbf4',
  })
  jobId!: string;

  @ApiProperty({
    description: 'Unique identifier of the recorded class being analyzed',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  recordingId!: string;

  @ApiProperty({
    description: 'Current status of the analysis background job',
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
    example: 'PENDING',
  })
  status!: string;

  @ApiProperty({
    description: 'User-friendly operational message',
    example: 'Analysis job accepted and queued for processing',
  })
  message!: string;

  @ApiProperty({
    description: 'ISO-8601 timestamp when the job was accepted and created',
    example: '2026-11-22T20:50:00.000Z',
  })
  createdAt!: string;

  @ApiPropertyOptional({
    description: 'Estimated processing duration in seconds based on video length',
    example: 60,
  })
  estimatedDurationSeconds?: number;
}

