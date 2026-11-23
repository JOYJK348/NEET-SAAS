import { ApiProperty } from '@nestjs/swagger';
import type { RecordedClassStudyNotes } from '../types/recorded-class-ai.types';

export class StudentStudyNotesResponseDto {
  @ApiProperty({ example: 'rec_123', description: 'Recording ID' })
  recordingId: string;

  @ApiProperty({ example: 'Optics: Wave Theory & Interference', description: 'Class Title' })
  title: string;

  @ApiProperty({ example: 1, description: 'Published version number' })
  version: number;

  @ApiProperty({ example: '2026-11-22T22:00:00.000Z', description: 'Timestamp when approved notes were published' })
  publishedAt: string;

  @ApiProperty({ required: false, type: Object, description: 'Curriculum context' })
  curriculum?: Record<string, any>;

  @ApiProperty({ type: Object, description: 'Clean, faculty-approved structured study notes' })
  notes: RecordedClassStudyNotes;

  @ApiProperty({ required: false, nullable: true, example: 'https://notion.so/...', description: 'Synced Notion page URL' })
  notionPageUrl?: string | null;
}

