import { ApiProperty } from '@nestjs/swagger';
import type {
  ContentVersionSnapshot,
  ContentAuditLogEntry,
} from '../types/recorded-class-ai.types';

export class StudyNotesVersionHistoryResponseDto {
  @ApiProperty({ example: 'rec_123', description: 'Recording ID' })
  recordingId: string;

  @ApiProperty({ example: 2, description: 'Current working version number' })
  currentVersion: number;

  @ApiProperty({ example: 1, description: 'Currently published version number, or null if unpublished' })
  publishedVersion: number | null;

  @ApiProperty({ type: [Object], description: 'Full immutable version history snapshots' })
  versions: ContentVersionSnapshot[];

  @ApiProperty({ type: [Object], description: 'Chronological audit trail of all actions' })
  auditLog: ContentAuditLogEntry[];
}

