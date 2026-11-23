import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, TopicItemStatusType, TopicItemType, BackgroundJobStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LiveRecordingsService } from './live-recordings.service';
import {
  RecordedClassStudyNotes,
  validateRecordedClassStudyNotes,
  ContentLifecycleState,
  ContentVersionSnapshot,
  ContentLifecycleMetadata,
  ContentAuditLogEntry,
} from '../types/recorded-class-ai.types';
import { SaveNotesDraftDto } from '../dto/save-notes-draft.dto';
import { PublishNotesDto } from '../dto/publish-notes.dto';
import { UnpublishNotesDto } from '../dto/unpublish-notes.dto';
import { RecordingStudyNotesResponseDto } from '../dto/recording-study-notes-response.dto';
import { StudentStudyNotesResponseDto } from '../dto/student-study-notes-response.dto';
import { StudyNotesVersionHistoryResponseDto } from '../dto/study-notes-version-history-response.dto';
import { NotionSyncWorkerService } from '../../integrations/notion/notion-sync-worker.service';
import { NotionContentSyncMetadata } from '../../integrations/notion/notion.types';

@Injectable()
export class RecordedClassNotesService {
  private readonly logger = new Logger(RecordedClassNotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recordingsService: LiveRecordingsService,
    private readonly notionSyncWorker: NotionSyncWorkerService,
  ) {}

  // ─── 1. Tutor/Admin Note Inspection ──────────────────────────────────────

  async getNotes(
    tenantId: string,
    recordingId: string,
    userId: string,
    roleCode: string,
  ): Promise<RecordingStudyNotesResponseDto> {
    const { rec } = await this.assertTutorOrAdmin(tenantId, recordingId, userId, roleCode);

    const content = await this.prisma.aiGeneratedContent.findFirst({
      where: {
        tenantId,
        referenceEntityType: 'LiveClassRecordings',
        referenceEntityId: recordingId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!content) {
      throw new NotFoundException('Study notes have not been generated for this recording yet');
    }

    const output = (content.generatedOutput as Record<string, any>) || {};
    if (output.status !== 'COMPLETED' || !output.notes) {
      throw new NotFoundException(
        'Study notes are currently in progress or staging and have not completed yet',
      );
    }

    const lifecycle: ContentLifecycleMetadata = output.lifecycle || {
      state: content.isPublished ? 'PUBLISHED' : 'AI_GENERATED',
      currentVersion: content.version || 1,
      approvedVersion: content.isPublished ? content.version : null,
      publishedVersion: content.isPublished ? content.version : null,
    };

    return {
      recordingId,
      isPublished: content.isPublished,
      version: content.version || 1,
      generatedAt: (output.completedAt as string) || content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString(),
      lifecycle,
      curriculum: output.curriculum,
      videoMetadata: output.videoMetadata,
      notes: output.notes as RecordedClassStudyNotes,
      publishedSnapshot: (output.publishedSnapshot as RecordedClassStudyNotes) || null,
      notionSync: output.notionSync || null,
    };
  }

  // ─── 2. Tutor Draft Revision (Saving Edits without Publishing) ───────────

  async saveDraft(
    tenantId: string,
    recordingId: string,
    userId: string,
    roleCode: string,
    dto: SaveNotesDraftDto,
  ): Promise<RecordingStudyNotesResponseDto> {
    const { rec } = await this.assertTutorOrAdmin(tenantId, recordingId, userId, roleCode);

    const validation = validateRecordedClassStudyNotes(dto.notes);
    if (!validation.valid || !validation.data) {
      throw new BadRequestException(
        `Invalid study notes structure: ${validation.errors.join('; ')}`,
      );
    }
    const validatedNotes = validation.data;

    const content = await this.prisma.aiGeneratedContent.findFirst({
      where: {
        tenantId,
        referenceEntityType: 'LiveClassRecordings',
        referenceEntityId: recordingId,
        deletedAt: null,
      },
    });

    if (!content) {
      throw new NotFoundException('Cannot save draft: No AI study notes found for this recording');
    }

    // Optimistic Concurrency Control: expectedVersion is strictly mandatory
    if (dto.expectedVersion == null) {
      throw new BadRequestException(
        'expectedVersion is mandatory to prevent concurrent overwrite collisions',
      );
    }

    if (dto.expectedVersion !== content.version) {
      throw new ConflictException(
        `Concurrency conflict: You are editing version ${dto.expectedVersion}, but the server is currently on version ${content.version}. Please refresh to merge latest changes.`,
      );
    }

    const currentOutput = (content.generatedOutput as Record<string, any>) || {};
    const currentLifecycle: ContentLifecycleMetadata = currentOutput.lifecycle || {
      state: content.isPublished ? 'PUBLISHED' : 'AI_GENERATED',
      currentVersion: content.version || 1,
    };

    const isCurrentlyPublished = content.isPublished && (currentLifecycle.state === 'PUBLISHED' || !!currentLifecycle.publishedVersion);

    // Every draft revision increments version to ensure subsequent concurrent saves collide predictably
    const newVersion = content.version + 1;
    const newState: ContentLifecycleState = 'DRAFT';

    const publishedSnapshot = isCurrentlyPublished
      ? currentOutput.publishedSnapshot || currentOutput.notes
      : currentOutput.publishedSnapshot || null;

    const versionList: ContentVersionSnapshot[] = Array.isArray(currentOutput.versions)
      ? [...currentOutput.versions]
      : [];

    const newSnapshot: ContentVersionSnapshot = {
      version: newVersion,
      state: newState,
      notes: validatedNotes,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      changeSummary: dto.changeSummary || 'Draft edited by faculty',
    };
    versionList.push(newSnapshot);

    const auditLog: ContentAuditLogEntry[] = Array.isArray(currentOutput.auditLog)
      ? [...currentOutput.auditLog]
      : [];

    auditLog.push({
      action: 'DRAFT_SAVED',
      actorId: userId,
      actorRole: roleCode,
      timestamp: new Date().toISOString(),
      version: newVersion,
      details: dto.changeSummary || 'Draft revision saved by faculty',
    });

    const updatedLifecycle: ContentLifecycleMetadata = {
      ...currentLifecycle,
      state: newState,
      currentVersion: newVersion,
      // Editing ANY draft immediately and unconditionally invalidates any prior approval
      approvedVersion: null,
      approvedAt: null,
      approvedBy: null,
      publishedVersion: isCurrentlyPublished ? (currentLifecycle.publishedVersion ?? null) : null,
      publishedAt: isCurrentlyPublished ? (currentLifecycle.publishedAt ?? null) : null,
      publishedBy: isCurrentlyPublished ? (currentLifecycle.publishedBy ?? null) : null,
    };

    const updatedOutput: Record<string, any> = {
      ...currentOutput,
      notes: validatedNotes,
      publishedSnapshot,
      lifecycle: updatedLifecycle,
      versions: versionList,
      auditLog,
    };

    // Atomic row-level conditional update using expectedVersion
    const updateResult = await this.prisma.aiGeneratedContent.updateMany({
      where: {
        id: content.id,
        version: dto.expectedVersion,
      },
      data: {
        version: newVersion,
        isPublished: content.isPublished,
        generatedOutput: updatedOutput as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    if (updateResult.count === 0) {
      throw new ConflictException(
        `Concurrency conflict: Version ${dto.expectedVersion} was modified concurrently by another faculty member. Please refresh to load latest changes.`,
      );
    }

    const updated = await this.prisma.aiGeneratedContent.findUniqueOrThrow({
      where: { id: content.id },
    });

    this.logger.log(
      `Saved draft for recording ${recordingId} (version: ${newVersion}, state: ${newState}, user: ${userId})`,
    );

    return {
      recordingId,
      isPublished: updated.isPublished,
      version: updated.version,
      generatedAt: (updatedOutput.completedAt as string) || updated.createdAt?.toISOString() || content.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: updated.updatedAt?.toISOString() || new Date().toISOString(),
      lifecycle: updatedLifecycle,
      curriculum: updatedOutput.curriculum,
      videoMetadata: updatedOutput.videoMetadata,
      notes: validatedNotes,
      publishedSnapshot: publishedSnapshot as RecordedClassStudyNotes,
      notionSync: updatedOutput.notionSync || null,
    };
  }

  // ─── 3. Tutor Explicit Approval ──────────────────────────────────────────

  async approveNotes(
    tenantId: string,
    recordingId: string,
    userId: string,
    roleCode: string,
  ): Promise<RecordingStudyNotesResponseDto> {
    const { rec } = await this.assertTutorOrAdmin(tenantId, recordingId, userId, roleCode);

    const content = await this.prisma.aiGeneratedContent.findFirst({
      where: {
        tenantId,
        referenceEntityType: 'LiveClassRecordings',
        referenceEntityId: recordingId,
        deletedAt: null,
      },
    });

    if (!content) {
      throw new NotFoundException('Cannot approve: No study notes found for this recording');
    }

    const currentOutput = (content.generatedOutput as Record<string, any>) || {};
    const validation = validateRecordedClassStudyNotes(currentOutput.notes);
    if (!validation.valid || !validation.data) {
      throw new BadRequestException(
        `Cannot approve study notes with validation errors: ${validation.errors.join('; ')}`,
      );
    }

    const currentLifecycle: ContentLifecycleMetadata = currentOutput.lifecycle || {
      state: 'AI_GENERATED',
      currentVersion: content.version || 1,
    };

    const approvedVersion = content.version;
    const approvedAt = new Date().toISOString();
    const newState: ContentLifecycleState = 'APPROVED';

    const auditLog: ContentAuditLogEntry[] = Array.isArray(currentOutput.auditLog)
      ? [...currentOutput.auditLog]
      : [];

    auditLog.push({
      action: 'CONTENT_APPROVED',
      actorId: userId,
      actorRole: roleCode,
      timestamp: approvedAt,
      version: approvedVersion,
      details: 'Faculty verified scientific accuracy and approved study notes',
    });

    const updatedLifecycle: ContentLifecycleMetadata = {
      ...currentLifecycle,
      state: newState,
      approvedVersion,
      approvedAt,
      approvedBy: userId,
    };

    const updatedOutput: Record<string, any> = {
      ...currentOutput,
      lifecycle: updatedLifecycle,
      auditLog,
    };

    const updated = await this.prisma.aiGeneratedContent.update({
      where: { id: content.id },
      data: {
        generatedOutput: updatedOutput as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    this.logger.log(
      `Approved study notes for recording ${recordingId} (version: ${approvedVersion}, approvedBy: ${userId})`,
    );

    return {
      recordingId,
      isPublished: updated.isPublished,
      version: updated.version,
      generatedAt: (updatedOutput.completedAt as string) || updated.createdAt?.toISOString() || content.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: updated.updatedAt?.toISOString() || new Date().toISOString(),
      lifecycle: updatedLifecycle,
      curriculum: updatedOutput.curriculum,
      videoMetadata: updatedOutput.videoMetadata,
      notes: currentOutput.notes as RecordedClassStudyNotes,
      publishedSnapshot: (updatedOutput.publishedSnapshot as RecordedClassStudyNotes) || null,
      notionSync: updatedOutput.notionSync || null,
    };
  }

  // ─── 4. Publishing to Students (Sync to TopicItems) ───────────────────────

  async publishNotes(
    tenantId: string,
    recordingId: string,
    userId: string,
    roleCode: string,
    dto?: PublishNotesDto,
  ): Promise<RecordingStudyNotesResponseDto> {
    const { rec } = await this.assertTutorOrAdmin(tenantId, recordingId, userId, roleCode);

    // Retrieve LiveClass to link to TopicItems
    let liveClassData: any = null;
    if (rec.liveClassId) {
      liveClassData = await this.prisma.liveClasses.findUnique({
        where: { id: rec.liveClassId },
      });
    }

    // Atomic Database Transaction: Read + Verify + Upsert TopicItems + Update AiGeneratedContent
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Re-read content INSIDE the transaction to guarantee isolation from concurrent draft edits
      const content = await tx.aiGeneratedContent.findFirst({
        where: {
          tenantId,
          referenceEntityType: 'LiveClassRecordings',
          referenceEntityId: recordingId,
          deletedAt: null,
        },
      });

      if (!content) {
        throw new NotFoundException('Cannot publish: No study notes found for this recording');
      }

      const currentOutput = (content.generatedOutput as Record<string, any>) || {};
      const currentLifecycle: ContentLifecycleMetadata = currentOutput.lifecycle || {
        state: 'AI_GENERATED',
        currentVersion: content.version || 1,
      };

      const targetVersion = dto?.version ?? content.version;

      // STRICT CHECK: The exact version to publish MUST match current content version
      if (content.version !== targetVersion) {
        throw new BadRequestException(
          `Cannot publish version ${targetVersion}: Current draft version is ${content.version}. You cannot publish an outdated or modified draft.`,
        );
      }

      // STRICT CHECK: Content MUST be explicitly APPROVED for this exact version
      const isApproved =
        currentLifecycle.state === 'APPROVED' &&
        currentLifecycle.approvedVersion === targetVersion;

      const isRepublishing =
        currentLifecycle.state === 'UNPUBLISHED' &&
        currentLifecycle.approvedVersion === targetVersion;

      if (!isApproved && !isRepublishing) {
        throw new BadRequestException(
          `Cannot publish: Version ${targetVersion} has not been approved. Notes must be explicitly approved before publishing.`,
        );
      }

      const notesToPublish: RecordedClassStudyNotes = currentOutput.notes;
      const publishedAt = new Date().toISOString();
      const newState: ContentLifecycleState = 'PUBLISHED';

      // 2. Sync or Upsert to TopicItems if topicId is available
      let syncedTopicItemId: string | null = currentLifecycle.topicItemId || null;

      if (liveClassData?.topicId) {
        syncedTopicItemId = await this.syncTopicItem(
          tx,
          tenantId,
          rec,
          liveClassData,
          notesToPublish,
          targetVersion,
          userId,
          currentLifecycle.topicItemId,
        );
      }

      // 3. Update AiGeneratedContent with conditional version match
      const auditLog: ContentAuditLogEntry[] = Array.isArray(currentOutput.auditLog)
        ? [...currentOutput.auditLog]
        : [];

      auditLog.push({
        action: 'CONTENT_PUBLISHED',
        actorId: userId,
        actorRole: roleCode,
        timestamp: publishedAt,
        version: targetVersion,
        details: `Published version ${targetVersion} to students (TopicItem: ${syncedTopicItemId ?? 'N/A'})`,
      });

      const updatedLifecycle: ContentLifecycleMetadata = {
        ...currentLifecycle,
        state: newState,
        publishedVersion: targetVersion,
        publishedAt,
        publishedBy: userId,
        topicItemId: syncedTopicItemId,
      };

      // 3. Transactional Outbox for Notion Synchronization
      // Check tenant Notion configuration inside the database transaction
      const tenantSettings = await tx.tenantSettings.findFirst({
        where: { tenantId, deletedAt: null },
      });
      const branding = (tenantSettings?.brandingConfig as Record<string, any>) || {};
      const defaultNotionKey = (
        process.env.NOTION_DEFAULT_API_KEY ||
        process.env.NOTION_API_KEY ||
        ''
      ).trim();
      const defaultNotionParentId = (
        process.env.NOTION_DEFAULT_PARENT_PAGE_ID ||
        process.env.NOTION_PARENT_PAGE_ID ||
        ''
      ).trim();
      const isPlatformDefaultNotion = Boolean(defaultNotionKey && defaultNotionParentId);

      const isNotionActive = Boolean(
        (branding.notionIntegration?.isActive && branding.notionIntegration?.apiKeyEncrypted) ||
        isPlatformDefaultNotion,
      );

      let notionSyncMeta: NotionContentSyncMetadata;
      let enqueuedJobId: string | null = null;

      const currentSync: NotionContentSyncMetadata = currentOutput.notionSync || {
        syncStatus: 'NOT_CONNECTED',
        attemptCount: 0,
      };

      if (isNotionActive) {
        // Cancel/supersede any existing pending NOTION_SYNC jobs for this content
        await tx.backgroundJobs.updateMany({
          where: {
            tenantId,
            jobType: 'NOTION_SYNC',
            status: BackgroundJobStatusEnum.PENDING,
            payload: {
              path: ['contentId'],
              equals: content.id,
            },
            deletedAt: null,
          },
          data: {
            status: BackgroundJobStatusEnum.COMPLETED,
            deletedAt: new Date(),
            deletedBy: userId,
          },
        });

        // Insert durable BackgroundJobs record inside the SAME database transaction
        const syncJob = await tx.backgroundJobs.create({
          data: {
            tenantId,
            jobType: 'NOTION_SYNC',
            status: BackgroundJobStatusEnum.PENDING,
            priority: 3,
            scheduledRunAt: new Date(),
            payload: {
              recordingId,
              contentId: content.id,
              version: targetVersion,
              action: 'PUBLISH',
              enqueuedAt: publishedAt,
              triggeredBy: userId,
            },
            createdBy: userId,
            updatedBy: userId,
          },
        });
        enqueuedJobId = syncJob.id;

        notionSyncMeta = {
          ...currentSync,
          syncStatus: 'PENDING',
          lastAttemptAt: publishedAt,
          attemptCount: 0,
          lastErrorMessage: null,
        };
      } else {
        // Notion not configured: explicitly record NOT_REQUIRED
        notionSyncMeta = {
          ...currentSync,
          syncStatus: 'NOT_REQUIRED',
          lastAttemptAt: publishedAt,
          attemptCount: 0,
        };
      }

      const updatedOutput: Record<string, any> = {
        ...currentOutput,
        publishedSnapshot: notesToPublish,
        lifecycle: updatedLifecycle,
        notionSync: notionSyncMeta,
        auditLog,
      };

      const updateResult = await tx.aiGeneratedContent.updateMany({
        where: {
          id: content.id,
          version: targetVersion,
        },
        data: {
          isPublished: true,
          generatedOutput: updatedOutput as unknown as Prisma.InputJsonValue,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          `Publish conflict: The notes were modified concurrently. Please review the latest changes before publishing.`,
        );
      }

      const updatedContent = await tx.aiGeneratedContent.findUniqueOrThrow({
        where: { id: content.id },
      });

      return {
        updatedContent,
        updatedOutput,
        updatedLifecycle,
        enqueuedJobId,
      };
    });

    this.logger.log(
      `Published study notes for recording ${recordingId} (version: ${result.updatedLifecycle.publishedVersion}, publishedBy: ${userId})`,
    );

    // Trigger immediate async execution of the transactional Notion sync job
    if (result.enqueuedJobId) {
      setImmediate(() => {
        this.notionSyncWorker.processJob(result.enqueuedJobId!).catch((notionErr: any) => {
          this.logger.warn(`Error in immediate Notion sync execution for job ${result.enqueuedJobId}: ${notionErr?.message}`);
        });
      });
    }

    return {
      recordingId,
      isPublished: true,
      version: result.updatedContent.version,
      generatedAt: (result.updatedOutput.completedAt as string) || result.updatedContent.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: result.updatedContent.updatedAt?.toISOString() || new Date().toISOString(),
      lifecycle: result.updatedLifecycle,
      curriculum: result.updatedOutput.curriculum,
      videoMetadata: result.updatedOutput.videoMetadata,
      notes: result.updatedOutput.notes as RecordedClassStudyNotes,
      publishedSnapshot: result.updatedOutput.publishedSnapshot as RecordedClassStudyNotes,
      notionSync: result.updatedOutput.notionSync || null,
    };
  }

  // ─── 4b. Full Automation: Auto-Publishing Directly from AI Analysis ───────

  /**
   * Persists and auto-publishes AI-generated study notes directly to enrolled students.
   * Eliminates mandatory tutor approval gates, syncs to TopicItems, and dispatches Notion sync.
   */
  async autoPublishGeneratedNotes(
    tenantId: string,
    recordingId: string,
    userId: string,
    generatedNotes: RecordedClassStudyNotes,
    curriculumContext: any,
    videoMetadata: any,
    jobId: string,
    executionId: string,
  ): Promise<{ contentId: string; enqueuedNotionJobId: string | null }> {
    const publishedAt = new Date().toISOString();

    const rec = await this.prisma.liveClassRecordings.findFirst({
      where: { id: recordingId, tenantId, deletedAt: null },
    });
    if (!rec) {
      throw new NotFoundException(`Recording ${recordingId} not found`);
    }

    let liveClassData: any = null;
    if (rec.liveClassId) {
      liveClassData = await this.prisma.liveClasses.findUnique({
        where: { id: rec.liveClassId },
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existingContent = await tx.aiGeneratedContent.findFirst({
        where: {
          tenantId,
          referenceEntityType: 'LiveClassRecordings',
          referenceEntityId: recordingId,
          deletedAt: null,
        },
      });

      const currentOutput = (existingContent?.generatedOutput as Record<string, any>) || {};
      const currentLifecycle: ContentLifecycleMetadata = currentOutput.lifecycle || {
        state: 'AI_GENERATED',
        currentVersion: existingContent?.version || 1,
      };

      // 1. Sync or Upsert to TopicItems if topicId is available
      let syncedTopicItemId: string | null = currentLifecycle.topicItemId || null;
      if (liveClassData?.topicId) {
        try {
          syncedTopicItemId = await this.syncTopicItem(
            tx,
            tenantId,
            rec,
            liveClassData,
            generatedNotes,
            1,
            userId,
            currentLifecycle.topicItemId,
          );
        } catch (topicErr) {
          this.logger.warn(`Could not sync TopicItem for recording ${recordingId}: ${topicErr}`);
        }
      }

      // 2. Check Notion configuration
      const tenantSettings = await tx.tenantSettings.findFirst({
        where: { tenantId, deletedAt: null },
      });
      const branding = (tenantSettings?.brandingConfig as Record<string, any>) || {};
      const defaultNotionKey = (
        process.env.NOTION_DEFAULT_API_KEY ||
        process.env.NOTION_API_KEY ||
        ''
      ).trim();
      const defaultNotionParentId = (
        process.env.NOTION_DEFAULT_PARENT_PAGE_ID ||
        process.env.NOTION_PARENT_PAGE_ID ||
        ''
      ).trim();
      const isPlatformDefaultNotion = Boolean(defaultNotionKey && defaultNotionParentId);
      const isNotionActive = Boolean(
        (branding.notionIntegration?.isActive && branding.notionIntegration?.apiKeyEncrypted) ||
        isPlatformDefaultNotion,
      );

      let notionSyncMeta: NotionContentSyncMetadata = currentOutput.notionSync || {
        syncStatus: 'NOT_CONNECTED',
        attemptCount: 0,
      };
      let enqueuedJobId: string | null = null;

      const structuredContainerOutput = {
        status: 'COMPLETED',
        phase: 2,
        recordingId,
        videoMetadata,
        curriculum: curriculumContext,
        aiPipelineStatus: {
          provider: 'GEMINI',
          jobId,
          executionId,
        },
        notes: generatedNotes,
        publishedSnapshot: generatedNotes,
        completedAt: publishedAt,
        lifecycle: {
          state: 'PUBLISHED' as ContentLifecycleState,
          currentVersion: 1,
          approvedVersion: 1,
          publishedVersion: 1,
          publishedAt,
          publishedBy: userId,
          topicItemId: syncedTopicItemId,
        },
        versions: [
          {
            version: 1,
            state: 'PUBLISHED' as ContentLifecycleState,
            notes: generatedNotes,
            createdAt: publishedAt,
            createdBy: userId,
            changeSummary: 'Multimodal AI Generated & Auto-Published Study Notes',
          },
        ],
        auditLog: [
          {
            action: 'AI_GENERATED_AND_AUTO_PUBLISHED',
            actorId: userId,
            actorRole: 'SYSTEM_AUTO',
            timestamp: publishedAt,
            version: 1,
            details: `Multimodal AI notes generated and auto-published to students (TopicItem: ${syncedTopicItemId ?? 'N/A'})`,
          },
        ],
      };

      let savedContent: any;
      if (existingContent) {
        savedContent = await tx.aiGeneratedContent.update({
          where: { id: existingContent.id },
          data: {
            generatedOutput: structuredContainerOutput as unknown as Prisma.InputJsonValue,
            isPublished: true,
            updatedAt: new Date(),
            updatedBy: userId,
          },
        });
      } else {
        savedContent = await tx.aiGeneratedContent.create({
          data: {
            tenantId,
            contentType: 'RECORDED_CLASS_STUDY_NOTES',
            referenceEntityType: 'LiveClassRecordings',
            referenceEntityId: recordingId,
            generatedOutput: structuredContainerOutput as unknown as Prisma.InputJsonValue,
            isPublished: true,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

      if (isNotionActive) {
        // Cancel any pending sync jobs
        await tx.backgroundJobs.updateMany({
          where: {
            tenantId,
            jobType: 'NOTION_SYNC',
            status: BackgroundJobStatusEnum.PENDING,
            payload: {
              path: ['contentId'],
              equals: savedContent.id,
            },
            deletedAt: null,
          },
          data: {
            status: BackgroundJobStatusEnum.COMPLETED,
            deletedAt: new Date(),
            deletedBy: userId,
          },
        });

        const syncJob = await tx.backgroundJobs.create({
          data: {
            tenantId,
            jobType: 'NOTION_SYNC',
            status: BackgroundJobStatusEnum.PENDING,
            priority: 3,
            scheduledRunAt: new Date(),
            payload: {
              recordingId,
              contentId: savedContent.id,
              version: 1,
              action: 'PUBLISH',
              enqueuedAt: publishedAt,
              triggeredBy: userId,
            },
            createdBy: userId,
            updatedBy: userId,
          },
        });
        enqueuedJobId = syncJob.id;
        notionSyncMeta = {
          ...notionSyncMeta,
          syncStatus: 'PENDING',
          lastAttemptAt: publishedAt,
          attemptCount: 0,
          lastErrorMessage: null,
        };

        await tx.aiGeneratedContent.update({
          where: { id: savedContent.id },
          data: {
            generatedOutput: {
              ...structuredContainerOutput,
              notionSync: notionSyncMeta,
            } as unknown as Prisma.InputJsonValue,
          },
        });
      }

      return { contentId: savedContent.id, enqueuedJobId };
    });

    this.logger.log(
      `Auto-published study notes for recording ${recordingId} (contentId: ${result.contentId}, notionJob: ${result.enqueuedJobId || 'none'})`,
    );

    if (result.enqueuedJobId) {
      setImmediate(() => {
        this.notionSyncWorker.processJob(result.enqueuedJobId!).catch((notionErr: any) => {
          this.logger.warn(`Error in immediate Notion sync execution for job ${result.enqueuedJobId}: ${notionErr?.message}`);
        });
      });
    }

    return { contentId: result.contentId, enqueuedNotionJobId: result.enqueuedJobId };
  }

  // ─── 5. Unpublishing (Immediate Student Revocation) ──────────────────────

  async unpublishNotes(
    tenantId: string,
    recordingId: string,
    userId: string,
    roleCode: string,
    dto?: UnpublishNotesDto,
  ): Promise<RecordingStudyNotesResponseDto> {
    const { rec } = await this.assertTutorOrAdmin(tenantId, recordingId, userId, roleCode);

    const content = await this.prisma.aiGeneratedContent.findFirst({
      where: {
        tenantId,
        referenceEntityType: 'LiveClassRecordings',
        referenceEntityId: recordingId,
        deletedAt: null,
      },
    });

    if (!content) {
      throw new NotFoundException('Cannot unpublish: No study notes found for this recording');
    }

    const currentOutput = (content.generatedOutput as Record<string, any>) || {};
    const currentLifecycle: ContentLifecycleMetadata = currentOutput.lifecycle || {
      state: 'AI_GENERATED',
      currentVersion: content.version || 1,
    };

    if (!content.isPublished && currentLifecycle.state === 'UNPUBLISHED') {
      throw new BadRequestException('Study notes are already unpublished');
    }

    const unpublishedAt = new Date().toISOString();
    const newState: ContentLifecycleState = 'UNPUBLISHED';

    // Atomic Database Transaction: Revoke AiGeneratedContent and TopicItems
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Deactivate linked TopicItems
      if (currentLifecycle.topicItemId) {
        try {
          await tx.topicItems.update({
            where: { id: currentLifecycle.topicItemId },
            data: {
              status: TopicItemStatusType.DRAFT,
              isActive: false,
              updatedAt: new Date(),
              updatedBy: userId,
            },
          });
        } catch (e) {
          this.logger.warn(`Failed to deactivate topic item ${currentLifecycle.topicItemId}: ${e}`);
        }
      }

      // Also deactivate any orphan topic items associated with this recording
      await tx.topicItems.updateMany({
        where: {
          tenantId,
          metadata: {
            path: ['recordingId'],
            equals: recordingId,
          },
          status: TopicItemStatusType.PUBLISHED,
        },
        data: {
          status: TopicItemStatusType.DRAFT,
          isActive: false,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

      // 2. Update AiGeneratedContent
      const auditLog: ContentAuditLogEntry[] = Array.isArray(currentOutput.auditLog)
        ? [...currentOutput.auditLog]
        : [];

      auditLog.push({
        action: 'CONTENT_UNPUBLISHED',
        actorId: userId,
        actorRole: roleCode,
        timestamp: unpublishedAt,
        version: content.version,
        details: dto?.reason || 'Faculty unpublished study notes',
      });

      const updatedLifecycle: ContentLifecycleMetadata = {
        ...currentLifecycle,
        state: newState,
        unpublishedAt,
        unpublishedBy: userId,
      };

      // 2. Transactional Outbox for Notion Archival
      const tenantSettings = await tx.tenantSettings.findFirst({
        where: { tenantId, deletedAt: null },
      });
      const branding = (tenantSettings?.brandingConfig as Record<string, any>) || {};
      const defaultNotionKey = (
        process.env.NOTION_DEFAULT_API_KEY ||
        process.env.NOTION_API_KEY ||
        ''
      ).trim();
      const defaultNotionParentId = (
        process.env.NOTION_DEFAULT_PARENT_PAGE_ID ||
        process.env.NOTION_PARENT_PAGE_ID ||
        ''
      ).trim();
      const isPlatformDefaultNotion = Boolean(defaultNotionKey && defaultNotionParentId);

      const isNotionActive = Boolean(
        (branding.notionIntegration?.isActive && branding.notionIntegration?.apiKeyEncrypted) ||
        isPlatformDefaultNotion,
      );

      let unpublishJobId: string | null = null;
      let notionSyncMeta: NotionContentSyncMetadata;

      const currentSync: NotionContentSyncMetadata = currentOutput.notionSync || {
        syncStatus: 'NOT_CONNECTED',
        attemptCount: 0,
      };

      if (isNotionActive && currentSync.notionPageId) {
        // Cancel any pending sync jobs for this content
        await tx.backgroundJobs.updateMany({
          where: {
            tenantId,
            jobType: 'NOTION_SYNC',
            status: BackgroundJobStatusEnum.PENDING,
            payload: {
              path: ['contentId'],
              equals: content.id,
            },
            deletedAt: null,
          },
          data: {
            status: BackgroundJobStatusEnum.COMPLETED,
            deletedAt: new Date(),
            deletedBy: userId,
          },
        });

        // Insert durable UNPUBLISH job in the same database transaction
        const job = await tx.backgroundJobs.create({
          data: {
            tenantId,
            jobType: 'NOTION_SYNC',
            status: BackgroundJobStatusEnum.PENDING,
            priority: 2,
            scheduledRunAt: new Date(),
            payload: {
              recordingId,
              contentId: content.id,
              version: content.version,
              action: 'UNPUBLISH',
              enqueuedAt: unpublishedAt,
              triggeredBy: userId,
            },
            createdBy: userId,
            updatedBy: userId,
          },
        });
        unpublishJobId = job.id;

        notionSyncMeta = {
          ...currentSync,
          syncStatus: 'PENDING',
          lastAttemptAt: unpublishedAt,
        };
      } else {
        notionSyncMeta = {
          ...currentSync,
          syncStatus: 'UNPUBLISHED',
          lastAttemptAt: unpublishedAt,
        };
      }

      const updatedOutput: Record<string, any> = {
        ...currentOutput,
        lifecycle: updatedLifecycle,
        notionSync: notionSyncMeta,
        auditLog,
      };

      const updatedContent = await tx.aiGeneratedContent.update({
        where: { id: content.id },
        data: {
          isPublished: false, // Immediately revokes student visibility
          generatedOutput: updatedOutput as unknown as Prisma.InputJsonValue,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

      return { updatedContent, updatedOutput, updatedLifecycle, unpublishJobId };
    });

    this.logger.log(
      `Unpublished study notes for recording ${recordingId} (user: ${userId}, reason: ${dto?.reason || 'None'})`,
    );

    // Trigger immediate async execution of the transactional Notion unpublish job
    if (result.unpublishJobId) {
      setImmediate(() => {
        this.notionSyncWorker.processJob(result.unpublishJobId!).catch((notionErr: any) => {
          this.logger.warn(`Error in immediate Notion unpublish for job ${result.unpublishJobId}: ${notionErr?.message}`);
        });
      });
    }

    return {
      recordingId,
      isPublished: false,
      version: result.updatedContent.version,
      generatedAt: (result.updatedOutput.completedAt as string) || content.createdAt.toISOString(),
      updatedAt: result.updatedContent.updatedAt.toISOString(),
      lifecycle: result.updatedLifecycle,
      curriculum: result.updatedOutput.curriculum,
      videoMetadata: result.updatedOutput.videoMetadata,
      notes: result.updatedOutput.notes as RecordedClassStudyNotes,
      publishedSnapshot: (result.updatedOutput.publishedSnapshot as RecordedClassStudyNotes) || null,
      notionSync: result.updatedOutput.notionSync || null,
    };
  }

  // ─── 6. Version History & Audit Trail ────────────────────────────────────

  async getVersionHistory(
    tenantId: string,
    recordingId: string,
    userId: string,
    roleCode: string,
  ): Promise<StudyNotesVersionHistoryResponseDto> {
    await this.assertTutorOrAdmin(tenantId, recordingId, userId, roleCode);

    const content = await this.prisma.aiGeneratedContent.findFirst({
      where: {
        tenantId,
        referenceEntityType: 'LiveClassRecordings',
        referenceEntityId: recordingId,
        deletedAt: null,
      },
    });

    if (!content) {
      throw new NotFoundException('No study notes found for this recording');
    }

    const output = (content.generatedOutput as Record<string, any>) || {};
    const lifecycle: ContentLifecycleMetadata = output.lifecycle || {
      state: 'AI_GENERATED',
      currentVersion: content.version || 1,
    };

    const versions: ContentVersionSnapshot[] = Array.isArray(output.versions)
      ? output.versions
      : [
          {
            version: 1,
            state: 'AI_GENERATED',
            notes: output.notes,
            createdAt: content.createdAt.toISOString(),
            createdBy: content.createdBy,
            changeSummary: 'Initial AI Generated Study Notes',
          },
        ];

    const auditLog: ContentAuditLogEntry[] = Array.isArray(output.auditLog)
      ? output.auditLog
      : [];

    return {
      recordingId,
      currentVersion: content.version || 1,
      publishedVersion: lifecycle.publishedVersion ?? null,
      versions,
      auditLog,
    };
  }

  // ─── 7. Student Content Access (Enrolled Batches & Published Snapshot) ────

  async getStudentNotes(
    tenantId: string,
    recordingId: string,
    userId: string,
    roleCode: string,
  ): Promise<StudentStudyNotesResponseDto> {
    const scope = this.recordingsService.classifyRole(roleCode);

    // 1. Validate recording exists in tenant
    const rec = await this.prisma.liveClassRecordings.findFirst({
      where: { id: recordingId, tenantId, deletedAt: null },
    });
    if (!rec) {
      throw new NotFoundException('Recording not found');
    }

    // 2. Strict Student Batch Enrollment Verification
    if (scope === 'student' && rec.liveClassId) {
      const studentBatchIds = await this.recordingsService.resolveStudentBatchIds(
        tenantId,
        userId,
      );
      const studentAdmissionId = await this.recordingsService.resolveStudentAdmissionId(
        tenantId,
        userId,
      );

      const liveClass = await this.prisma.liveClasses.findUnique({
        where: { id: rec.liveClassId },
      });

      if (!liveClass) {
        throw new NotFoundException('Associated class could not be found');
      }

      // Check batch enrollment
      if (studentBatchIds.length > 0 && !studentBatchIds.includes(liveClass.batchId)) {
        throw new ForbiddenException(
          'You are not enrolled in the batch authorized to view this class',
        );
      }

      // Check 1:1 privacy restriction
      let isUnauthorizedOneToOne = false;
      const notesStr = liveClass.teacherNotes || liveClass.description;
      if (notesStr) {
        try {
          const meta = JSON.parse(notesStr);
          if (
            meta?.sessionType === 'ONE_TO_ONE' &&
            meta?.studentAdmissionId &&
            meta.studentAdmissionId !== studentAdmissionId
          ) {
            isUnauthorizedOneToOne = true;
          }
        } catch {
          // ignore non-json notes
        }
      }
      if (isUnauthorizedOneToOne) {
        throw new ForbiddenException(
          'You do not have permission to access this private recording',
        );
      }
    }

    // 3. Retrieve Content Container
    const content = await this.prisma.aiGeneratedContent.findFirst({
      where: {
        tenantId,
        referenceEntityType: 'LiveClassRecordings',
        referenceEntityId: recordingId,
        deletedAt: null,
      },
    });

    if (!content) {
      throw new NotFoundException('Study notes have not been published for this recording yet');
    }

    const output = (content.generatedOutput as Record<string, any>) || {};
    const lifecycle: ContentLifecycleMetadata = output.lifecycle || {
      state: content.isPublished ? 'PUBLISHED' : 'AI_GENERATED',
      currentVersion: content.version || 1,
    };

    // Strict Rule: Students can NEVER view drafts, unapproved notes, or unpublished content
    const isPublic =
      content.isPublished && (lifecycle.state === 'PUBLISHED' || !!lifecycle.publishedVersion);
    if (!isPublic && scope === 'student') {
      throw new ForbiddenException('Study notes have not been published for this recording yet');
    }

    // Return the immutable published snapshot (isolated from any active tutor draft revisions)
    const notesToServe = (output.publishedSnapshot as RecordedClassStudyNotes) || output.notes;
    if (!notesToServe) {
      throw new NotFoundException('Study notes content is not ready');
    }

    // Strip internal quality diagnostics and faculty-only metadata for students
    const cleanNotes = {
      lecture: notesToServe.lecture,
      transcript: notesToServe.transcript,
      topics: notesToServe.topics,
      definitions: notesToServe.definitions,
      formulaCheatSheet: notesToServe.formulaCheatSheet,
      importantConcepts: notesToServe.importantConcepts,
      workedExamples: notesToServe.workedExamples,
      neetExamPoints: notesToServe.neetExamPoints,
      lectureConclusion: notesToServe.lectureConclusion,
    };

    const notionSync = output.notionSync;
    const notionPageUrl =
      notionSync?.syncStatus === 'SYNCED' && notionSync?.notionPageUrl
        ? (notionSync.notionPageUrl as string)
        : null;

    return {
      recordingId,
      title: notesToServe.lecture?.title || 'NEET Study Notes',
      version: lifecycle.publishedVersion || content.version || 1,
      publishedAt: lifecycle.publishedAt || content.updatedAt.toISOString(),
      curriculum: output.curriculum,
      notes: cleanNotes as RecordedClassStudyNotes,
      notionPageUrl,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async assertTutorOrAdmin(
    tenantId: string,
    recordingId: string,
    userId: string,
    roleCode: string,
  ): Promise<{ rec: any; scope: 'admin' | 'tutor' }> {
    const scope = this.recordingsService.classifyRole(roleCode);

    if (scope === 'student') {
      throw new ForbiddenException(
        'Students are not authorized to review, edit, approve, or publish study notes',
      );
    }

    const rec = await this.prisma.liveClassRecordings.findFirst({
      where: { id: recordingId, tenantId, deletedAt: null },
    });
    if (!rec) {
      throw new NotFoundException('Recording not found');
    }

    if (scope === 'tutor') {
      if (rec.liveClassId) {
        const taughtClassIds = await this.recordingsService.resolveTaughtClassIds(
          tenantId,
          userId,
        );
        const liveClass = await this.prisma.liveClasses.findUnique({
          where: { id: rec.liveClassId },
          select: { createdBy: true },
        });
        if (
          !taughtClassIds.includes(rec.liveClassId) &&
          rec.createdBy !== userId &&
          liveClass?.createdBy !== userId
        ) {
          throw new ForbiddenException(
            'You can only review and manage study notes for recordings of classes you teach or uploaded',
          );
        }
      } else if (rec.createdBy !== userId) {
        throw new ForbiddenException(
          'You can only review and manage study notes for recordings you uploaded',
        );
      }
    }

    return { rec, scope };
  }

  /**
   * Synchronizes approved study notes into the existing curriculum TopicItems table.
   * Ensures idempotency: updates existing item or creates one without duplicates.
   */
  private async syncTopicItem(
    tx: Prisma.TransactionClient,
    tenantId: string,
    recording: any,
    liveClass: any,
    notes: RecordedClassStudyNotes,
    version: number,
    userId: string,
    existingTopicItemId?: string | null,
  ): Promise<string> {
    const topicId = liveClass.topicId;
    const itemTitle = `Study Notes: ${liveClass.title || notes.lecture.title}`;
    const description = notes.lecture.overview?.slice(0, 500) || null;
    const htmlContent = this.renderNotesToHtml(notes);

    let existing: any = null;

    // 1. Direct lookup by registered topicItemId if present
    if (existingTopicItemId) {
      existing = await tx.topicItems.findFirst({
        where: {
          id: existingTopicItemId,
          tenantId,
          topicId,
          deletedAt: null,
        },
      });
    }

    // 2. Fallback: Search by recording metadata
    if (!existing) {
      existing = await tx.topicItems.findFirst({
        where: {
          tenantId,
          topicId,
          deletedAt: null,
          metadata: {
            path: ['recordingId'],
            equals: recording.id,
          },
        },
      });
    }

    const itemMetadata = {
      source: 'RECORDED_CLASS_AI_NOTES',
      recordingId: recording.id,
      liveClassId: liveClass.id,
      version,
      publishedAt: new Date().toISOString(),
    };

    const itemContent = {
      blockType: 'TEXT',
      html: htmlContent,
      structuredNotes: notes,
    };

    if (existing) {
      const updated = await tx.topicItems.update({
        where: { id: existing.id },
        data: {
          title: itemTitle,
          description,
          content: itemContent as unknown as Prisma.InputJsonValue,
          metadata: itemMetadata as unknown as Prisma.InputJsonValue,
          status: TopicItemStatusType.PUBLISHED,
          isActive: true,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });
      return updated.id;
    }

    // Calculate next display order
    const maxOrder = await tx.topicItems.findFirst({
      where: { tenantId, topicId, deletedAt: null },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    const nextOrder = (maxOrder?.displayOrder ?? 0) + 1;

    const created = await tx.topicItems.create({
      data: {
        tenantId,
        topicId,
        type: TopicItemType.TEXT,
        title: itemTitle,
        description,
        content: itemContent as unknown as Prisma.InputJsonValue,
        metadata: itemMetadata as unknown as Prisma.InputJsonValue,
        status: TopicItemStatusType.PUBLISHED,
        displayOrder: nextOrder,
        durationMins: Math.ceil((notes.lecture.durationSeconds || 1800) / 60),
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return created.id;
  }

  /**
   * Converts structured study notes into formatted HTML compatible with the StudentPreview renderer.
   */
  renderNotesToHtml(notes: RecordedClassStudyNotes): string {
    const sections: string[] = [];

    // 1. Overview
    if (notes.lecture?.overview) {
      sections.push(`
        <div class="notes-section overview-section">
          <h3>Lecture Overview</h3>
          <p>${this.escapeHtml(notes.lecture.overview)}</p>
        </div>
      `);
    }

    // 2. Learning Objectives
    if (notes.lecture?.learningObjectives?.length) {
      const lis = notes.lecture.learningObjectives
        .map((obj) => `<li>${this.escapeHtml(obj)}</li>`)
        .join('');
      sections.push(`
        <div class="notes-section objectives-section">
          <h4>Core Learning Objectives</h4>
          <ul>${lis}</ul>
        </div>
      `);
    }

    // 3. Topics
    if (notes.topics?.length) {
      const topicsHtml = notes.topics
        .map(
          (t, i) => `
          <div class="topic-block" style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.75rem;">
            <h4 style="color: #0B2447; margin-bottom: 0.25rem;">${i + 1}. ${this.escapeHtml(t.title)}</h4>
            <span style="font-size: 0.75rem; color: #64748b; font-family: monospace;">Timeline: ${this.escapeHtml(t.timestampLabel || 'Video')}</span>
            <p style="margin-top: 0.5rem; line-height: 1.6;">${this.escapeHtml(t.explanation || (t as any).summary || '')}</p>
          </div>
        `,
        )
        .join('');
      sections.push(`
        <div class="notes-section topics-section">
          <h3>Detailed Topic Explanations</h3>
          ${topicsHtml}
        </div>
      `);
    }

    // 4. Important Concepts
    if (notes.importantConcepts?.length) {
      const conceptsHtml = notes.importantConcepts
        .map(
          (c) => `
          <div style="margin-bottom: 0.75rem; padding: 0.75rem; background: #f8fafc; border-left: 3px solid #0052CC; border-radius: 0.375rem;">
            <strong style="color: #0B2447;">${this.escapeHtml(c.title)}</strong>
            <span style="font-size: 0.75rem; color: #64748b; margin-left: 0.5rem;">[${this.escapeHtml(c.category)}]</span>
            <p style="margin-top: 0.25rem; font-size: 0.9rem; line-height: 1.5;">${this.escapeHtml(c.explanation)}</p>
            ${c.neetRelevance ? `<em style="font-size: 0.8rem; color: #b45309;">NEET Relevance: ${this.escapeHtml(c.neetRelevance)}</em>` : ''}
          </div>
        `,
        )
        .join('');
      sections.push(`
        <div class="notes-section concepts-section">
          <h3>High-Yield Concepts</h3>
          ${conceptsHtml}
        </div>
      `);
    }

    // 5. Definitions
    if (notes.definitions?.length) {
      const defsHtml = notes.definitions
        .map(
          (d) => `
          <div style="margin-bottom: 0.75rem;">
            <strong style="color: #0052CC;">${this.escapeHtml(d.term)}:</strong>
            <span>${this.escapeHtml(d.definition)}</span>
            ${d.explanation ? `<br/><em style="color: #64748b; font-size: 0.85rem;">${this.escapeHtml(d.explanation)}</em>` : ''}
          </div>
        `,
        )
        .join('');
      sections.push(`
        <div class="notes-section definitions-section">
          <h3>Scientific Definitions & Terms</h3>
          ${defsHtml}
        </div>
      `);
    }

    // 6. Formulas
    if (notes.formulaCheatSheet?.length) {
      const formulasHtml = notes.formulaCheatSheet
        .map(
          (f) => `
          <div style="margin-bottom: 1rem; padding: 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem;">
            <strong>${this.escapeHtml(f.name)}</strong>
            <pre style="background: #0f172a; color: #34d399; padding: 0.5rem; border-radius: 0.25rem; font-family: monospace; overflow-x: auto;">${this.escapeHtml(f.expression)}</pre>
            <span style="font-size: 0.85rem; color: #475569;">${this.escapeHtml(f.variableExplanations)}</span>
            ${f.siUnits ? `<br/><span style="font-size: 0.75rem; color: #64748b;">SI Unit: ${this.escapeHtml(f.siUnits)}</span>` : ''}
            ${f.conditions ? `<br/><em style="font-size: 0.75rem; color: #b45309;">Condition: ${this.escapeHtml(f.conditions)}</em>` : ''}
          </div>
        `,
        )
        .join('');
      sections.push(`
        <div class="notes-section formulas-section">
          <h3>Formula Cheat Sheet</h3>
          ${formulasHtml}
        </div>
      `);
    }

    // 7. Worked Examples
    if (notes.workedExamples?.length) {
      const examplesHtml = notes.workedExamples
        .map(
          (ex, idx) => `
          <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; background: #ffffff;">
            <h5 style="color: #0B2447; margin-bottom: 0.5rem;">Example ${idx + 1}: ${this.escapeHtml(ex.problem)}</h5>
            ${
              ex.stepByStepExplanation?.length
                ? `<ol style="margin-left: 1.25rem; line-height: 1.6;">${ex.stepByStepExplanation.map((s) => `<li>${this.escapeHtml(s)}</li>`).join('')}</ol>`
                : ''
            }
            ${ex.finalResult ? `<div style="margin-top: 0.5rem; padding: 0.5rem; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 0.25rem; color: #065f46; font-weight: bold;">Final Result: ${this.escapeHtml(ex.finalResult)}</div>` : ''}
          </div>
        `,
        )
        .join('');
      sections.push(`
        <div class="notes-section examples-section">
          <h3>Worked Examples & Problem Solutions</h3>
          ${examplesHtml}
        </div>
      `);
    }

    // 8. NEET Exam Points
    if (notes.neetExamPoints?.length) {
      const pointsHtml = notes.neetExamPoints
        .map(
          (p) => `
          <li style="margin-bottom: 0.5rem;">
            <strong style="color: #b45309;">[${this.escapeHtml(p.relevance || 'HIGH_YIELD')}]:</strong>
            ${this.escapeHtml(p.point)}
            ${p.potentialQuestionAngle ? `<br/><span style="font-size: 0.85rem; color: #64748b;">MCQ Angle: ${this.escapeHtml(p.potentialQuestionAngle)}</span>` : ''}
          </li>
        `,
        )
        .join('');
      sections.push(`
        <div class="notes-section neet-points-section">
          <h3>NEET High-Yield Exam Points</h3>
          <ul>${pointsHtml}</ul>
        </div>
      `);
    }

    // 9. Conclusion & Checklist
    if (notes.lectureConclusion?.summary || notes.lectureConclusion?.revisionChecklist?.length) {
      const checklistHtml = (notes.lectureConclusion.revisionChecklist || [])
        .map((c) => `<li>${this.escapeHtml(c)}</li>`)
        .join('');
      sections.push(`
        <div class="notes-section conclusion-section">
          <h3>Summary & Revision Checklist</h3>
          <p>${this.escapeHtml(notes.lectureConclusion.summary || '')}</p>
          ${checklistHtml ? `<ul>${checklistHtml}</ul>` : ''}
        </div>
      `);
    }

    return sections.join('\n');
  }

  private escapeHtml(str?: string | null): string {
    if (!str) return '';
    return String(str)
      .replace(/\0/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
