import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackgroundJobStatusEnum } from '@prisma/client';
import { RecordedClassAiWorkerService } from './recorded-class-ai-worker.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { SupabaseStorageService } from '../../storage/supabase-storage.service';
import { LiveRecordingsService } from './live-recordings.service';
import { GeminiProviderService } from '../../learning/services/gemini-provider.service';
import { RecordedClassNotesService } from './recorded-class-notes.service';

describe('RecordedClassAiWorkerService (Phase 2 Gemini Video AI Analysis)', () => {
  let service: RecordedClassAiWorkerService;
  let prisma: any;
  let redis: any;
  let storage: any;
  let recordingsService: any;
  let configService: any;
  let geminiProvider: any;
  let notesService: any;

  const mockTenantId = 'tenant-123';
  const mockRecordingId = 'rec-456';
  const mockUserId = 'user-789';

  beforeEach(async () => {
    prisma = {
      liveClassRecordings: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      liveClasses: {
        findUnique: jest.fn(),
      },
      backgroundJobs: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      jobExecutions: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      aiGeneratedContent: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    redis = {
      isAvailable: jest.fn().mockReturnValue(true),
      client: {
        set: jest.fn().mockResolvedValue('OK'),
        eval: jest.fn().mockResolvedValue(1),
      },
      del: jest.fn().mockResolvedValue(1),
    };

    storage = {
      createBucketSignedUrl: jest
        .fn()
        .mockResolvedValue('https://storage.supabase.co/signed/video.mp4'),
    };

    recordingsService = {
      classifyRole: jest.fn(),
      resolveTaughtClassIds: jest.fn(),
      resolveStudentBatchIds: jest.fn(),
      resolveDisplay: jest.fn(),
      assertCanView: jest.fn().mockResolvedValue(undefined),
      getRecordingsBucket: jest.fn().mockReturnValue('live-class-recordings'),
    };

    notesService = {
      autoPublishGeneratedNotes: jest.fn().mockResolvedValue({
        contentId: 'content-1',
        enqueuedNotionJobId: 'notion-job-1',
      }),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-gemini-key';
        return null;
      }),
    };

    geminiProvider = {
      analyzeRecordedClassVideo: jest.fn().mockResolvedValue({
        lecture: {
          title: 'Photosynthesis Fundamentals',
          language: 'English',
          durationSeconds: 1800,
          overview: 'Overview of light and dark reactions in chloroplasts',
          learningObjectives: ['Understand Z-scheme', 'Calvin cycle steps'],
        },
        transcript: {
          segments: [
            {
              startSeconds: 0,
              endSeconds: 120,
              timestampLabel: '00:00 - 02:00',
              speaker: 'Dr. Jane Doe',
              text: 'Welcome students, today we discuss light reaction and photophosphorylation.',
              topicReference: 'Light Reaction',
            },
          ],
        },
        topics: [
          {
            title: 'Light Reaction & Photophosphorylation',
            startSeconds: 0,
            endSeconds: 600,
            timestampLabel: '00:00 - 10:00',
            explanation: 'Detailed explanation of PS-II, PS-I, and ATP synthesis via chemiosmosis.',
            subtopics: ['PS II', 'PS I', 'Z-Scheme'],
            definitions: [
              {
                term: 'Photophosphorylation',
                definition: 'The synthesis of ATP from ADP and inorganic phosphate in the presence of light.',
                explanation: 'Occurs in thylakoid membranes.',
              },
            ],
            concepts: [
              {
                title: 'Water Splitting Complex',
                category: 'HIGH_YIELD',
                explanation: 'Splitting of water is associated with PS II on inner thylakoid side.',
                neetRelevance: 'Direct question on Mn and Cl ion cofactor requirements.',
              },
            ],
            formulas: [],
            examples: [],
            neetExamPoints: [
              {
                point: 'Oxygen evolves from water, not CO2 (proven by Ruben & Kamen using O18 isotope).',
                relevance: 'CRITICAL',
                potentialQuestionAngle: 'Source of oxygen evolved in green plant photosynthesis',
              },
            ],
            confidence: 0.98,
          },
        ],
        definitions: [],
        formulaCheatSheet: [],
        importantConcepts: [],
        workedExamples: [],
        neetExamPoints: [],
        lectureConclusion: {
          summary: 'Covered light reaction, Z-scheme and chemiosmotic hypothesis.',
          revisionChecklist: ['Diagram of Z-scheme', 'ATP synthase F0-F1 direction'],
          homework: ['NCERT Chapter 13 questions 1 to 8'],
        },
        quality: {
          completenessScore: 95,
          uncertainSections: [],
          warnings: [],
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordedClassAiWorkerService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: SupabaseStorageService, useValue: storage },
        { provide: ConfigService, useValue: configService },
        { provide: LiveRecordingsService, useValue: recordingsService },
        { provide: GeminiProviderService, useValue: geminiProvider },
        { provide: RecordedClassNotesService, useValue: notesService },
      ],
    }).compile();

    service = module.get<RecordedClassAiWorkerService>(
      RecordedClassAiWorkerService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── 1. Role & Tenant Security Tests ─────────────────────────────────────

  describe('enqueueAnalysisJob - Security & Isolation', () => {
    it('should reject student requests with ForbiddenException if assertCanView rejects', async () => {
      recordingsService.classifyRole.mockReturnValue('student');
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
        status: 'READY',
        storageObjectId: 'obj-1',
        liveClassId: 'lc-1',
      });
      prisma.liveClasses.findUnique.mockResolvedValue({ id: 'lc-1' });
      recordingsService.assertCanView.mockRejectedValue(new ForbiddenException('Not enrolled'));

      await expect(
        service.enqueueAnalysisJob(
          mockTenantId,
          mockRecordingId,
          mockUserId,
          'STUDENT',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow student requests if assertCanView succeeds', async () => {
      recordingsService.classifyRole.mockReturnValue('student');
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
        status: 'READY',
        storageObjectId: 'obj-1',
        liveClassId: 'lc-1',
        durationSeconds: 120,
      });
      prisma.liveClasses.findUnique.mockResolvedValue({ id: 'lc-1' });
      recordingsService.assertCanView.mockResolvedValue(undefined);
      prisma.backgroundJobs.findMany.mockResolvedValue([]);
      prisma.backgroundJobs.create.mockResolvedValue({
        id: 'job-stu-1',
        status: BackgroundJobStatusEnum.PENDING,
        createdAt: new Date(),
      });

      const res = await service.enqueueAnalysisJob(
        mockTenantId,
        mockRecordingId,
        mockUserId,
        'STUDENT',
      );
      expect(res.jobId).toBe('job-stu-1');
      expect(res.status).toBe(BackgroundJobStatusEnum.PENDING);
    });

    it('should throw NotFoundException if recording does not exist in tenant', async () => {
      recordingsService.classifyRole.mockReturnValue('admin');
      prisma.liveClassRecordings.findFirst.mockResolvedValue(null);

      await expect(
        service.enqueueAnalysisJob(
          mockTenantId,
          mockRecordingId,
          mockUserId,
          'TENANT_ADMIN',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if recording is not READY', async () => {
      recordingsService.classifyRole.mockReturnValue('admin');
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
        status: 'PROCESSING',
        storageObjectId: 'video-123.mp4',
      });

      await expect(
        service.enqueueAnalysisJob(
          mockTenantId,
          mockRecordingId,
          mockUserId,
          'TENANT_ADMIN',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if recording has neither storageObjectId nor rawEgressUrl', async () => {
      recordingsService.classifyRole.mockReturnValue('admin');
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
        status: 'READY',
        storageObjectId: null,
        rawEgressUrl: null,
      });

      await expect(
        service.enqueueAnalysisJob(
          mockTenantId,
          mockRecordingId,
          mockUserId,
          'TENANT_ADMIN',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if tutor does not teach the class', async () => {
      recordingsService.classifyRole.mockReturnValue('tutor');
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
        liveClassId: 'class-999',
        status: 'READY',
        storageObjectId: 'video-123.mp4',
      });
      recordingsService.resolveTaughtClassIds.mockResolvedValue(['class-other']);

      await expect(
        service.enqueueAnalysisJob(
          mockTenantId,
          mockRecordingId,
          mockUserId,
          'TUTOR',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return existing active job if job is already PENDING or RUNNING (Idempotency)', async () => {
      recordingsService.classifyRole.mockReturnValue('admin');
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
        status: 'READY',
        storageObjectId: 'video-123.mp4',
        durationSeconds: 3600,
      });

      const existingJob = {
        id: 'job-existing-1',
        tenantId: mockTenantId,
        status: BackgroundJobStatusEnum.RUNNING,
        createdAt: new Date('2026-11-22T10:00:00Z'),
        payload: { recordingId: mockRecordingId },
      };
      prisma.backgroundJobs.findFirst.mockResolvedValue(existingJob);

      const response = await service.enqueueAnalysisJob(
        mockTenantId,
        mockRecordingId,
        mockUserId,
        'TENANT_ADMIN',
      );

      expect(response).toEqual({
        jobId: 'job-existing-1',
        recordingId: mockRecordingId,
        status: BackgroundJobStatusEnum.RUNNING,
        message: 'Analysis job is already active and currently being processed',
        createdAt: '2026-11-22T10:00:00.000Z',
        estimatedDurationSeconds: expect.any(Number),
      });
      expect(prisma.backgroundJobs.create).not.toHaveBeenCalled();
    });

    it('should successfully enqueue new analysis job for authorized tutor', async () => {
      recordingsService.classifyRole.mockReturnValue('tutor');
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
        liveClassId: 'class-123',
        status: 'READY',
        storageObjectId: 'video-123.mp4',
        durationSeconds: 1800,
      });
      recordingsService.resolveTaughtClassIds.mockResolvedValue(['class-123']);
      prisma.backgroundJobs.findFirst.mockResolvedValue(null);
      prisma.backgroundJobs.findMany.mockResolvedValue([]);

      const createdJob = {
        id: 'job-new-1',
        tenantId: mockTenantId,
        status: BackgroundJobStatusEnum.PENDING,
        createdAt: new Date('2026-11-22T12:00:00Z'),
      };
      prisma.backgroundJobs.create.mockResolvedValue(createdJob);

      const response = await service.enqueueAnalysisJob(
        mockTenantId,
        mockRecordingId,
        mockUserId,
        'TUTOR',
      );

      expect(response.jobId).toBe('job-new-1');
      expect(response.status).toBe(BackgroundJobStatusEnum.PENDING);
      expect(prisma.backgroundJobs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: mockTenantId,
            jobType: 'RECORDED_CLASS_AI_ANALYSIS',
            status: BackgroundJobStatusEnum.PENDING,
          }),
        }),
      );
    });
  });

  // ─── 2. Atomic Claiming & Concurrency Prevention ─────────────────────────

  describe('processJob - Atomic Claiming (PENDING → RUNNING strictly)', () => {
    it('should atomically transition only PENDING → RUNNING', async () => {
      const job = {
        id: 'job-atomic-1',
        tenantId: mockTenantId,
        status: BackgroundJobStatusEnum.PENDING,
        payload: {
          recordingId: mockRecordingId,
          durationSeconds: 1800,
          requestedBy: mockUserId,
        },
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };
      prisma.backgroundJobs.findUnique.mockResolvedValue(job);
      prisma.backgroundJobs.updateMany.mockResolvedValue({ count: 1 });
      prisma.jobExecutions.create.mockResolvedValue({ id: 'exec-1' });

      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
        liveClassId: 'class-1',
        storageObjectId: 'videos/lecture1.mp4',
        durationSeconds: 1800,
      });

      prisma.liveClasses.findUnique.mockResolvedValue({
        id: 'class-1',
        title: 'Photosynthesis Fundamentals',
      });

      recordingsService.resolveDisplay.mockResolvedValue({
        'class-1': {
          courseName: 'NEET Botany',
          subjectName: 'Biology',
          chapterName: 'Plant Physiology',
          topicName: 'Photosynthesis',
          batchName: 'Batch Alpha 2026',
          tutorName: 'Dr. Jane Doe',
        },
      });

      prisma.aiGeneratedContent.findFirst.mockResolvedValue(null);
      prisma.aiGeneratedContent.create.mockResolvedValue({ id: 'content-1' });

      await service.processJob('job-atomic-1');

      // CRITICAL: Must query where status: PENDING strictly!
      expect(prisma.backgroundJobs.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'job-atomic-1',
          status: BackgroundJobStatusEnum.PENDING,
        },
        data: {
          status: BackgroundJobStatusEnum.RUNNING,
          updatedAt: expect.any(Date),
        },
      });

      // Verification: LiveClassRecordings.aiSummaryCompletedAt and transcriptCompletedAt ARE updated upon successful completion
      expect(prisma.liveClassRecordings.update).toHaveBeenCalledWith({
        where: { id: mockRecordingId },
        data: {
          aiSummaryCompletedAt: expect.any(Date),
          transcriptCompletedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });

      // Verification: Gemini multimodal analysis was invoked with video URL and curriculum context
      expect(geminiProvider.analyzeRecordedClassVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          videoSignedUrl: 'https://storage.supabase.co/signed/video.mp4',
          durationSeconds: 1800,
          curriculumContext: expect.objectContaining({
            classTitle: 'Photosynthesis Fundamentals',
            courseName: 'NEET Botany',
            subjectName: 'Biology',
          }),
        }),
      );

      // Lock acquisition uses dynamic TTL (1800 + 600 = 2400s) and unique token
      expect(redis.client.set).toHaveBeenCalledWith(
        'lock:recorded_class_ai:job-atomic-1',
        expect.stringMatching(/^job-atomic-1:/),
        'EX',
        2400,
        'NX',
      );

      // Safe release uses Lua script compare-and-delete
      expect(redis.client.eval).toHaveBeenCalledWith(
        expect.stringContaining('redis.call("get", KEYS[1]) == ARGV[1]'),
        1,
        'lock:recorded_class_ai:job-atomic-1',
        expect.stringMatching(/^job-atomic-1:/),
      );
    });

    it('should NEVER allow a worker to claim an already RUNNING job through the normal claim path', async () => {
      // Job in DB is already RUNNING
      const job = {
        id: 'job-already-running',
        tenantId: mockTenantId,
        status: BackgroundJobStatusEnum.RUNNING,
        payload: { recordingId: mockRecordingId },
      };
      prisma.backgroundJobs.findUnique.mockResolvedValue(job);

      await service.processJob('job-already-running');

      // Normal worker claiming must abort immediately
      expect(prisma.backgroundJobs.updateMany).not.toHaveBeenCalled();
      expect(redis.client.set).not.toHaveBeenCalled();
      expect(prisma.jobExecutions.create).not.toHaveBeenCalled();
    });

    it('should prove through concurrent execution that two workers cannot process the same job simultaneously', async () => {
      const job = {
        id: 'job-race-1',
        tenantId: mockTenantId,
        status: BackgroundJobStatusEnum.PENDING,
        payload: { recordingId: mockRecordingId, durationSeconds: 600 },
      };
      prisma.backgroundJobs.findUnique.mockResolvedValue(job);

      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
        storageObjectId: 'video-race.mp4',
        durationSeconds: 600,
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue(null);
      prisma.aiGeneratedContent.create.mockResolvedValue({ id: 'c-1' });
      prisma.jobExecutions.create.mockResolvedValue({ id: 'exec-race-1' });

      // Worker 1 succeeds with count: 1, Worker 2 gets count: 0 (race won by Worker 1)
      let claimCount = 0;
      prisma.backgroundJobs.updateMany.mockImplementation((args: any) => {
        if (args.where.status === BackgroundJobStatusEnum.PENDING) {
          claimCount++;
          if (claimCount === 1) {
            return Promise.resolve({ count: 1 });
          }
        }
        return Promise.resolve({ count: 0 });
      });

      // Simulate simultaneous execution of two workers
      await Promise.all([
        service.processJob('job-race-1'),
        service.processJob('job-race-1'),
      ]);

      // Exactly ONE worker must have executed and created a JobExecution record
      expect(prisma.jobExecutions.create).toHaveBeenCalledTimes(1);

      // Exactly ONE container auto-publish occurred
      expect(notesService.autoPublishGeneratedNotes).toHaveBeenCalledTimes(1);

      // Both workers safely released their lock tokens
      expect(redis.client.eval).toHaveBeenCalledTimes(2);
    });

    it('should catch error, update JobExecutions and BackgroundJobs to FAILED, and safely release lock', async () => {
      const job = {
        id: 'job-102',
        tenantId: mockTenantId,
        status: BackgroundJobStatusEnum.PENDING,
        payload: { recordingId: mockRecordingId },
        createdBy: mockUserId,
      };
      prisma.backgroundJobs.findUnique.mockResolvedValue(job);
      prisma.jobExecutions.create.mockResolvedValue({ id: 'exec-2' });

      // Force error: recording not found
      prisma.liveClassRecordings.findFirst.mockResolvedValue(null);

      await service.processJob('job-102');

      expect(prisma.jobExecutions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exec-2' },
          data: expect.objectContaining({
            status: 'FAILED',
            errorMessage: expect.stringContaining('no longer exists'),
          }),
        }),
      );

      expect(prisma.backgroundJobs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-102' },
          data: expect.objectContaining({
            status: BackgroundJobStatusEnum.FAILED,
          }),
        }),
      );

      expect(redis.client.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        'lock:recorded_class_ai:job-102',
        expect.any(String),
      );
    });
  });

  // ─── 3. Stale RUNNING Recovery with Atomic Timestamp Condition ───────────

  describe('recoverStuckJob - Stale RUNNING Recovery Logic', () => {
    it('should pick up pending jobs older than 30 seconds (server restart recovery)', async () => {
      const pendingJobs = [
        { id: 'job-stale-pending-1', payload: { recordingId: 'rec-1' } },
      ];
      prisma.backgroundJobs.findMany.mockImplementation((args: any) => {
        if (args.where.status === BackgroundJobStatusEnum.PENDING) {
          return Promise.resolve(pendingJobs);
        }
        return Promise.resolve([]);
      });

      jest.spyOn(service, 'processJob').mockResolvedValue(undefined);

      await service.handlePendingJobsSweep();

      expect(service.processJob).toHaveBeenCalledWith('job-stale-pending-1');
    });

    it('should use an atomic conditional update with stale timestamp to ensure only ONE recovery worker reclaims a stuck job', async () => {
      const staleTimestamp = new Date(Date.now() - 20 * 60 * 1000); // 20m ago
      const stuckJob = {
        id: 'job-stuck-atomic-1',
        tenantId: mockTenantId,
        status: BackgroundJobStatusEnum.RUNNING,
        updatedAt: staleTimestamp,
      };

      prisma.jobExecutions.findFirst.mockResolvedValue({
        id: 'exec-stuck-1',
        attemptNumber: 1,
        status: 'RUNNING',
      });

      // Recovery Worker 1 reclaims with count: 1
      prisma.backgroundJobs.updateMany.mockResolvedValueOnce({ count: 1 });

      jest.spyOn(service, 'processJob').mockResolvedValue(undefined);

      await service.recoverStuckJob(stuckJob, staleTimestamp);

      // Verify the ATOMIC condition: MUST include status: RUNNING and updatedAt <= staleTimestamp
      expect(prisma.backgroundJobs.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'job-stuck-atomic-1',
          status: BackgroundJobStatusEnum.RUNNING,
          updatedAt: { lte: staleTimestamp },
        },
        data: {
          status: BackgroundJobStatusEnum.PENDING,
          updatedAt: expect.any(Date),
        },
      });

      // Prior execution marked as FAILED
      expect(prisma.jobExecutions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exec-stuck-1' },
          data: expect.objectContaining({
            status: 'FAILED',
            errorMessage: expect.stringContaining('Worker process terminated unexpectedly'),
          }),
        }),
      );

      // Abandoned lock cleared
      expect(redis.del).toHaveBeenCalledWith('lock:recorded_class_ai:job-stuck-atomic-1');

      // Re-dispatched to worker
      expect(service.processJob).toHaveBeenCalledWith('job-stuck-atomic-1');
    });

    it('should ensure that if a concurrent recovery worker races and gets count === 0, it aborts without duplicate dispatch', async () => {
      const staleTimestamp = new Date(Date.now() - 20 * 60 * 1000);
      const stuckJob = {
        id: 'job-stuck-race-2',
        tenantId: mockTenantId,
        status: BackgroundJobStatusEnum.RUNNING,
        updatedAt: staleTimestamp,
      };

      prisma.jobExecutions.findFirst.mockResolvedValue({
        id: 'exec-stuck-2',
        attemptNumber: 1,
        status: 'RUNNING',
      });

      // Another recovery worker already reclaimed it (count: 0)
      prisma.backgroundJobs.updateMany.mockResolvedValueOnce({ count: 0 });

      jest.spyOn(service, 'processJob').mockResolvedValue(undefined);

      await service.recoverStuckJob(stuckJob, staleTimestamp);

      // Did NOT mark execution or re-dispatch
      expect(prisma.jobExecutions.update).not.toHaveBeenCalled();
      expect(service.processJob).not.toHaveBeenCalled();
    });

    it('should atomically mark job as FAILED when max retry attempts (3) are exceeded', async () => {
      const staleTimestamp = new Date(Date.now() - 20 * 60 * 1000);
      const stuckJob = {
        id: 'job-stuck-max-3',
        tenantId: mockTenantId,
        status: BackgroundJobStatusEnum.RUNNING,
        updatedAt: staleTimestamp,
      };

      prisma.jobExecutions.findFirst.mockResolvedValue({
        id: 'exec-stuck-3',
        attemptNumber: 3, // Max attempts reached
        status: 'RUNNING',
      });

      prisma.backgroundJobs.updateMany.mockResolvedValueOnce({ count: 1 });

      await service.recoverStuckJob(stuckJob, staleTimestamp);

      // Atomically transitioned to FAILED
      expect(prisma.backgroundJobs.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'job-stuck-max-3',
          status: BackgroundJobStatusEnum.RUNNING,
          updatedAt: { lte: staleTimestamp },
        },
        data: {
          status: BackgroundJobStatusEnum.FAILED,
          updatedAt: expect.any(Date),
        },
      });

      // Previous execution marked as FAILED with max retries message
      expect(prisma.jobExecutions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exec-stuck-3' },
          data: expect.objectContaining({
            status: 'FAILED',
            errorMessage: expect.stringContaining('Max retry attempts exceeded'),
          }),
        }),
      );
    });

    it('should NOT reclaim an active job whose updatedAt was recently refreshed by worker heartbeats', async () => {
      // Job has been analyzing for 25 minutes, but its updatedAt is only 15 seconds old due to worker heartbeat
      const activeJob = {
        id: 'job-active-heartbeat',
        tenantId: mockTenantId,
        status: BackgroundJobStatusEnum.RUNNING,
        updatedAt: new Date(Date.now() - 15 * 1000), // 15 seconds ago
      };

      prisma.backgroundJobs.findMany.mockImplementation((args: any) => {
        if (args.where.status === BackgroundJobStatusEnum.RUNNING) {
          const threshold = args.where.updatedAt.lte;
          if (activeJob.updatedAt <= threshold) {
            return Promise.resolve([activeJob]);
          }
          return Promise.resolve([]); // Fresh job does NOT match stale threshold
        }
        return Promise.resolve([]);
      });

      jest.spyOn(service, 'recoverStuckJob');

      await service.handlePendingJobsSweep();

      // Active job was NOT classified as stuck and NOT reclaimed
      expect(service.recoverStuckJob).not.toHaveBeenCalled();
    });
  });

  // ─── 4. Query Job Status Semantics ───────────────────────────────────────

  describe('getJobStatus - Content Semantics', () => {
    it('should return IDLE status when no job has been triggered', async () => {
      recordingsService.classifyRole.mockReturnValue('admin');
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
      });
      prisma.backgroundJobs.findFirst.mockResolvedValue(null);
      prisma.backgroundJobs.findMany.mockResolvedValue([]);

      const status = await service.getJobStatus(
        mockTenantId,
        mockRecordingId,
        mockUserId,
        'TENANT_ADMIN',
      );

      expect(status.status).toBe('IDLE');
      expect(status.jobId).toBeNull();
      expect(status.progressPercentage).toBe(0);
      expect(status.hasContent).toBe(false);
      expect(status.isStaged).toBe(false);
    });

    it('should return hasContent: false and isStaged: true when staged container exists but actual notes do not', async () => {
      recordingsService.classifyRole.mockReturnValue('admin');
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
      });

      const job = {
        id: 'job-200',
        tenantId: mockTenantId,
        status: BackgroundJobStatusEnum.COMPLETED,
        createdAt: new Date('2026-11-22T14:00:00Z'),
        updatedAt: new Date('2026-11-22T14:00:15Z'),
        payload: { recordingId: mockRecordingId },
      };
      prisma.backgroundJobs.findFirst.mockResolvedValue(job);

      const execution = {
        attemptNumber: 1,
        status: 'COMPLETED',
        completedAt: new Date('2026-11-22T14:00:15Z'),
        executionDurationMs: 15200,
        errorMessage: '',
      };
      prisma.jobExecutions.findFirst.mockResolvedValue(execution);

      // Staged Phase 1 container with NO actual notes
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-2',
        isPublished: false,
        generatedOutput: {
          status: 'STAGED_FOR_ANALYSIS',
          notes: null,
        },
      });

      const status = await service.getJobStatus(
        mockTenantId,
        mockRecordingId,
        mockUserId,
        'TENANT_ADMIN',
      );

      expect(status.jobId).toBe('job-200');
      expect(status.status).toBe(BackgroundJobStatusEnum.COMPLETED);
      expect(status.progressPercentage).toBe(100);
      // CRITICAL CHECK: hasContent must be false because no study notes were generated yet!
      expect(status.hasContent).toBe(false);
      expect(status.isStaged).toBe(true);
      expect(status.currentStep).toContain('completed');
    });

    it('should return hasContent: true and isStaged: false when study notes are completed', async () => {
      recordingsService.classifyRole.mockReturnValue('admin');
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
      });

      const job = {
        id: 'job-201',
        tenantId: mockTenantId,
        status: BackgroundJobStatusEnum.COMPLETED,
        createdAt: new Date('2026-11-22T14:00:00Z'),
        updatedAt: new Date('2026-11-22T14:02:15Z'),
        payload: { recordingId: mockRecordingId },
      };
      prisma.backgroundJobs.findFirst.mockResolvedValue(job);

      const execution = {
        attemptNumber: 1,
        status: 'COMPLETED',
        completedAt: new Date('2026-11-22T14:02:15Z'),
        executionDurationMs: 135000,
        errorMessage: '',
      };
      prisma.jobExecutions.findFirst.mockResolvedValue(execution);

      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-completed',
        isPublished: false,
        generatedOutput: {
          status: 'COMPLETED',
          notes: {
            lecture: { title: 'Optics' },
            topics: [{ title: 'Refraction' }],
          },
        },
      });

      const status = await service.getJobStatus(
        mockTenantId,
        mockRecordingId,
        mockUserId,
        'TENANT_ADMIN',
      );

      expect(status.jobId).toBe('job-201');
      expect(status.status).toBe(BackgroundJobStatusEnum.COMPLETED);
      expect(status.hasContent).toBe(true);
      expect(status.isStaged).toBe(false);
      expect(status.progressPercentage).toBe(100);
    });

    it('should expose real-time stage and progress percentage during RUNNING status', async () => {
      recordingsService.classifyRole.mockReturnValue('admin');
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
      });

      const job = {
        id: 'job-running-1',
        tenantId: mockTenantId,
        status: BackgroundJobStatusEnum.RUNNING,
        createdAt: new Date('2026-11-22T14:00:00Z'),
        updatedAt: new Date('2026-11-22T14:01:00Z'),
        payload: {
          recordingId: mockRecordingId,
          stage: 'ANALYZING_LECTURE',
          progressPercentage: 70,
        },
      };
      prisma.backgroundJobs.findFirst.mockResolvedValue(job);

      const status = await service.getJobStatus(
        mockTenantId,
        mockRecordingId,
        mockUserId,
        'TENANT_ADMIN',
      );

      expect(status.status).toBe('RUNNING');
      expect(status.progressPercentage).toBe(70);
      expect(status.currentStep).toContain('Gemini multimodal analysis');
    });
  });

  // ─── 5. Query Generated Notes (Phase 2) ──────────────────────────────────

  describe('getGeneratedNotes - Role-based authorization & data retrieval', () => {
    it('should reject student requests with ForbiddenException', async () => {
      recordingsService.classifyRole.mockReturnValue('student');

      await expect(
        service.getGeneratedNotes(
          mockTenantId,
          mockRecordingId,
          mockUserId,
          'STUDENT',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if recording does not exist', async () => {
      recordingsService.classifyRole.mockReturnValue('admin');
      prisma.liveClassRecordings.findFirst.mockResolvedValue(null);

      await expect(
        service.getGeneratedNotes(
          mockTenantId,
          mockRecordingId,
          mockUserId,
          'TENANT_ADMIN',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject tutor if tutor does not teach the class', async () => {
      recordingsService.classifyRole.mockReturnValue('tutor');
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
        liveClassId: 'class-diff',
        createdBy: 'another-tutor',
      });
      recordingsService.resolveTaughtClassIds.mockResolvedValue(['class-own']);

      await expect(
        service.getGeneratedNotes(
          mockTenantId,
          mockRecordingId,
          mockUserId,
          'TUTOR',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if notes have not been generated yet', async () => {
      recordingsService.classifyRole.mockReturnValue('admin');
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue(null);

      await expect(
        service.getGeneratedNotes(
          mockTenantId,
          mockRecordingId,
          mockUserId,
          'TENANT_ADMIN',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return complete structured study notes for authorized tutor', async () => {
      recordingsService.classifyRole.mockReturnValue('tutor');
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: mockRecordingId,
        tenantId: mockTenantId,
        liveClassId: 'class-taught',
        createdBy: mockUserId,
      });
      recordingsService.resolveTaughtClassIds.mockResolvedValue(['class-taught']);

      const mockNotes = {
        lecture: { title: 'Photosynthesis' },
        topics: [{ title: 'Light Reaction' }],
      };

      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-ok',
        isPublished: false,
        createdAt: new Date('2026-11-22T14:00:00Z'),
        updatedAt: new Date('2026-11-22T14:05:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          completedAt: '2026-11-22T14:05:00.000Z',
          notes: mockNotes,
          curriculum: { classTitle: 'Photosynthesis' },
        },
      });

      const result = await service.getGeneratedNotes(
        mockTenantId,
        mockRecordingId,
        mockUserId,
        'TUTOR',
      );

      expect(result.recordingId).toBe(mockRecordingId);
      expect(result.isPublished).toBe(false);
      expect(result.notes).toEqual(mockNotes);
      expect(result.curriculum).toEqual({ classTitle: 'Photosynthesis' });
    });
  });
});
