import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BackgroundJobStatusEnum, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { SupabaseStorageService } from '../../storage/supabase-storage.service';
import { LiveRecordingsService } from './live-recordings.service';
import { GeminiProviderService } from '../../learning/services/gemini-provider.service';
import { RecordedClassNotesService } from './recorded-class-notes.service';
import { AnalyzeRecordingResponseDto } from '../dto/analyze-recording-response.dto';
import { RecordingAnalysisStatusResponseDto } from '../dto/recording-analysis-status-response.dto';
import { RecordingStudyNotesResponseDto } from '../dto/recording-study-notes-response.dto';
import { RecordedClassStudyNotes } from '../types/recorded-class-ai.types';

export const RECORDED_CLASS_AI_JOB_TYPE = 'RECORDED_CLASS_AI_ANALYSIS';
const MAX_EXECUTION_ATTEMPTS = 3;
const STALE_RUNNING_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes (with 30s heartbeats, safe crash threshold)
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds periodic heartbeat

@Injectable()
export class RecordedClassAiWorkerService {
  private readonly logger = new Logger(RecordedClassAiWorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly storage: SupabaseStorageService,
    private readonly configService: ConfigService,
    private readonly recordingsService: LiveRecordingsService,
    private readonly geminiProvider: GeminiProviderService,
    private readonly notesService: RecordedClassNotesService,
  ) {}

  // ─── Enqueue Analysis Job (HTTP 202 Entrypoint) ──────────────────────────

  async enqueueAnalysisJob(
    tenantId: string,
    recordingId: string,
    userId: string,
    roleCode: string,
  ): Promise<AnalyzeRecordingResponseDto> {
    const scope = this.recordingsService.classifyRole(roleCode);

    // 1. Validate recording exists and belongs to the caller tenant
    const rec = await this.prisma.liveClassRecordings.findFirst({
      where: { id: recordingId, tenantId, deletedAt: null },
    });
    if (!rec) {
      throw new NotFoundException('Recording not found');
    }

    // 2. Validate recording processing readiness
    const isReady = rec.status === 'READY' || rec.status === 'COMPLETED';
    if (!isReady) {
      throw new BadRequestException(
        `Recording is not ready for analysis (current status: ${rec.status}). Only READY recordings can be analyzed.`,
      );
    }

    if (!rec.storageObjectId && !rec.rawEgressUrl) {
      throw new BadRequestException(
        'Recording has no storage object reference or streaming URL available.',
      );
    }

    // 3. Role-specific authorization
    if (scope === 'student') {
      let liveClass: any = null;
      if (rec.liveClassId) {
        liveClass = await this.prisma.liveClasses.findUnique({
          where: { id: rec.liveClassId },
        });
      }
      await this.recordingsService.assertCanView(scope, tenantId, userId, rec, liveClass);
    } else if (scope === 'tutor') {
      if (rec.liveClassId) {
        const taughtClassIds = await this.recordingsService.resolveTaughtClassIds(
          tenantId,
          userId,
        );
        if (!taughtClassIds.includes(rec.liveClassId)) {
          throw new ForbiddenException(
            'You can only trigger AI analysis for recordings of classes you teach',
          );
        }
      } else if (rec.createdBy !== userId) {
        throw new ForbiddenException(
          'You can only trigger AI analysis for recordings you uploaded',
        );
      }
    }

    // 5. Duplicate request prevention (Idempotency)
    const existingActiveJob = await this.findJobForRecording(
      tenantId,
      recordingId,
      [BackgroundJobStatusEnum.PENDING, BackgroundJobStatusEnum.RUNNING],
    );

    if (existingActiveJob) {
      this.logger.log(
        `Active analysis job already exists for recording ${recordingId}: Job ${existingActiveJob.id} (${existingActiveJob.status})`,
      );
      return {
        jobId: existingActiveJob.id,
        recordingId,
        status: existingActiveJob.status,
        message: 'Analysis job is already active and currently being processed',
        createdAt: existingActiveJob.createdAt.toISOString(),
        estimatedDurationSeconds: this.estimateProcessingTime(rec.durationSeconds),
      };
    }

    // 6. Create persistent background job in PENDING state
    const job = await this.prisma.backgroundJobs.create({
      data: {
        tenantId,
        jobType: RECORDED_CLASS_AI_JOB_TYPE,
        status: BackgroundJobStatusEnum.PENDING,
        priority: 3,
        payload: {
          recordingId,
          requestedBy: userId,
          requestedRole: roleCode,
          liveClassId: rec.liveClassId,
          storageObjectId: rec.storageObjectId,
          rawEgressUrl: rec.rawEgressUrl,
          durationSeconds: rec.durationSeconds,
        },
        createdBy: userId,
        updatedBy: userId,
      },
    });

    this.logger.log(
      `Created persistent AI analysis job ${job.id} for recording ${recordingId} (tenant: ${tenantId})`,
    );

    // 7. Non-blocking asynchronous worker dispatch
    setImmediate(() => {
      this.processJob(job.id).catch((err) => {
        this.logger.error(
          `Background error processing job ${job.id}: ${err instanceof Error ? err.message : err}`,
          err instanceof Error ? err.stack : undefined,
        );
      });
    });

    return {
      jobId: job.id,
      recordingId,
      status: job.status,
      message: 'Recording AI analysis job accepted and queued for background processing',
      createdAt: job.createdAt.toISOString(),
      estimatedDurationSeconds: this.estimateProcessingTime(rec.durationSeconds),
    };
  }

  // ─── Asynchronous Job Processor ──────────────────────────────────────────

  async processJob(jobId: string): Promise<void> {
    // 1. Fetch job definition from DB to obtain duration for dynamic lock TTL
    const jobRecord = await this.prisma.backgroundJobs.findUnique({
      where: { id: jobId },
    });

    if (!jobRecord || jobRecord.status !== BackgroundJobStatusEnum.PENDING) {
      return;
    }

    const payload = (jobRecord.payload as Record<string, any>) || {};
    const durationSeconds = Number(payload.durationSeconds) || 0;

    // Dynamic lock TTL: base 30 minutes (1800s), plus video length + 600s buffer, capped at 2 hours
    const lockTtlSeconds = Math.min(7200, Math.max(1800, durationSeconds + 600));
    const lockKey = `lock:recorded_class_ai:${jobId}`;
    const lockToken = `${jobId}:${randomUUID()}`;

    // 2. Distributed Lock with Unique Token
    const acquired = await this.acquireLock(lockKey, lockToken, lockTtlSeconds);
    if (!acquired) {
      this.logger.warn(`Could not acquire distributed lock for job ${jobId}. Skipping execution.`);
      return;
    }

    const startTime = Date.now();
    let executionId: string | null = null;
    let heartbeatTimer: NodeJS.Timeout | null = null;

    try {
      // 3. Atomic Database State Transition (guarantees exactly-once execution across instances)
      // Normal worker claiming MUST ONLY transition PENDING → RUNNING.
      // Never allow a worker to claim an already RUNNING job through the normal claim path.
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
        this.logger.warn(`Job ${jobId} was already claimed or is no longer PENDING. Aborting.`);
        return;
      }

      // Active Heartbeat: Periodically touch updatedAt in DB and extend Redis lock
      // Guarantees long-running Gemini video analysis is never prematurely marked as stale or reclaimed.
      heartbeatTimer = setInterval(async () => {
        try {
          await this.prisma.backgroundJobs.updateMany({
            where: {
              id: jobId,
              status: BackgroundJobStatusEnum.RUNNING,
            },
            data: {
              updatedAt: new Date(),
            },
          });
          await this.extendLock(lockKey, lockToken, lockTtlSeconds);
        } catch (hbErr) {
          this.logger.warn(`Heartbeat update failed for job ${jobId}: ${hbErr}`);
        }
      }, HEARTBEAT_INTERVAL_MS);
      heartbeatTimer.unref();

      // 4. Track execution attempt in JobExecutions
      const previousAttempts = await this.prisma.jobExecutions.count({
        where: { backgroundJobId: jobRecord.id, tenantId: jobRecord.tenantId },
      });
      const currentAttemptNumber = previousAttempts + 1;

      const execution = await this.prisma.jobExecutions.create({
        data: {
          tenantId: jobRecord.tenantId,
          backgroundJobId: jobRecord.id,
          attemptNumber: currentAttemptNumber,
          status: 'RUNNING',
          startedAt: new Date(),
          completedAt: new Date(), // updated upon completion
          executionDurationMs: 0,
          memoryPeakBytes: BigInt(process.memoryUsage().heapUsed),
          errorMessage: '',
          createdBy: jobRecord.createdBy,
          updatedBy: jobRecord.updatedBy,
        },
      });
      executionId = execution.id;

      const recordingId = payload.recordingId as string;

      // 5. Retrieve recording record
      const rec = await this.prisma.liveClassRecordings.findFirst({
        where: { id: recordingId, tenantId: jobRecord.tenantId, deletedAt: null },
      });
      if (!rec) {
        throw new Error(`Recording ${recordingId} no longer exists or was removed`);
      }

      // 6. Safe video retrieval via read-only signed URL (Zero RAM buffer)
      let videoSignedUrl: string | null = null;
      if (rec.storageObjectId) {
        try {
          videoSignedUrl = await this.storage.createBucketSignedUrl({
            bucketName: this.recordingsService.getRecordingsBucket(),
            path: rec.storageObjectId,
            expiresInSeconds: 7200,
          });
        } catch (storageErr) {
          this.logger.warn(
            `Signed URL generation from Supabase failed for ${rec.storageObjectId}: ${storageErr}`,
          );
        }
      }

      if (!videoSignedUrl && rec.rawEgressUrl && rec.rawEgressUrl.startsWith('http')) {
        videoSignedUrl = rec.rawEgressUrl;
      }

      if (!videoSignedUrl && !rec.storageObjectId) {
        throw new Error(
          'Unable to acquire accessible video stream or storage pointer for recording',
        );
      }

      // 7. Fetch Curriculum Grounding Metadata
      let liveClassData: any = null;
      let displayContext: any = null;

      if (rec.liveClassId) {
        liveClassData = await this.prisma.liveClasses.findUnique({
          where: { id: rec.liveClassId },
        });

        if (liveClassData) {
          const displayMap = await this.recordingsService.resolveDisplay([liveClassData]);
          displayContext = displayMap[liveClassData.id] ?? null;
        }
      }

      // 8. Construct Curriculum Context
      const curriculumContext = {
        classTitle: liveClassData?.title ?? 'Recorded Lecture',
        description: liveClassData?.description ?? null,
        teacherNotes: liveClassData?.teacherNotes ?? null,
        courseName: displayContext?.courseName ?? null,
        subjectName: displayContext?.subjectName ?? null,
        chapterName: displayContext?.chapterName ?? null,
        topicName: displayContext?.topicName ?? rec.subtitleObjectId ?? null,
        batchName: displayContext?.batchName ?? null,
        tutorName: displayContext?.tutorName ?? null,
      };

      // 9. Update progress helper
      const updateProgress = async (stage: string, progressPercentage: number) => {
        try {
          const currentJob = await this.prisma.backgroundJobs.findUnique({
            where: { id: jobId },
            select: { payload: true },
          });
          const currentPayload = (currentJob?.payload as Record<string, any>) || {};
          await this.prisma.backgroundJobs.update({
            where: { id: jobId },
            data: {
              payload: {
                ...currentPayload,
                stage,
                progressPercentage,
                lastProgressAt: new Date().toISOString(),
              },
              updatedAt: new Date(),
            },
          });
        } catch (progressErr) {
          this.logger.warn(`Could not update progress for job ${jobId}: ${progressErr}`);
        }
      };

      // 10. Execute Gemini Multimodal Video Analysis
      await updateProgress('FETCHING_VIDEO', 15);

      const generatedStudyNotes = await this.geminiProvider.analyzeRecordedClassVideo({
        videoSignedUrl: videoSignedUrl!,
        durationSeconds: rec.durationSeconds ?? undefined,
        curriculumContext,
        onProgress: async (stage: string, pct: number) => {
          await updateProgress(stage, pct);
        },
      });

      await updateProgress('SAVING_CONTENT', 95);

      // 11. Auto-publish study notes directly to students & Notion without requiring manual tutor approval
      await this.notesService.autoPublishGeneratedNotes(
        jobRecord.tenantId,
        rec.id,
        jobRecord.createdBy || 'SYSTEM_AUTO',
        generatedStudyNotes,
        curriculumContext,
        {
          storageObjectId: rec.storageObjectId,
          hasSignedUrl: Boolean(videoSignedUrl),
          durationSeconds: rec.durationSeconds,
          resolution: rec.resolution,
          bitrateKbps: rec.bitrateKbps,
          fileSizeBytes: rec.fileSizeBytes ? rec.fileSizeBytes.toString() : null,
        },
        jobRecord.id,
        executionId || '',
      );

      // 12. Update LiveClassRecordings completion timestamps
      // ONLY now that study notes are generated, validated, and persisted!
      await this.prisma.liveClassRecordings.update({
        where: { id: rec.id },
        data: {
          aiSummaryCompletedAt: new Date(),
          transcriptCompletedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // 13. Mark Job & Execution as COMPLETED
      const durationMs = Date.now() - startTime;
      if (executionId) {
        await this.prisma.jobExecutions.update({
          where: { id: executionId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            executionDurationMs: durationMs,
            memoryPeakBytes: BigInt(process.memoryUsage().heapUsed),
            updatedAt: new Date(),
            updatedBy: jobRecord.createdBy,
          },
        });
      }

      const finalJob = await this.prisma.backgroundJobs.findUnique({
        where: { id: jobId },
        select: { payload: true },
      });
      const finalPayload = (finalJob?.payload as Record<string, any>) || {};

      await this.prisma.backgroundJobs.update({
        where: { id: jobId },
        data: {
          status: BackgroundJobStatusEnum.COMPLETED,
          payload: {
            ...finalPayload,
            stage: 'COMPLETED',
            progressPercentage: 100,
          },
          updatedAt: new Date(),
          updatedBy: jobRecord.createdBy,
        },
      });

      this.logger.log(
        `Recorded Class AI Analysis Job ${jobId} and study notes completed successfully in ${durationMs}ms`,
      );
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);

      this.logger.error(
        `Recorded Class AI Analysis Job ${jobId} failed after ${durationMs}ms: ${errorMessage}`,
        err instanceof Error ? err.stack : undefined,
      );

      if (executionId && jobRecord) {
        try {
          await this.prisma.jobExecutions.update({
            where: { id: executionId },
            data: {
              status: 'FAILED',
              completedAt: new Date(),
              executionDurationMs: durationMs,
              errorMessage: errorMessage.substring(0, 1000),
              memoryPeakBytes: BigInt(process.memoryUsage().heapUsed),
              updatedAt: new Date(),
              updatedBy: jobRecord.createdBy,
            },
          });
        } catch {
          // Best effort failure status tracking
        }
      }

      if (jobRecord) {
        try {
          await this.prisma.backgroundJobs.update({
            where: { id: jobId },
            data: {
              status: BackgroundJobStatusEnum.FAILED,
              updatedAt: new Date(),
              updatedBy: jobRecord.createdBy,
            },
          });
        } catch {
          // Best effort failure status tracking
        }
      }
    } finally {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      // Safe Compare-and-Delete: only release if our token still holds the lock
      await this.releaseLock(lockKey, lockToken);
    }
  }

  // ─── Query Job Status ────────────────────────────────────────────────────

  async getJobStatus(
    tenantId: string,
    recordingId: string,
    userId: string,
    roleCode: string,
  ): Promise<RecordingAnalysisStatusResponseDto> {
    const scope = this.recordingsService.classifyRole(roleCode);

    // 1. Validate recording exists and user has view permission
    const rec = await this.prisma.liveClassRecordings.findFirst({
      where: { id: recordingId, tenantId, deletedAt: null },
    });
    if (!rec) {
      throw new NotFoundException('Recording not found');
    }

    if (scope === 'tutor' && rec.liveClassId) {
      const taughtClassIds = await this.recordingsService.resolveTaughtClassIds(
        tenantId,
        userId,
      );
      if (!taughtClassIds.includes(rec.liveClassId) && rec.createdBy !== userId) {
        throw new ForbiddenException('You do not have access to this recording');
      }
    } else if (scope === 'student' && rec.liveClassId) {
      const batchIds = await this.recordingsService.resolveStudentBatchIds(
        tenantId,
        userId,
      );
      const liveClass = await this.prisma.liveClasses.findUnique({
        where: { id: rec.liveClassId },
      });
      if (liveClass && !batchIds.includes(liveClass.batchId) && batchIds.length === 0) {
        throw new ForbiddenException('You do not have access to this recording');
      }
    }

    // 2. Retrieve latest background job
    const job = await this.findJobForRecording(tenantId, recordingId);

    if (!job) {
      return {
        jobId: null,
        recordingId,
        status: 'IDLE',
        attemptNumber: 0,
        progressPercentage: 0,
        currentStep: 'No AI analysis has been requested for this recording yet',
        error: null,
        createdAt: null,
        updatedAt: null,
        completedAt: null,
        executionDurationMs: null,
        hasContent: false,
        isStaged: false,
      };
    }

    // 3. Retrieve latest execution and content container
    const [execution, content] = await Promise.all([
      this.prisma.jobExecutions.findFirst({
        where: { backgroundJobId: job.id, tenantId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.aiGeneratedContent.findFirst({
        where: {
          tenantId,
          referenceEntityType: 'LiveClassRecordings',
          referenceEntityId: recordingId,
          deletedAt: null,
        },
      }),
    ]);

    const jobPayload = (job.payload as Record<string, any>) || {};
    let progressPercentage = 0;
    let currentStep = 'Job queued and awaiting worker execution';

    switch (job.status) {
      case BackgroundJobStatusEnum.PENDING:
        progressPercentage = 10;
        currentStep = 'Queued in background queue';
        break;
      case BackgroundJobStatusEnum.RUNNING:
        progressPercentage = jobPayload.progressPercentage ?? 50;
        if (jobPayload.stage) {
          switch (jobPayload.stage) {
            case 'FETCHING_VIDEO':
              currentStep = 'Retrieving video stream from storage';
              break;
            case 'UPLOADING_TO_GEMINI':
              currentStep = 'Uploading video to Gemini Multimodal Files API';
              break;
            case 'WAITING_FOR_GEMINI':
              currentStep = 'Waiting for Gemini video processing (ACTIVE state)';
              break;
            case 'ANALYZING_LECTURE':
              currentStep = 'Gemini multimodal analysis and lecture transcription in progress';
              break;
            case 'VALIDATING_CONTENT':
              currentStep = 'Validating pedagogical study notes structure and accuracy';
              break;
            case 'SAVING_CONTENT':
              currentStep = 'Persisting study notes to database';
              break;
            default:
              currentStep = `Analysis in progress: ${jobPayload.stage.replace(/_/g, ' ')}`;
          }
        } else {
          currentStep = 'Processing video source and multimodal AI analysis';
        }
        break;
      case BackgroundJobStatusEnum.COMPLETED:
        progressPercentage = 100;
        currentStep = 'AI lecture analysis and study notes generation completed';
        break;
      case BackgroundJobStatusEnum.FAILED:
        progressPercentage = 0;
        currentStep = 'Analysis failed';
        break;
    }

    // hasContent indicates whether actual generated lecture notes/study material exist.
    const output = (content?.generatedOutput as Record<string, any>) || {};
    const hasRealNotes = Boolean(
      content &&
      output.status === 'COMPLETED' &&
      output.notes &&
      (Array.isArray(output.notes.topics) ? output.notes.topics.length > 0 : true),
    );
    const isStaged = Boolean(
      content && output.status === 'STAGED_FOR_ANALYSIS',
    );

    return {
      jobId: job.id,
      recordingId,
      status: job.status,
      attemptNumber: execution?.attemptNumber ?? 1,
      progressPercentage,
      currentStep,
      error: execution?.errorMessage || null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      completedAt:
        execution?.completedAt && job.status === BackgroundJobStatusEnum.COMPLETED
          ? execution.completedAt.toISOString()
          : null,
      executionDurationMs: execution?.executionDurationMs ?? null,
      hasContent: hasRealNotes,
      isStaged,
    };
  }

  // ─── Query Generated Study Notes (Phase 2) ─────────────────────────────────

  async getGeneratedNotes(
    tenantId: string,
    recordingId: string,
    userId: string,
    roleCode: string,
  ): Promise<RecordingStudyNotesResponseDto> {
    const scope = this.recordingsService.classifyRole(roleCode);

    // 1. Role enforcement: Students cannot view unpublished study notes
    if (scope === 'student') {
      throw new ForbiddenException(
        'Students are not authorized to access unpublished study notes',
      );
    }

    // 2. Validate recording exists and belongs to the caller tenant
    const rec = await this.prisma.liveClassRecordings.findFirst({
      where: { id: recordingId, tenantId, deletedAt: null },
    });
    if (!rec) {
      throw new NotFoundException('Recording not found');
    }

    // 3. Tutor-specific authorization: must teach the class or be original creator
    if (scope === 'tutor') {
      if (rec.liveClassId) {
        const taughtClassIds = await this.recordingsService.resolveTaughtClassIds(
          tenantId,
          userId,
        );
        if (!taughtClassIds.includes(rec.liveClassId) && rec.createdBy !== userId) {
          throw new ForbiddenException(
            'You can only view study notes for recordings of classes you teach',
          );
        }
      } else if (rec.createdBy !== userId) {
        throw new ForbiddenException(
          'You can only view study notes for recordings you uploaded',
        );
      }
    }

    // 4. Retrieve generated content from database
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
      throw new NotFoundException(
        'Study notes have not been generated for this recording yet',
      );
    }

    const output = (content.generatedOutput as Record<string, any>) || {};
    if (output.status !== 'COMPLETED' || !output.notes) {
      throw new NotFoundException(
        'Study notes are currently in progress or staging and have not completed yet',
      );
    }

    return {
      recordingId,
      isPublished: content.isPublished,
      version: content.version || 1,
      generatedAt: (output.completedAt as string) || content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString(),
      lifecycle: output.lifecycle,
      curriculum: output.curriculum,
      videoMetadata: output.videoMetadata,
      notes: output.notes as RecordedClassStudyNotes,
      publishedSnapshot: output.publishedSnapshot || null,
    };
  }

  // ─── Resilient Cron Sweep for Missed, Orphaned, or Stuck Jobs ─────────────

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handlePendingJobsSweep(): Promise<void> {
    try {
      // 1. Recover pending jobs that were not dispatched (e.g. Server restart immediately after job creation)
      const stalePendingThreshold = new Date(Date.now() - 30000); // older than 30s
      const pendingJobs = await this.prisma.backgroundJobs.findMany({
        where: {
          jobType: RECORDED_CLASS_AI_JOB_TYPE,
          status: BackgroundJobStatusEnum.PENDING,
          createdAt: { lte: stalePendingThreshold },
          deletedAt: null,
        },
        take: 10,
        orderBy: { createdAt: 'asc' },
      });

      for (const job of pendingJobs) {
        this.logger.log(`Cron sweep picked up pending analysis job ${job.id}`);
        this.processJob(job.id).catch((err) => {
          this.logger.error(
            `Cron processing error for job ${job.id}: ${err instanceof Error ? err.message : err}`,
          );
        });
      }

      // 2. Crash Recovery: Detect and recover jobs stuck in RUNNING due to worker process crash
      const staleRunningThreshold = new Date(Date.now() - STALE_RUNNING_THRESHOLD_MS);
      const stuckRunningJobs = await this.prisma.backgroundJobs.findMany({
        where: {
          jobType: RECORDED_CLASS_AI_JOB_TYPE,
          status: BackgroundJobStatusEnum.RUNNING,
          updatedAt: { lte: staleRunningThreshold },
          deletedAt: null,
        },
        take: 5,
        orderBy: { updatedAt: 'asc' },
      });

      for (const job of stuckRunningJobs) {
        this.logger.warn(
          `Detected stuck RUNNING job ${job.id} (last updated ${job.updatedAt.toISOString()}). Initiating recovery.`,
        );
        await this.recoverStuckJob(job, staleRunningThreshold);
      }

      // 3. Disk Hygiene: Clean up orphaned lecture temp files older than 2 hours from previous hard crashes
      await this.cleanupOrphanedTempFiles();
    } catch (err) {
      this.logger.error(
        `Error during background jobs cron sweep: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  /**
   * Recovers a job stuck in RUNNING due to process crash, OOM, or restart.
   * Atomically transitions only if the job is STILL in RUNNING and updatedAt <= staleRunningThreshold.
   * This guarantees that if multiple recovery workers run concurrently, exactly ONE reclaims the job.
   */
  async recoverStuckJob(job: any, staleRunningThreshold?: Date): Promise<void> {
    const threshold =
      staleRunningThreshold ?? new Date(Date.now() - STALE_RUNNING_THRESHOLD_MS);
    const lockKey = `lock:recorded_class_ai:${job.id}`;

    // Query prior execution attempts
    const lastExecution = await this.prisma.jobExecutions.findFirst({
      where: { backgroundJobId: job.id, tenantId: job.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    const attemptNumber = lastExecution?.attemptNumber ?? 1;

    if (attemptNumber < MAX_EXECUTION_ATTEMPTS) {
      // Critical Requirement:
      // Stale RUNNING recovery must use an atomic conditional update with the stale timestamp condition.
      // Ensure only ONE recovery worker can reclaim a stale job.
      const reclaimResult = await this.prisma.backgroundJobs.updateMany({
        where: {
          id: job.id,
          status: BackgroundJobStatusEnum.RUNNING,
          updatedAt: { lte: threshold },
        },
        data: {
          status: BackgroundJobStatusEnum.PENDING,
          updatedAt: new Date(),
        },
      });

      if (reclaimResult.count === 0) {
        // Another recovery worker already reclaimed or updated this stale job
        this.logger.warn(
          `Stale job ${job.id} was already reclaimed by another recovery worker. Skipping.`,
        );
        return;
      }

      // Mark prior execution as FAILED due to crash
      if (lastExecution && lastExecution.status === 'RUNNING') {
        try {
          await this.prisma.jobExecutions.update({
            where: { id: lastExecution.id },
            data: {
              status: 'FAILED',
              completedAt: new Date(),
              errorMessage:
                'Worker process terminated unexpectedly; job recovered by system sweep',
              updatedAt: new Date(),
            },
          });
        } catch {}
      }

      // Force release any lingering Redis lock left by crashed worker
      if (this.redis.isAvailable() && this.redis.client) {
        try {
          await this.redis.del(lockKey);
        } catch {}
      }

      this.logger.log(
        `Re-queueing job ${job.id} for retry attempt ${attemptNumber + 1}`,
      );
      this.processJob(job.id).catch(() => {});
    } else {
      // Exceeded max attempts: Atomic conditional update with stale condition to FAILED
      const failResult = await this.prisma.backgroundJobs.updateMany({
        where: {
          id: job.id,
          status: BackgroundJobStatusEnum.RUNNING,
          updatedAt: { lte: threshold },
        },
        data: {
          status: BackgroundJobStatusEnum.FAILED,
          updatedAt: new Date(),
        },
      });

      if (failResult.count === 0) {
        return;
      }

      if (lastExecution && lastExecution.status === 'RUNNING') {
        try {
          await this.prisma.jobExecutions.update({
            where: { id: lastExecution.id },
            data: {
              status: 'FAILED',
              completedAt: new Date(),
              errorMessage: 'Max retry attempts exceeded after worker crash',
              updatedAt: new Date(),
            },
          });
        } catch {}
      }

      if (this.redis.isAvailable() && this.redis.client) {
        try {
          await this.redis.del(lockKey);
        } catch {}
      }

      this.logger.error(
        `Job ${job.id} exceeded maximum retry attempts (${MAX_EXECUTION_ATTEMPTS}). Marked as FAILED.`,
      );
    }
  }

  // ─── Internal Helpers ─────────────────────────────────────────────────────

  private async findJobForRecording(
    tenantId: string,
    recordingId: string,
    statuses?: BackgroundJobStatusEnum[],
  ): Promise<any | null> {
    const where: Prisma.BackgroundJobsWhereInput = {
      tenantId,
      jobType: RECORDED_CLASS_AI_JOB_TYPE,
      deletedAt: null,
    };
    if (statuses && statuses.length > 0) {
      where.status = { in: statuses };
    }

    // Try PostgreSQL native JSON path query first
    try {
      const match = await this.prisma.backgroundJobs.findFirst({
        where: {
          ...where,
          payload: {
            path: ['recordingId'],
            equals: recordingId,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (match) return match;
    } catch {
      // In mock/test environments where JSON path operators are not mocked
    }

    // Fallback: Scan recent jobs in tenant for matching payload
    const recentJobs = await this.prisma.backgroundJobs.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return (
      recentJobs.find((j) => {
        const payload = j.payload as Record<string, any> | null;
        return payload?.recordingId === recordingId;
      }) ?? null
    );
  }

  /**
   * Acquires Redis distributed lock with unique owner token and specified TTL.
   */
  private async acquireLock(
    key: string,
    token: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (this.redis.isAvailable() && this.redis.client) {
      try {
        const res = await this.redis.client.set(key, token, 'EX', ttlSeconds, 'NX');
        return res === 'OK';
      } catch (e) {
        this.logger.warn(`Redis lock acquire failed: ${e}, proceeding with db-level atomic claim`);
      }
    }
    return true;
  }

  /**
   * Safely releases distributed lock only if the current caller still owns it (Lua compare-and-delete).
   * Prevents deleting a lock acquired by another worker after expiry.
   */
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
        const res = await this.redis.client.eval(script, 1, key, token);
        return res === 1;
      } catch (e) {
        this.logger.warn(`Redis safe lock release failed: ${e}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Safely extends distributed lock TTL only if the caller still owns it (Lua compare-and-expire).
   */
  private async extendLock(
    key: string,
    token: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (this.redis.isAvailable() && this.redis.client) {
      try {
        const script = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("expire", KEYS[1], ARGV[2])
          else
            return 0
          end
        `;
        const res = await this.redis.client.eval(script, 1, key, token, ttlSeconds);
        return res === 1;
      } catch (e) {
        this.logger.warn(`Redis lock extend failed: ${e}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Cleans up orphaned lecture temp files left behind by unexpected crashes or restarts.
   */
  private async cleanupOrphanedTempFiles(): Promise<void> {
    try {
      const tempDir = process.env.TEMP_STORAGE_DIR || os.tmpdir();
      if (!fs.existsSync(tempDir)) return;
      const entries = await fs.promises.readdir(tempDir);
      const twoHoursAgo = Date.now() - 2 * 3600 * 1000;
      for (const entry of entries) {
        if (entry.startsWith('neet-lecture-') && entry.endsWith('.mp4')) {
          const fullPath = path.join(tempDir, entry);
          try {
            const stat = await fs.promises.stat(fullPath);
            if (stat.mtimeMs < twoHoursAgo) {
              await fs.promises.unlink(fullPath);
              this.logger.log(`Cleaned up orphaned lecture temp file: ${entry}`);
            }
          } catch {
            // Ignore concurrent unlinks or access errors
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Orphaned temp file cleanup error: ${err}`);
    }
  }

  private estimateProcessingTime(durationSeconds?: number): number {
    if (!durationSeconds || durationSeconds <= 0) return 60;
    // Estimated at ~1 second of processing per 1 minute of video + 30s baseline
    return Math.max(30, Math.ceil(durationSeconds / 60) + 30);
  }
}
