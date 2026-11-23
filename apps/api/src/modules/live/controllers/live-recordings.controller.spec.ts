import { Test, TestingModule } from '@nestjs/testing';
import { LiveRecordingsController } from './live-recordings.controller';
import { LiveRecordingsService } from '../services/live-recordings.service';
import { RecordedClassAiWorkerService } from '../services/recorded-class-ai-worker.service';
import { RecordedClassNotesService } from '../services/recorded-class-notes.service';
import { NotionSyncWorkerService } from '../../integrations/notion/notion-sync-worker.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';

describe('LiveRecordingsController', () => {
  let controller: LiveRecordingsController;
  let recordingsService: any;
  let aiWorkerService: any;
  let notesService: any;
  let notionWorker: any;

  const mockUser: AuthenticatedRequestUser = {
    sub: 'user-tutor-1',
    sessionId: 'session-123',
    roleCode: 'TUTOR',
    tenantId: 'tenant-123',
    forcePasswordChange: false,
  };

  beforeEach(async () => {
    recordingsService = {
      list: jest.fn(),
      getDetail: jest.fn(),
      remove: jest.fn(),
    };

    aiWorkerService = {
      enqueueAnalysisJob: jest.fn(),
      getJobStatus: jest.fn(),
    };

    notesService = {
      getNotes: jest.fn(),
      saveDraft: jest.fn(),
      approveNotes: jest.fn(),
      publishNotes: jest.fn(),
      unpublishNotes: jest.fn(),
      getVersionHistory: jest.fn(),
      getStudentNotes: jest.fn(),
    };

    notionWorker = {
      getSyncStatus: jest.fn(),
      retrySync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LiveRecordingsController],
      providers: [
        { provide: LiveRecordingsService, useValue: recordingsService },
        { provide: RecordedClassAiWorkerService, useValue: aiWorkerService },
        { provide: RecordedClassNotesService, useValue: notesService },
        { provide: NotionSyncWorkerService, useValue: notionWorker },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LiveRecordingsController>(LiveRecordingsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyze (POST /recordings/:id/analyze)', () => {
    it('should delegate to aiWorkerService.enqueueAnalysisJob with user tenant and credentials', async () => {
      const recordingId = 'rec-999';
      const expectedResponse = {
        jobId: 'job-123',
        recordingId,
        status: 'PENDING',
        message: 'Analysis job accepted and queued for processing',
        createdAt: '2026-11-22T20:50:00.000Z',
      };
      aiWorkerService.enqueueAnalysisJob.mockResolvedValue(expectedResponse);

      const result = await controller.analyze(mockUser, recordingId);

      expect(aiWorkerService.enqueueAnalysisJob).toHaveBeenCalledWith(
        'tenant-123',
        recordingId,
        'user-tutor-1',
        'TUTOR',
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getAnalysisStatus (GET /recordings/:id/analysis-status)', () => {
    it('should delegate to aiWorkerService.getJobStatus and return status dto', async () => {
      const recordingId = 'rec-999';
      const expectedStatus = {
        jobId: 'job-123',
        recordingId,
        status: 'COMPLETED',
        attemptNumber: 1,
        progressPercentage: 100,
        currentStep: 'Analysis foundation completed successfully',
        error: null,
        createdAt: '2026-11-22T20:50:00.000Z',
        updatedAt: '2026-11-22T20:50:10.000Z',
        completedAt: '2026-11-22T20:50:10.000Z',
        executionDurationMs: 1200,
        hasContent: true,
      };
      aiWorkerService.getJobStatus.mockResolvedValue(expectedStatus);

      const result = await controller.getAnalysisStatus(mockUser, recordingId);

      expect(aiWorkerService.getJobStatus).toHaveBeenCalledWith(
        'tenant-123',
        recordingId,
        'user-tutor-1',
        'TUTOR',
      );
      expect(result).toEqual(expectedStatus);
    });
  });

  describe('getNotes (GET /recordings/:id/notes)', () => {
    it('should delegate to notesService.getNotes with user credentials', async () => {
      const recordingId = 'rec-999';
      const expectedNotes = {
        recordingId,
        isPublished: false,
        version: 1,
        generatedAt: '2026-11-22T21:00:00.000Z',
        updatedAt: '2026-11-22T21:00:00.000Z',
        notes: {
          lecture: { title: 'Optics Class 12' },
        },
      };
      notesService.getNotes.mockResolvedValue(expectedNotes);

      const result = await controller.getNotes(mockUser, recordingId);

      expect(notesService.getNotes).toHaveBeenCalledWith(
        'tenant-123',
        recordingId,
        'user-tutor-1',
        'TUTOR',
      );
      expect(result).toEqual(expectedNotes);
    });
  });

  describe('saveDraft (PUT /recordings/:id/notes/draft)', () => {
    it('should delegate to notesService.saveDraft with dto', async () => {
      const recordingId = 'rec-999';
      const dto = {
        notes: { lecture: { title: 'Updated Title' } } as any,
        changeSummary: 'Clarified terms',
        expectedVersion: 1,
      };
      const expectedResponse = { recordingId, isPublished: false, version: 1 };
      notesService.saveDraft.mockResolvedValue(expectedResponse);

      const result = await controller.saveDraft(mockUser, recordingId, dto);

      expect(notesService.saveDraft).toHaveBeenCalledWith(
        'tenant-123',
        recordingId,
        'user-tutor-1',
        'TUTOR',
        dto,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('approveNotes (POST /recordings/:id/notes/approve)', () => {
    it('should delegate to notesService.approveNotes', async () => {
      const recordingId = 'rec-999';
      const expectedResponse = { recordingId, isPublished: false, version: 1 };
      notesService.approveNotes.mockResolvedValue(expectedResponse);

      const result = await controller.approveNotes(mockUser, recordingId);

      expect(notesService.approveNotes).toHaveBeenCalledWith(
        'tenant-123',
        recordingId,
        'user-tutor-1',
        'TUTOR',
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('publishNotes (POST /recordings/:id/notes/publish)', () => {
    it('should delegate to notesService.publishNotes with dto', async () => {
      const recordingId = 'rec-999';
      const dto = { version: 1 };
      const expectedResponse = { recordingId, isPublished: true, version: 1 };
      notesService.publishNotes.mockResolvedValue(expectedResponse);

      const result = await controller.publishNotes(mockUser, recordingId, dto);

      expect(notesService.publishNotes).toHaveBeenCalledWith(
        'tenant-123',
        recordingId,
        'user-tutor-1',
        'TUTOR',
        dto,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('unpublishNotes (POST /recordings/:id/notes/unpublish)', () => {
    it('should delegate to notesService.unpublishNotes with dto', async () => {
      const recordingId = 'rec-999';
      const dto = { reason: 'Need correction' };
      const expectedResponse = { recordingId, isPublished: false, version: 1 };
      notesService.unpublishNotes.mockResolvedValue(expectedResponse);

      const result = await controller.unpublishNotes(mockUser, recordingId, dto);

      expect(notesService.unpublishNotes).toHaveBeenCalledWith(
        'tenant-123',
        recordingId,
        'user-tutor-1',
        'TUTOR',
        dto,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getVersionHistory (GET /recordings/:id/notes/versions)', () => {
    it('should delegate to notesService.getVersionHistory', async () => {
      const recordingId = 'rec-999';
      const expectedResponse = {
        recordingId,
        currentVersion: 1,
        versions: [],
        auditLog: [],
      };
      notesService.getVersionHistory.mockResolvedValue(expectedResponse);

      const result = await controller.getVersionHistory(mockUser, recordingId);

      expect(notesService.getVersionHistory).toHaveBeenCalledWith(
        'tenant-123',
        recordingId,
        'user-tutor-1',
        'TUTOR',
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getStudentNotes (GET /recordings/:id/student-notes)', () => {
    it('should delegate to notesService.getStudentNotes', async () => {
      const recordingId = 'rec-999';
      const studentUser = { ...mockUser, roleCode: 'STUDENT', sub: 'student-123' };
      const expectedResponse = {
        recordingId,
        version: 1,
        publishedAt: '2026-11-22T21:00:00.000Z',
        notes: { lecture: { title: 'Optics Class 12' } },
      };
      notesService.getStudentNotes.mockResolvedValue(expectedResponse);

      const result = await controller.getStudentNotes(studentUser, recordingId);

      expect(notesService.getStudentNotes).toHaveBeenCalledWith(
        'tenant-123',
        recordingId,
        'student-123',
        'STUDENT',
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getNotionSyncStatus (GET /recordings/:id/notes/notion-sync)', () => {
    it('should delegate to notionWorker.getSyncStatus', async () => {
      const recordingId = 'rec-999';
      const expectedResponse = {
        recordingId,
        contentId: 'content-1',
        syncStatus: 'SYNCED',
        notionPageId: 'page-123',
        notionPageUrl: 'https://notion.so/page-123',
        syncedVersion: 1,
        currentPublishedVersion: 1,
        lastSyncedAt: '2026-11-23T10:00:00.000Z',
        lastAttemptAt: '2026-11-23T10:00:00.000Z',
        attemptCount: 1,
        canRetry: false,
        errorMessage: null,
      };
      notionWorker.getSyncStatus.mockResolvedValue(expectedResponse);

      const result = await controller.getNotionSyncStatus(mockUser, recordingId);

      expect(notionWorker.getSyncStatus).toHaveBeenCalledWith('tenant-123', recordingId);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('retryNotionSync (POST /recordings/:id/notes/notion-sync/retry)', () => {
    it('should delegate to notionWorker.retrySync', async () => {
      const recordingId = 'rec-999';
      const expectedResponse = {
        recordingId,
        contentId: 'content-1',
        syncStatus: 'PENDING',
        notionPageId: null,
        notionPageUrl: null,
        syncedVersion: null,
        currentPublishedVersion: 1,
        lastSyncedAt: null,
        lastAttemptAt: '2026-11-23T10:05:00.000Z',
        attemptCount: 0,
        canRetry: false,
        errorMessage: null,
      };
      notionWorker.retrySync.mockResolvedValue(expectedResponse);

      const result = await controller.retryNotionSync(mockUser, recordingId);

      expect(notionWorker.retrySync).toHaveBeenCalledWith('tenant-123', recordingId, 'user-tutor-1');
      expect(result).toEqual(expectedResponse);
    });
  });
});
