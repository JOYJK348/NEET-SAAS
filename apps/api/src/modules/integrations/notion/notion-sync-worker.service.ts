import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BackgroundJobStatusEnum, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { NotionClientService } from './notion-client.service';
import { NotionBlockBuilderService } from './notion-block-builder.service';
import { NotionIntegrationService } from './notion-integration.service';
import {
  NotionContentSyncMetadata,
  NotionSyncStatus,
  NotionSyncStatusResponseDto,
} from './notion.types';
import {
  RecordedClassStudyNotes,
  ContentLifecycleMetadata,
} from '../../live/types/recorded-class-ai.types';

export const NOTION_SYNC_JOB_TYPE = 'NOTION_SYNC';
const MAX_NOTION_SYNC_ATTEMPTS = 3;
const NOTION_LOCK_TTL_SECONDS = 300; // 5 minutes
const STALE_NOTION_JOB_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class NotionSyncWorkerService {
  private readonly logger = new Logger(NotionSyncWorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notionClient: NotionClientService,
    private readonly blockBuilder: NotionBlockBuilderService,
    private readonly integrationService: NotionIntegrationService,
  ) {}

  // ─── 1. Durable Job Enqueueing ──────────────────────────────────────────

  /**
   * Enqueues an asynchronous Notion sync or unpublish job.
   * Completely decoupled from the calling thread and database transaction.
   */
  async enqueueSyncJob(
    tenantId: string,
    recordingId: string,
    contentId: string,
    version: number,
    action: 'PUBLISH' | 'UNPUBLISH',
    userId: string,
  ): Promise<any> {
    // 1. Mark AiGeneratedContent as PENDING sync
    try {
      const content = await this.prisma.aiGeneratedContent.findUnique({
        where: { id: contentId },
      });

      if (content) {
        const output = (content.generatedOutput as Record<string, any>) || {};
        const existingSync: NotionContentSyncMetadata = output.notionSync || {
          syncStatus: 'NOT_CONNECTED',
          attemptCount: 0,
        };

        const updatedSync: NotionContentSyncMetadata = {
          ...existingSync,
          syncStatus: 'PENDING',
          lastAttemptAt: new Date().toISOString(),
          attemptCount: existingSync.attemptCount || 0,
        };

        await this.prisma.aiGeneratedContent.update({
          where: { id: contentId },
          data: {
            generatedOutput: {
              ...output,
              notionSync: updatedSync,
            } as unknown as Prisma.InputJsonValue,
          },
        });
      }
    } catch (err: any) {
      this.logger.warn(`Could not update initial notionSync status on content ${contentId}: ${err.message}`);
    }

    // 2. Persist durable BackgroundJobs record
    const job = await this.prisma.backgroundJobs.create({
      data: {
        tenantId,
        jobType: NOTION_SYNC_JOB_TYPE,
        status: BackgroundJobStatusEnum.PENDING,
        priority: 3,
        scheduledRunAt: new Date(),
        payload: {
          recordingId,
          contentId,
          version,
          action,
          enqueuedAt: new Date().toISOString(),
          triggeredBy: userId,
        },
        createdBy: userId,
        updatedBy: userId,
      },
    });

    this.logger.log(
      `Enqueued Notion sync job ${job.id} for recording ${recordingId} (action: ${action}, version: ${version})`,
    );

    // 3. Trigger immediate async processing in background
    setImmediate(() => {
      this.processJob(job.id).catch((err) => {
        this.logger.error(`Error in background Notion sync execution for job ${job.id}: ${err.message}`);
      });
    });

    return job;
  }

  // ─── 2. Scheduled Cron & Stale Recovery ──────────────────────────────────

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processPendingJobs(): Promise<void> {
    try {
      // 1. Recover stale RUNNING jobs
      const staleThreshold = new Date(Date.now() - STALE_NOTION_JOB_THRESHOLD_MS);
      const staleJobs = await this.prisma.backgroundJobs.findMany({
        where: {
          jobType: NOTION_SYNC_JOB_TYPE,
          status: BackgroundJobStatusEnum.RUNNING,
          updatedAt: { lte: staleThreshold },
          deletedAt: null,
        },
        take: 5,
      });

      for (const stale of staleJobs) {
        this.logger.warn(`Recovering stale Notion sync job ${stale.id}...`);
        await this.prisma.backgroundJobs.updateMany({
          where: {
            id: stale.id,
            status: BackgroundJobStatusEnum.RUNNING,
            updatedAt: { lte: staleThreshold },
          },
          data: {
            status: BackgroundJobStatusEnum.PENDING,
            updatedAt: new Date(),
          },
        });
      }

      // 2. Claim next available PENDING jobs
      const pendingJobs = await this.prisma.backgroundJobs.findMany({
        where: {
          jobType: NOTION_SYNC_JOB_TYPE,
          status: BackgroundJobStatusEnum.PENDING,
          scheduledRunAt: { lte: new Date() },
          deletedAt: null,
        },
        orderBy: [{ priority: 'asc' }, { scheduledRunAt: 'asc' }],
        take: 5,
      });

      for (const job of pendingJobs) {
        this.processJob(job.id).catch((err) => {
          this.logger.error(`Failed to process Notion sync job ${job.id}: ${err.message}`);
        });
      }
    } catch (err: any) {
      this.logger.error(`Error in NotionSyncWorkerService cron poll: ${err.message}`);
    }
  }

  // ─── 3. Atomic Job Processor ─────────────────────────────────────────────

  async processJob(jobId: string): Promise<void> {
    const jobRecord = await this.prisma.backgroundJobs.findUnique({
      where: { id: jobId },
    });

    if (!jobRecord || jobRecord.status !== BackgroundJobStatusEnum.PENDING) {
      return;
    }

    const payload = jobRecord.payload as Record<string, any>;
    const { tenantId, id } = jobRecord;
    const { recordingId, contentId, version, action } = payload;

    const lockKey = `lock:notion-sync:${tenantId}:${contentId}`;
    const lockToken = `${jobId}:${randomUUID()}`;

    // 1. Acquire Redis Distributed Lock
    const acquired = await this.acquireLock(lockKey, lockToken, NOTION_LOCK_TTL_SECONDS);
    if (!acquired) {
      this.logger.warn(`Could not acquire Redis lock ${lockKey}. Skipping job ${jobId} this cycle.`);
      return;
    }

    let executionId: string | null = null;
    const startTime = Date.now();

    try {
      // 2. Atomic DB transition: PENDING -> RUNNING
      const claimResult = await this.prisma.backgroundJobs.updateMany({
        where: {
          id: jobId,
          status: BackgroundJobStatusEnum.PENDING,
        },
        data: {
          status: BackgroundJobStatusEnum.RUNNING,
          updatedAt: new Date(),
        },
      });

      if (claimResult.count === 0) {
        this.logger.warn(`Job ${jobId} was already claimed concurrently. Exiting.`);
        return;
      }

      // 3. Track in JobExecutions
      const previousAttempts = await this.prisma.jobExecutions.count({
        where: { backgroundJobId: jobId, tenantId },
      });
      const currentAttemptNumber = previousAttempts + 1;

      const execution = await this.prisma.jobExecutions.create({
        data: {
          tenantId,
          backgroundJobId: jobId,
          attemptNumber: currentAttemptNumber,
          status: 'RUNNING',
          startedAt: new Date(),
          completedAt: new Date(),
          executionDurationMs: 0,
          memoryPeakBytes: BigInt(process.memoryUsage().heapUsed),
          errorMessage: '',
          createdBy: jobRecord.createdBy,
          updatedBy: jobRecord.updatedBy,
        },
      });
      executionId = execution.id;

      // 4. Retrieve AiGeneratedContent
      const content = await this.prisma.aiGeneratedContent.findFirst({
        where: {
          id: contentId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!content) {
        this.logger.warn(`Content ${contentId} not found or deleted. Discarding Notion sync job.`);
        await this.completeJob(jobId, executionId, startTime, 'Content no longer exists');
        return;
      }

      const output = (content.generatedOutput as Record<string, any>) || {};
      const currentSync: NotionContentSyncMetadata = output.notionSync || {
        syncStatus: 'NOT_CONNECTED',
        attemptCount: 0,
      };
      const lifecycle = output.lifecycle as ContentLifecycleMetadata | undefined;
      const currentPublishedVersion = lifecycle?.publishedVersion;

      // 5. Monotonic & Exact Published-Version Guard
      if (action === 'PUBLISH') {
        // A. Is content currently in a published state?
        if (!content.isPublished || lifecycle?.state !== 'PUBLISHED' || !currentPublishedVersion) {
          this.logger.log(`Content ${contentId} is not in PUBLISHED state. Skipping Notion publish.`);
          await this.completeJob(jobId, executionId, startTime, 'Skipped: Content not in PUBLISHED state');
          return;
        }

        // B. Exact version equality: Queued version MUST match current published version exactly
        if (version !== currentPublishedVersion) {
          this.logger.log(
            `Job version ${version} does not match current published version ${currentPublishedVersion} on content ${contentId}. Discarding outdated/invalid job.`,
          );
          await this.completeJob(
            jobId,
            executionId,
            startTime,
            `Skipped: Version mismatch (job: ${version}, published: ${currentPublishedVersion})`,
          );
          return;
        }

        // C. Redundant sync check: If this exact version is already SYNCED, skip
        if (currentSync.syncedVersion === version && currentSync.syncStatus === 'SYNCED') {
          this.logger.log(
            `Content ${contentId} version ${version} has already been synchronized to Notion. Skipping redundant sync.`,
          );
          await this.completeJob(jobId, executionId, startTime, 'Skipped: Already synced');
          return;
        }
      } else if (action === 'UNPUBLISH') {
        // For UNPUBLISH: If content has already been re-published in the meantime, discard unpublish
        if (content.isPublished && lifecycle?.state === 'PUBLISHED') {
          this.logger.log(
            `Content ${contentId} has already been re-published (v${currentPublishedVersion}). Discarding stale UNPUBLISH job.`,
          );
          await this.completeJob(jobId, executionId, startTime, 'Skipped: Content re-published');
          return;
        }
      }

      // 6. Check Tenant Notion Configuration
      const config = await this.integrationService.getConfig(tenantId);
      if (!config || !config.isActive) {
        this.logger.log(`Tenant ${tenantId} does not have an active Notion integration. Marking NOT_CONNECTED.`);
        const updatedSync: NotionContentSyncMetadata = {
          ...currentSync,
          syncStatus: 'NOT_CONNECTED',
          lastAttemptAt: new Date().toISOString(),
        };

        await this.prisma.aiGeneratedContent.update({
          where: { id: contentId },
          data: {
            generatedOutput: {
              ...output,
              notionSync: updatedSync,
            } as unknown as Prisma.InputJsonValue,
          },
        });

        await this.completeJob(jobId, executionId, startTime, 'Notion integration not configured for tenant');
        return;
      }

      // 7. Execute Synchronization against Notion API
      if (action === 'PUBLISH') {
        // STRICT: Read ONLY the immutable published snapshot! Never fall back to mutable draft notes.
        const notesToSync: RecordedClassStudyNotes = output.publishedSnapshot;
        if (!notesToSync) {
          throw new Error(
            `Corrupted state: Content ${contentId} is marked PUBLISHED but publishedSnapshot is missing`,
          );
        }

        const blocks = this.blockBuilder.buildStudyNotesBlocks(notesToSync, {
          recordingId,
          version,
          curriculum: output.curriculum,
        });

        let targetPageId = currentSync.notionPageId;
        let targetPageUrl = currentSync.notionPageUrl;

        if (targetPageId) {
          // Idempotent re-sync: Page already exists in Notion
          this.logger.log(`Updating existing Notion page ${targetPageId} for content ${contentId}...`);
          // Ensure page is unarchived if previously unpublished
          await this.notionClient.unarchivePage(config.apiKey, targetPageId).catch(() => {});
          // Replace content blocks
          await this.notionClient.replacePageContent(config.apiKey, targetPageId, blocks);
        } else {
          // First-time sync: Create brand new page under parent destination
          const topicName = notesToSync.metadata?.topicName || 'Class Lecture';
          const pageTitle = `${notesToSync.lecture?.title || 'NEET Study Notes'} - ${topicName}`;
          const initialBlocks = blocks.slice(0, 100);
          const remainingBlocks = blocks.slice(100);

          this.logger.log(`Creating new Notion page under parent ${config.destinationParentPageId}...`);
          const createdPage = await this.notionClient.createPage(
            config.apiKey,
            config.destinationParentPageId,
            pageTitle,
            initialBlocks,
          );

          targetPageId = createdPage.id;
          targetPageUrl = createdPage.url;

          // CRITICAL RELIABILITY FIX: Immediately persist targetPageId so any subsequent retry
          // will call replacePageContent instead of creating duplicate pages!
          await this.prisma.aiGeneratedContent.update({
            where: { id: contentId },
            data: {
              generatedOutput: {
                ...output,
                notionSync: {
                  ...currentSync,
                  syncStatus: 'SYNCING',
                  notionPageId: targetPageId,
                  notionPageUrl: targetPageUrl,
                  lastAttemptAt: new Date().toISOString(),
                },
              } as unknown as Prisma.InputJsonValue,
            },
          });

          if (remainingBlocks.length > 0) {
            await this.notionClient.appendBlockChildren(config.apiKey, targetPageId, remainingBlocks);
          }
        }

        // 8. Update PostgreSQL metadata with SYNCED status
        const auditLog = Array.isArray(output.auditLog) ? [...output.auditLog] : [];
        auditLog.push({
          action: 'NOTION_SYNC_SUCCESS',
          actorId: payload.triggeredBy || 'SYSTEM',
          actorRole: 'SYSTEM',
          timestamp: new Date().toISOString(),
          version,
          details: `Synchronized study notes version ${version} to Notion page ${targetPageId}`,
        });

        const updatedSync: NotionContentSyncMetadata = {
          syncStatus: 'SYNCED',
          notionPageId: targetPageId,
          notionPageUrl: targetPageUrl,
          notionParentPageId: config.destinationParentPageId,
          syncedVersion: version,
          lastSyncedAt: new Date().toISOString(),
          lastAttemptAt: new Date().toISOString(),
          attemptCount: currentAttemptNumber,
          lastErrorCode: null,
          lastErrorMessage: null,
        };

        await this.prisma.aiGeneratedContent.update({
          where: { id: contentId },
          data: {
            generatedOutput: {
              ...output,
              notionSync: updatedSync,
              auditLog,
            } as unknown as Prisma.InputJsonValue,
          },
        });

        this.logger.log(`Successfully synchronized content ${contentId} (v${version}) to Notion page ${targetPageId}`);
      } else if (action === 'UNPUBLISH') {
        // Unpublish action: soft-delete / archive page in Notion
        if (currentSync.notionPageId) {
          try {
            await this.notionClient.archivePage(config.apiKey, currentSync.notionPageId);
          } catch (archErr: any) {
            this.logger.warn(`Failed to archive Notion page ${currentSync.notionPageId}: ${archErr.message}`);
          }
        }

        const auditLog = Array.isArray(output.auditLog) ? [...output.auditLog] : [];
        auditLog.push({
          action: 'NOTION_UNPUBLISH_SUCCESS',
          actorId: payload.triggeredBy || 'SYSTEM',
          actorRole: 'SYSTEM',
          timestamp: new Date().toISOString(),
          version,
          details: `Archived Notion page ${currentSync.notionPageId || 'N/A'} due to study notes unpublishing`,
        });

        const updatedSync: NotionContentSyncMetadata = {
          ...currentSync,
          syncStatus: 'UNPUBLISHED',
          lastSyncedAt: new Date().toISOString(),
          lastAttemptAt: new Date().toISOString(),
        };

        await this.prisma.aiGeneratedContent.update({
          where: { id: contentId },
          data: {
            generatedOutput: {
              ...output,
              notionSync: updatedSync,
              auditLog,
            } as unknown as Prisma.InputJsonValue,
          },
        });

        this.logger.log(`Archived Notion page ${currentSync.notionPageId} for unpublished recording ${recordingId}`);
      }

      // Mark Job and Execution as COMPLETED
      await this.completeJob(jobId, executionId, startTime);
    } catch (err: any) {
      this.logger.error(`Error processing Notion sync job ${jobId}: ${err.message}`, err.stack);
      await this.handleJobFailure(jobRecord, executionId, err, startTime);
    } finally {
      await this.releaseLock(lockKey, lockToken);
    }
  }

  // ─── 4. Query & Manual Retry Status Handlers ─────────────────────────────

  async getSyncStatus(
    tenantId: string,
    recordingId: string,
  ): Promise<NotionSyncStatusResponseDto> {
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
    const sync: NotionContentSyncMetadata = output.notionSync || {
      syncStatus: 'NOT_CONNECTED',
      attemptCount: 0,
    };

    const isPublished = content.isPublished;
    const lifecycle = output.lifecycle as ContentLifecycleMetadata | undefined;
    const publishedVersion = lifecycle?.publishedVersion;
    const canRetry = isPublished && (sync.syncStatus === 'FAILED' || sync.syncStatus === 'NOT_CONNECTED');

    return {
      recordingId,
      contentId: content.id,
      syncStatus: sync.syncStatus,
      notionPageId: sync.notionPageId || null,
      notionPageUrl: sync.notionPageUrl || null,
      syncedVersion: sync.syncedVersion ?? null,
      currentPublishedVersion: isPublished && publishedVersion ? publishedVersion : null,
      lastSyncedAt: sync.lastSyncedAt || null,
      lastAttemptAt: sync.lastAttemptAt || null,
      attemptCount: sync.attemptCount || 0,
      canRetry,
      errorMessage: sync.lastErrorMessage || null,
    };
  }

  async retrySync(
    tenantId: string,
    recordingId: string,
    userId: string,
  ): Promise<NotionSyncStatusResponseDto> {
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
    const lifecycle = output.lifecycle as ContentLifecycleMetadata | undefined;
    const publishedVersion = lifecycle?.publishedVersion;

    if (!content.isPublished || lifecycle?.state !== 'PUBLISHED' || !publishedVersion) {
      throw new BadRequestException('Cannot sync: Study notes are not currently published.');
    }

    await this.enqueueSyncJob(
      tenantId,
      recordingId,
      content.id,
      publishedVersion,
      'PUBLISH',
      userId,
    );

    return this.getSyncStatus(tenantId, recordingId);
  }

  // ─── 5. Failure & Retry Management ───────────────────────────────────────

  private async handleJobFailure(
    job: any,
    executionId: string | null,
    error: any,
    startTime: number,
  ): Promise<void> {
    const durationMs = Date.now() - startTime;
    const errorMsg = error?.message || 'Unknown Notion synchronization error';

    const previousAttempts = await this.prisma.jobExecutions.count({
      where: { backgroundJobId: job.id, tenantId: job.tenantId },
    });

    if (executionId) {
      try {
        await this.prisma.jobExecutions.update({
          where: { id: executionId },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            executionDurationMs: durationMs,
            errorMessage: errorMsg,
            updatedAt: new Date(),
          },
        });
      } catch {}
    }

    const payload = job.payload as Record<string, any>;
    const contentId = payload.contentId as string;

    if (previousAttempts < MAX_NOTION_SYNC_ATTEMPTS) {
      const backoffSeconds = Math.pow(2, previousAttempts) * 15;
      const nextRunAt = new Date(Date.now() + backoffSeconds * 1000);

      await this.prisma.backgroundJobs.update({
        where: { id: job.id },
        data: {
          status: BackgroundJobStatusEnum.PENDING,
          scheduledRunAt: nextRunAt,
          updatedAt: new Date(),
        },
      });

      this.logger.warn(
        `Job ${job.id} failed attempt ${previousAttempts}/${MAX_NOTION_SYNC_ATTEMPTS}. Rescheduled in ${backoffSeconds}s. Error: ${errorMsg}`,
      );

      // Update content metadata to RETRYING
      await this.updateContentSyncError(contentId, 'RETRYING', errorMsg, previousAttempts);
    } else {
      await this.prisma.backgroundJobs.update({
        where: { id: job.id },
        data: {
          status: BackgroundJobStatusEnum.FAILED,
          updatedAt: new Date(),
        },
      });

      this.logger.error(
        `Job ${job.id} exceeded maximum retry attempts (${MAX_NOTION_SYNC_ATTEMPTS}). Marked as FAILED.`,
      );

      // Update content metadata to FAILED
      await this.updateContentSyncError(contentId, 'FAILED', errorMsg, previousAttempts);
    }
  }

  private async updateContentSyncError(
    contentId: string,
    status: NotionSyncStatus,
    errorMessage: string,
    attemptCount: number,
  ): Promise<void> {
    try {
      const content = await this.prisma.aiGeneratedContent.findUnique({
        where: { id: contentId },
      });
      if (content) {
        const output = (content.generatedOutput as Record<string, any>) || {};
        const sync: NotionContentSyncMetadata = output.notionSync || {
          syncStatus: 'NOT_CONNECTED',
          attemptCount: 0,
        };

        const updatedSync: NotionContentSyncMetadata = {
          ...sync,
          syncStatus: status,
          lastAttemptAt: new Date().toISOString(),
          attemptCount,
          lastErrorMessage: errorMessage,
        };

        await this.prisma.aiGeneratedContent.update({
          where: { id: contentId },
          data: {
            generatedOutput: {
              ...output,
              notionSync: updatedSync,
            } as unknown as Prisma.InputJsonValue,
          },
        });
      }
    } catch {}
  }

  private async completeJob(
    jobId: string,
    executionId: string | null,
    startTime: number,
    completionNote?: string,
  ): Promise<void> {
    const durationMs = Date.now() - startTime;

    await this.prisma.backgroundJobs.update({
      where: { id: jobId },
      data: {
        status: BackgroundJobStatusEnum.COMPLETED,
        updatedAt: new Date(),
      },
    });

    if (executionId) {
      try {
        await this.prisma.jobExecutions.update({
          where: { id: executionId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            executionDurationMs: durationMs,
            errorMessage: completionNote || '',
            updatedAt: new Date(),
          },
        });
      } catch {}
    }
  }

  // ─── 6. Redis Distributed Locking Helpers ─────────────────────────────────

  private async acquireLock(
    key: string,
    token: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (this.redis.isAvailable() && this.redis.client) {
      try {
        const result = await this.redis.client.set(key, token, 'EX', ttlSeconds, 'NX');
        return result === 'OK';
      } catch (e) {
        this.logger.warn(`Redis lock acquire failed: ${e}, proceeding with db-level atomic claim`);
      }
    }
    return true;
  }

  private async releaseLock(key: string, token: string): Promise<boolean> {
    if (this.redis.isAvailable() && this.redis.client) {
      try {
        const script = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        await this.redis.client.eval(script, 1, key, token);
        return true;
      } catch (e) {
        this.logger.warn(`Redis safe lock release failed: ${e}`);
        return false;
      }
    }
    return true;
  }
}

