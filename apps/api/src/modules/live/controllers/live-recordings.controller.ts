import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { LiveRecordingsService } from '../services/live-recordings.service';
import { RecordedClassAiWorkerService } from '../services/recorded-class-ai-worker.service';
import { RecordedClassNotesService } from '../services/recorded-class-notes.service';
import { ListRecordingsQueryDto } from '../dto/list-recordings-query.dto';
import { AnalyzeRecordingResponseDto } from '../dto/analyze-recording-response.dto';
import { RecordingAnalysisStatusResponseDto } from '../dto/recording-analysis-status-response.dto';
import { RecordingStudyNotesResponseDto } from '../dto/recording-study-notes-response.dto';
import { SaveNotesDraftDto } from '../dto/save-notes-draft.dto';
import { PublishNotesDto } from '../dto/publish-notes.dto';
import { UnpublishNotesDto } from '../dto/unpublish-notes.dto';
import { StudentStudyNotesResponseDto } from '../dto/student-study-notes-response.dto';
import { StudyNotesVersionHistoryResponseDto } from '../dto/study-notes-version-history-response.dto';
import { NotionSyncWorkerService } from '../../integrations/notion/notion-sync-worker.service';
import { NotionSyncStatusResponseDto } from '../../integrations/notion/notion.types';

@ApiTags('Recordings (Recorded Classes)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'recordings', version: '1' })
export class LiveRecordingsController {
  constructor(
    private readonly recordingsService: LiveRecordingsService,
    private readonly aiWorkerService: RecordedClassAiWorkerService,
    private readonly notesService: RecordedClassNotesService,
    private readonly notionWorker: NotionSyncWorkerService,
  ) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List recordings (role-scoped: admin all · tutor own · student enrolled READY)',
    description:
      'Supports curriculum filters (courseId/subjectId/chapterId/topicId/batchId), ' +
      'status (processing|ready|failed), search in title/subtitle, and pagination.',
  })
  list(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query() q: ListRecordingsQueryDto,
  ) {
    return this.recordingsService.list({
      tenantId: user.tenantId!,
      userId: user.sub,
      roleCode: user.roleCode,
      status: q.status,
      courseId: q.courseId,
      subjectId: q.subjectId,
      chapterId: q.chapterId,
      topicId: q.topicId,
      batchId: q.batchId,
      search: q.search,
      page: q.page,
      limit: q.limit,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recording detail + short-lived signed playback URL (visibility-checked)',
  })
  getDetail(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ) {
    return this.recordingsService.getDetail(
      user.tenantId!,
      user.sub,
      user.roleCode,
      id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tenant Admin: delete a recording (soft-delete + best-effort storage removal)',
  })
  remove(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ) {
    return this.recordingsService.remove(
      user.tenantId!,
      user.sub,
      user.roleCode,
      id,
    );
  }

  @Post(':id/analyze')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Trigger asynchronous AI analysis for a recording (Admin or Instructor)',
    description:
      'Validates recording readiness, tenant boundary, and ownership. ' +
      'Creates a persistent background job and initiates asynchronous processing. ' +
      'Returns HTTP 202 Accepted. Idempotent against duplicate concurrent requests.',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'AI analysis job accepted and dispatched to background worker',
    type: AnalyzeRecordingResponseDto,
  })
  analyze(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ): Promise<AnalyzeRecordingResponseDto> {
    return this.aiWorkerService.enqueueAnalysisJob(
      user.tenantId!,
      id,
      user.sub,
      user.roleCode,
    );
  }

  @Get(':id/analysis-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve AI analysis progress and status for a recording',
    description:
      'Returns the latest persistent background job state, attempt count, progress percentage, execution duration, and error message if failed.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current analysis status for the recording',
    type: RecordingAnalysisStatusResponseDto,
  })
  getAnalysisStatus(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ): Promise<RecordingAnalysisStatusResponseDto> {
    return this.aiWorkerService.getJobStatus(
      user.tenantId!,
      id,
      user.sub,
      user.roleCode,
    );
  }

  @Get(':id/notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve generated study notes for a recording (Admin or Assigned Tutor only)',
    description:
      'Returns the full structured NEET study notes, lifecycle state, current draft, and published snapshot. ' +
      'Access is strictly forbidden for students (students must use GET :id/student-notes for published notes).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Structured study notes retrieved successfully',
    type: RecordingStudyNotesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden: Students cannot access tutor notes workspace, or tutor does not teach this class',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recording or study notes not found',
  })
  getNotes(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ): Promise<RecordingStudyNotesResponseDto> {
    return this.notesService.getNotes(
      user.tenantId!,
      id,
      user.sub,
      user.roleCode,
    );
  }

  @Put(':id/notes/draft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save draft edits to study notes (Admin or Assigned Tutor only)',
    description:
      'Updates the working copy of the notes without publishing. Creates a new version snapshot and updates lifecycle to DRAFT. ' +
      'Supports optimistic concurrency control via expectedVersion.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Draft saved successfully',
    type: RecordingStudyNotesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Conflict: Version mismatch (concurrent edit detected)',
  })
  saveDraft(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
    @Body() dto: SaveNotesDraftDto,
  ): Promise<RecordingStudyNotesResponseDto> {
    return this.notesService.saveDraft(
      user.tenantId!,
      id,
      user.sub,
      user.roleCode,
      dto,
    );
  }

  @Post(':id/notes/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve study notes for publishing (Admin or Assigned Tutor only)',
    description:
      'Explicitly approves the study notes after review. Validates that required fields are present and marks state as APPROVED. ' +
      'Does not publish to students yet — publishing requires the explicit publish action.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notes approved successfully',
    type: RecordingStudyNotesResponseDto,
  })
  approveNotes(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ): Promise<RecordingStudyNotesResponseDto> {
    return this.notesService.approveNotes(
      user.tenantId!,
      id,
      user.sub,
      user.roleCode,
    );
  }

  @Post(':id/notes/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publish approved study notes to enrolled students (Admin or Assigned Tutor only)',
    description:
      'Publishes approved notes. In an atomic transaction, marks AiGeneratedContent as published, freezes publishedSnapshot, ' +
      'and automatically syncs/upserts into TopicItems linked to the class topic for student curriculum access.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notes published to students successfully',
    type: RecordingStudyNotesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Notes must be explicitly approved before publishing',
  })
  publishNotes(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
    @Body() dto: PublishNotesDto,
  ): Promise<RecordingStudyNotesResponseDto> {
    return this.notesService.publishNotes(
      user.tenantId!,
      id,
      user.sub,
      user.roleCode,
      dto,
    );
  }

  @Post(':id/notes/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unpublish study notes from students (Admin or Assigned Tutor only)',
    description:
      'Immediately revokes student access. In an atomic transaction, marks AiGeneratedContent as unpublished and ' +
      'sets the corresponding TopicItem status to DRAFT, hiding it from student curriculum views.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notes unpublished successfully',
    type: RecordingStudyNotesResponseDto,
  })
  unpublishNotes(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
    @Body() dto: UnpublishNotesDto,
  ): Promise<RecordingStudyNotesResponseDto> {
    return this.notesService.unpublishNotes(
      user.tenantId!,
      id,
      user.sub,
      user.roleCode,
      dto,
    );
  }

  @Get(':id/notes/versions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get version history and audit log for study notes (Admin or Assigned Tutor only)',
    description:
      'Returns the list of all historical versions, snapshots, change summaries, and lifecycle audit log entries.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Version history retrieved successfully',
    type: StudyNotesVersionHistoryResponseDto,
  })
  getVersionHistory(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ): Promise<StudyNotesVersionHistoryResponseDto> {
    return this.notesService.getVersionHistory(
      user.tenantId!,
      id,
      user.sub,
      user.roleCode,
    );
  }

  @Get(':id/student-notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get published study notes for a recording (Enrolled students, Tutors, Admin)',
    description:
      'Returns the clean, immutable published snapshot of study notes for students enrolled in the class batch. ' +
      'If notes are unpublished or unapproved, returns 404 or 403. Draft edits are never leaked to students.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Published study notes for student view',
    type: StudentStudyNotesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden: Student is not enrolled in this batch or notes are not published',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recording or published study notes not found',
  })
  getStudentNotes(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ): Promise<StudentStudyNotesResponseDto> {
    return this.notesService.getStudentNotes(
      user.tenantId!,
      id,
      user.sub,
      user.roleCode,
    );
  }

  @Get(':id/notes/notion-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Notion synchronization status for recording study notes',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current Notion sync status, page link, and metadata',
  })
  getNotionSyncStatus(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ): Promise<NotionSyncStatusResponseDto> {
    return this.notionWorker.getSyncStatus(user.tenantId!, id);
  }

  @Post(':id/notes/notion-sync/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually retry Notion synchronization for published study notes',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Queued Notion synchronization retry',
  })
  retryNotionSync(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ): Promise<NotionSyncStatusResponseDto> {
    return this.notionWorker.retrySync(user.tenantId!, id, user.sub);
  }
}
