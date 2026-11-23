import { ApiProperty } from '@nestjs/swagger';
import type {
  RecordedClassStudyNotes,
  ContentLifecycleMetadata,
} from '../types/recorded-class-ai.types';
import type { NotionContentSyncMetadata } from '../../integrations/notion/notion.types';

export class RecordingStudyNotesResponseDto {
  @ApiProperty({
    example: 'rec_clv0123456789abcdef',
    description: 'Unique identifier of the recording',
  })
  recordingId: string;

  @ApiProperty({
    example: false,
    description:
      'Whether the study notes have been approved by faculty and published to students',
  })
  isPublished: boolean;

  @ApiProperty({
    example: 1,
    description: 'Current working version number',
  })
  version: number;

  @ApiProperty({
    example: '2026-11-22T21:45:00.000Z',
    description: 'Timestamp when the AI analysis and notes generation completed',
  })
  generatedAt: string;

  @ApiProperty({
    example: '2026-11-22T21:45:00.000Z',
    description: 'Timestamp when the generated content was last updated',
  })
  updatedAt: string;

  @ApiProperty({
    required: false,
    type: Object,
    description: 'Current content lifecycle state, approvals, and publication metadata',
  })
  lifecycle?: ContentLifecycleMetadata;

  @ApiProperty({
    required: false,
    type: Object,
    description: 'Curriculum context used to ground the AI multimodal lecture analysis',
  })
  curriculum?: Record<string, any>;

  @ApiProperty({
    required: false,
    type: Object,
    description: 'Technical video metadata (storage object ID, duration, resolution, etc.)',
  })
  videoMetadata?: Record<string, any>;

  @ApiProperty({
    type: Object,
    description:
      'Comprehensive structured NEET study notes conforming to the curriculum schema (overview, transcript, topics, definitions, formulas, concepts, examples, NEET points, conclusion, quality)',
  })
  notes: RecordedClassStudyNotes;

  @ApiProperty({
    required: false,
    type: Object,
    description:
      'Snapshot of the currently published version visible to students, if any',
  })
  publishedSnapshot?: RecordedClassStudyNotes | null;

  @ApiProperty({
    required: false,
    type: Object,
    description: 'Notion synchronization status and metadata',
  })
  notionSync?: NotionContentSyncMetadata | null;
}
