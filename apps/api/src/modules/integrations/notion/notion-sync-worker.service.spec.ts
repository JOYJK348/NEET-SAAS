import { NotionSyncWorkerService, NOTION_SYNC_JOB_TYPE } from './notion-sync-worker.service';
import { BackgroundJobStatusEnum } from '@prisma/client';

describe('NotionSyncWorkerService', () => {
  let service: NotionSyncWorkerService;
  let prisma: any;
  let redis: any;
  let notionClient: any;
  let blockBuilder: any;
  let integrationService: any;

  const tenantId = 'tenant-123';
  const recordingId = 'rec-123';
  const contentId = 'content-123';
  const userId = 'user-tutor-1';
  const jobId = 'job-sync-1';
  const parentPageId = 'parent-page-123';
  const apiKey = 'secret_test_key_abc';

  const mockNotes = {
    metadata: {
      subject: 'Physics',
      topic: 'Optics',
      chapter: 'Wave Optics',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      analyzedAt: '2026-11-22T20:00:00Z',
    },
    lecture: {
      title: 'Optics: Wave Optics',
      topic: 'Young Double Slit Experiment',
      language: 'English',
      durationSeconds: 3600,
      overview: 'Wave optics lecture notes',
      learningObjectives: ['Understand interference'],
    },
    topics: [],
    definitions: [],
    formulaCheatSheet: [],
    importantConcepts: [],
    workedExamples: [],
    neetExamPoints: [],
  };

  beforeEach(() => {
    prisma = {
      aiGeneratedContent: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      backgroundJobs: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      jobExecutions: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'exec-1' }),
        update: jest.fn(),
      },
    };

    redis = {
      isAvailable: jest.fn().mockReturnValue(true),
      client: {
        set: jest.fn().mockResolvedValue('OK'),
        eval: jest.fn().mockResolvedValue(1),
        del: jest.fn().mockResolvedValue(1),
      },
    };

    notionClient = {
      createPage: jest.fn().mockResolvedValue({
        id: 'new-notion-page-123',
        url: 'https://notion.so/new-notion-page-123',
      }),
      appendBlockChildren: jest.fn().mockResolvedValue(undefined),
      replacePageContent: jest.fn().mockResolvedValue(undefined),
      archivePage: jest.fn().mockResolvedValue({ id: 'page-123', archived: true }),
      unarchivePage: jest.fn().mockResolvedValue({ id: 'page-123', archived: false }),
    };

    blockBuilder = {
      buildStudyNotesBlocks: jest.fn().mockReturnValue([
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: [{ type: 'text', text: { content: 'Notes' } }] },
        },
      ]),
    };

    integrationService = {
      getConfig: jest.fn().mockResolvedValue({
        apiKey,
        destinationParentPageId: parentPageId,
        isActive: true,
      }),
    };

    service = new NotionSyncWorkerService(
      prisma,
      redis,
      notionClient,
      blockBuilder,
      integrationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('enqueueSyncJob', () => {
    it('should create BackgroundJob with PENDING status and update content to PENDING', async () => {
      prisma.aiGeneratedContent.findUnique.mockResolvedValue({
        id: contentId,
        generatedOutput: {},
      });
      prisma.backgroundJobs.create.mockResolvedValue({
        id: jobId,
        tenantId,
        jobType: NOTION_SYNC_JOB_TYPE,
        status: BackgroundJobStatusEnum.PENDING,
      });

      const result = await service.enqueueSyncJob(
        tenantId,
        recordingId,
        contentId,
        1,
        'PUBLISH',
        userId,
      );

      expect(prisma.backgroundJobs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            jobType: NOTION_SYNC_JOB_TYPE,
            status: BackgroundJobStatusEnum.PENDING,
            payload: expect.objectContaining({
              recordingId,
              contentId,
              version: 1,
              action: 'PUBLISH',
            }),
          }),
        }),
      );

      expect(prisma.aiGeneratedContent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: contentId },
          data: expect.objectContaining({
            generatedOutput: expect.objectContaining({
              notionSync: expect.objectContaining({
                syncStatus: 'PENDING',
              }),
            }),
          }),
        }),
      );

      expect(result.id).toBe(jobId);
    });
  });

  describe('processJob - PUBLISH action', () => {
    it('should create a new Notion page when syncing for the first time, immediately persist pageId, and mark SYNCED', async () => {
      prisma.backgroundJobs.findUnique.mockResolvedValue({
        id: jobId,
        tenantId,
        jobType: NOTION_SYNC_JOB_TYPE,
        status: BackgroundJobStatusEnum.PENDING,
        payload: {
          recordingId,
          contentId,
          version: 1,
          action: 'PUBLISH',
          triggeredBy: userId,
        },
        createdBy: userId,
        updatedBy: userId,
      });

      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: contentId,
        tenantId,
        version: 1,
        isPublished: true,
        generatedOutput: {
          notes: mockNotes,
          publishedSnapshot: mockNotes,
          lifecycle: {
            state: 'PUBLISHED',
            publishedVersion: 1,
            publishedAt: new Date().toISOString(),
          },
        },
      });

      await service.processJob(jobId);

      // Verify page creation
      expect(notionClient.createPage).toHaveBeenCalledWith(
        apiKey,
        parentPageId,
        expect.stringContaining('Optics: Wave Optics'),
        expect.any(Array),
      );

      // Verify immediate persistence of created page ID (Call 1)
      expect(prisma.aiGeneratedContent.update).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: { id: contentId },
          data: expect.objectContaining({
            generatedOutput: expect.objectContaining({
              notionSync: expect.objectContaining({
                syncStatus: 'SYNCING',
                notionPageId: 'new-notion-page-123',
                notionPageUrl: 'https://notion.so/new-notion-page-123',
              }),
            }),
          }),
        }),
      );

      // Verify completion persistence with SYNCED status and syncedVersion (Call 2)
      expect(prisma.aiGeneratedContent.update).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: { id: contentId },
          data: expect.objectContaining({
            generatedOutput: expect.objectContaining({
              notionSync: expect.objectContaining({
                syncStatus: 'SYNCED',
                notionPageId: 'new-notion-page-123',
                notionPageUrl: 'https://notion.so/new-notion-page-123',
                syncedVersion: 1,
              }),
            }),
          }),
        }),
      );

      // Verify BackgroundJob and Execution marked COMPLETED
      expect(prisma.backgroundJobs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: jobId },
          data: expect.objectContaining({ status: BackgroundJobStatusEnum.COMPLETED }),
        }),
      );
      expect(prisma.jobExecutions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
    });

    it('should update existing Notion page idempotently without creating duplicate page', async () => {
      const existingPageId = 'existing-page-uuid-999';

      prisma.backgroundJobs.findUnique.mockResolvedValue({
        id: jobId,
        tenantId,
        jobType: NOTION_SYNC_JOB_TYPE,
        status: BackgroundJobStatusEnum.PENDING,
        payload: {
          recordingId,
          contentId,
          version: 2,
          action: 'PUBLISH',
          triggeredBy: userId,
        },
        createdBy: userId,
        updatedBy: userId,
      });

      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: contentId,
        tenantId,
        version: 2,
        isPublished: true,
        generatedOutput: {
          notes: mockNotes,
          publishedSnapshot: mockNotes,
          lifecycle: {
            state: 'PUBLISHED',
            publishedVersion: 2,
            publishedAt: new Date().toISOString(),
          },
          notionSync: {
            syncStatus: 'SYNCED',
            notionPageId: existingPageId,
            notionPageUrl: `https://notion.so/${existingPageId}`,
            syncedVersion: 1,
          },
        },
      });

      await service.processJob(jobId);

      // Must NOT call createPage
      expect(notionClient.createPage).not.toHaveBeenCalled();
      // Must call replacePageContent on existing page
      expect(notionClient.replacePageContent).toHaveBeenCalledWith(
        apiKey,
        existingPageId,
        expect.any(Array),
      );

      expect(prisma.aiGeneratedContent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: contentId },
          data: expect.objectContaining({
            generatedOutput: expect.objectContaining({
              notionSync: expect.objectContaining({
                syncStatus: 'SYNCED',
                notionPageId: existingPageId,
                syncedVersion: 2,
              }),
            }),
          }),
        }),
      );
    });

    it('should skip sync if content is not in PUBLISHED lifecycle state', async () => {
      prisma.backgroundJobs.findUnique.mockResolvedValue({
        id: jobId,
        tenantId,
        jobType: NOTION_SYNC_JOB_TYPE,
        status: BackgroundJobStatusEnum.PENDING,
        payload: {
          recordingId,
          contentId,
          version: 1,
          action: 'PUBLISH',
        },
      });

      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: contentId,
        tenantId,
        version: 1,
        isPublished: false, // Not published!
        generatedOutput: {
          lifecycle: {
            state: 'DRAFT',
          },
        },
      });

      await service.processJob(jobId);

      expect(notionClient.createPage).not.toHaveBeenCalled();
      expect(notionClient.replacePageContent).not.toHaveBeenCalled();
      expect(prisma.backgroundJobs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: jobId },
          data: expect.objectContaining({ status: BackgroundJobStatusEnum.COMPLETED }),
        }),
      );
    });

    it('should skip sync if queued job version does not match currently published version', async () => {
      prisma.backgroundJobs.findUnique.mockResolvedValue({
        id: jobId,
        tenantId,
        jobType: NOTION_SYNC_JOB_TYPE,
        status: BackgroundJobStatusEnum.PENDING,
        payload: {
          recordingId,
          contentId,
          version: 1, // older job version
          action: 'PUBLISH',
        },
      });

      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: contentId,
        tenantId,
        version: 3,
        isPublished: true,
        generatedOutput: {
          lifecycle: {
            state: 'PUBLISHED',
            publishedVersion: 3, // DB published version is 3
          },
          publishedSnapshot: mockNotes,
        },
      });

      await service.processJob(jobId);

      expect(notionClient.createPage).not.toHaveBeenCalled();
      expect(notionClient.replacePageContent).not.toHaveBeenCalled();
      expect(prisma.backgroundJobs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: jobId },
          data: expect.objectContaining({ status: BackgroundJobStatusEnum.COMPLETED }),
        }),
      );
    });

    it('should skip sync redundantly if exact version is already marked SYNCED', async () => {
      prisma.backgroundJobs.findUnique.mockResolvedValue({
        id: jobId,
        tenantId,
        jobType: NOTION_SYNC_JOB_TYPE,
        status: BackgroundJobStatusEnum.PENDING,
        payload: {
          recordingId,
          contentId,
          version: 2,
          action: 'PUBLISH',
        },
      });

      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: contentId,
        tenantId,
        version: 2,
        isPublished: true,
        generatedOutput: {
          lifecycle: {
            state: 'PUBLISHED',
            publishedVersion: 2,
          },
          publishedSnapshot: mockNotes,
          notionSync: {
            syncStatus: 'SYNCED',
            notionPageId: 'page-123',
            syncedVersion: 2, // Already synced for v2!
          },
        },
      });

      await service.processJob(jobId);

      expect(notionClient.createPage).not.toHaveBeenCalled();
      expect(notionClient.replacePageContent).not.toHaveBeenCalled();
      expect(prisma.backgroundJobs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: jobId },
          data: expect.objectContaining({ status: BackgroundJobStatusEnum.COMPLETED }),
        }),
      );
    });
  });

  describe('processJob - UNPUBLISH action', () => {
    it('should archive Notion page when notes are unpublished in NEET SaaS', async () => {
      const pageId = 'page-to-archive-123';

      prisma.backgroundJobs.findUnique.mockResolvedValue({
        id: jobId,
        tenantId,
        jobType: NOTION_SYNC_JOB_TYPE,
        status: BackgroundJobStatusEnum.PENDING,
        payload: {
          recordingId,
          contentId,
          version: 1,
          action: 'UNPUBLISH',
          triggeredBy: userId,
        },
      });

      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: contentId,
        tenantId,
        version: 1,
        isPublished: false,
        generatedOutput: {
          lifecycle: {
            state: 'UNPUBLISHED',
          },
          notionSync: {
            syncStatus: 'SYNCED',
            notionPageId: pageId,
          },
        },
      });

      await service.processJob(jobId);

      expect(notionClient.archivePage).toHaveBeenCalledWith(apiKey, pageId);

      expect(prisma.aiGeneratedContent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: contentId },
          data: expect.objectContaining({
            generatedOutput: expect.objectContaining({
              notionSync: expect.objectContaining({
                syncStatus: 'UNPUBLISHED',
              }),
            }),
          }),
        }),
      );
    });

    it('should discard unpublish job if content has already been re-published', async () => {
      prisma.backgroundJobs.findUnique.mockResolvedValue({
        id: jobId,
        tenantId,
        jobType: NOTION_SYNC_JOB_TYPE,
        status: BackgroundJobStatusEnum.PENDING,
        payload: {
          recordingId,
          contentId,
          version: 1,
          action: 'UNPUBLISH',
        },
      });

      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: contentId,
        tenantId,
        version: 2,
        isPublished: true, // Content was re-published!
        generatedOutput: {
          lifecycle: {
            state: 'PUBLISHED',
            publishedVersion: 2,
          },
          publishedSnapshot: mockNotes,
        },
      });

      await service.processJob(jobId);

      expect(notionClient.archivePage).not.toHaveBeenCalled();
      expect(prisma.backgroundJobs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: jobId },
          data: expect.objectContaining({ status: BackgroundJobStatusEnum.COMPLETED }),
        }),
      );
    });
  });

  describe('Failure and Retries', () => {
    it('should reschedule with exponential backoff on retryable error when attempts < 3', async () => {
      prisma.backgroundJobs.findUnique.mockResolvedValue({
        id: jobId,
        tenantId,
        jobType: NOTION_SYNC_JOB_TYPE,
        status: BackgroundJobStatusEnum.PENDING,
        payload: {
          recordingId,
          contentId,
          version: 1,
          action: 'PUBLISH',
        },
      });

      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: contentId,
        tenantId,
        version: 1,
        isPublished: true,
        generatedOutput: {
          notes: mockNotes,
          publishedSnapshot: mockNotes,
          lifecycle: {
            state: 'PUBLISHED',
            publishedVersion: 1,
          },
        },
      });

      prisma.jobExecutions.count.mockResolvedValue(1); // 1 prior attempt
      notionClient.createPage.mockRejectedValue(new Error('Network timeout'));

      await service.processJob(jobId);

      // Should be rescheduled to PENDING with a future scheduledRunAt
      expect(prisma.backgroundJobs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: jobId },
          data: expect.objectContaining({
            status: BackgroundJobStatusEnum.PENDING,
            scheduledRunAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should mark job as FAILED when attempts exceed max retries (3)', async () => {
      prisma.backgroundJobs.findUnique.mockResolvedValue({
        id: jobId,
        tenantId,
        jobType: NOTION_SYNC_JOB_TYPE,
        status: BackgroundJobStatusEnum.PENDING,
        payload: {
          recordingId,
          contentId,
          version: 1,
          action: 'PUBLISH',
        },
      });

      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: contentId,
        tenantId,
        version: 1,
        isPublished: true,
        generatedOutput: {
          notes: mockNotes,
          publishedSnapshot: mockNotes,
          lifecycle: {
            state: 'PUBLISHED',
            publishedVersion: 1,
          },
        },
      });

      prisma.jobExecutions.count.mockResolvedValue(3); // 3 prior attempts
      notionClient.createPage.mockRejectedValue(new Error('Persistent Notion API failure'));

      await service.processJob(jobId);

      // Should be marked FAILED
      expect(prisma.backgroundJobs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: jobId },
          data: expect.objectContaining({
            status: BackgroundJobStatusEnum.FAILED,
          }),
        }),
      );
    });
  });
});

