import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { RecordedClassNotesService } from './recorded-class-notes.service';
import { LiveRecordingsService } from './live-recordings.service';
import { NotionSyncWorkerService } from '../../integrations/notion/notion-sync-worker.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { RecordedClassStudyNotes } from '../types/recorded-class-ai.types';

describe('RecordedClassNotesService', () => {
  let service: RecordedClassNotesService;
  let prisma: any;
  let recordingsService: any;
  let notionSyncWorker: any;

  const tenantId = 'tenant-test-123';
  const recordingId = 'rec-test-123';
  const tutorUserId = 'tutor-user-1';
  const studentUserId = 'student-user-1';
  const liveClassId = 'live-class-123';
  const topicId = 'topic-123';
  const batchId = 'batch-123';

  const mockStudyNotes: RecordedClassStudyNotes = {
    lecture: {
      title: 'Human Physiology - Neural Control & Coordination',
      language: 'English',
      durationSeconds: 3600,
      overview: 'Comprehensive review of nerve impulse conduction and synapse transmission.',
      learningObjectives: [
        'Understand action potential propagation',
        'Learn neurotransmitter dynamics at synaptic cleft',
      ],
    },
    transcript: {
      segments: [
        {
          startSeconds: 0,
          endSeconds: 120,
          timestampLabel: '00:00 - 02:00',
          speaker: 'Faculty',
          text: 'Welcome students to Neural Control.',
        },
      ],
    },
    topics: [
      {
        title: 'Synaptic Transmission',
        startSeconds: 120,
        endSeconds: 600,
        timestampLabel: '02:00 - 10:00',
        explanation: 'Detailed explanation of chemical synapse.',
        subtopics: ['Vesicle fusion', 'Neurotransmitter release'],
        definitions: [],
        concepts: [],
        formulas: [],
        examples: [],
        neetExamPoints: [],
        confidence: 0.95,
      },
    ],
    definitions: [
      {
        term: 'Action Potential',
        definition: 'Rapid sequence of changes in the voltage across a membrane.',
        relatedTopic: 'Synaptic Transmission',
      },
    ],
    formulaCheatSheet: [
      {
        name: 'Nernst Equation',
        expression: 'E = (RT/zF) * ln([ion_out]/[ion_in])',
        variableExplanations: 'R is gas constant, T is temperature, z is valence, F is Faraday constant',
        siUnits: 'Volts (V)',
      },
    ],
    importantConcepts: [
      {
        title: 'Resting Membrane Potential',
        category: 'PRINCIPLE',
        explanation: 'Maintained by Na+/K+ ATPase pump at -70mV.',
        neetRelevance: 'Tested frequently in NEET biology.',
      },
    ],
    workedExamples: [
      {
        problem: 'What is the ratio of Na+ to K+ transported by the pump?',
        stepByStepExplanation: ['Na+ pumped out: 3', 'K+ pumped in: 2'],
        finalResult: '3 Na+ exported for every 2 K+ imported.',
      },
    ],
    neetExamPoints: [
      {
        point: 'Saltatory Conduction: nodes of Ranvier depolarize.',
        relevance: 'HIGH',
        potentialQuestionAngle: 'NEET assertion-reason question on myelin sheath insulator property.',
      },
    ],
    lectureConclusion: {
      summary: 'Covered resting and action potentials.',
      revisionChecklist: ['Draw synaptic cleft diagram', 'Remember 3Na+/2K+ ratio'],
      homework: ['Solve past 5 years NEET questions on nervous system'],
    },
    quality: {
      completenessScore: 95,
      uncertainSections: [],
      warnings: [],
    },
    metadata: {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      analyzedAt: '2026-11-22T20:00:00Z',
    },
  };

  beforeEach(async () => {
    prisma = {
      liveClassRecordings: {
        findFirst: jest.fn(),
      },
      liveClasses: {
        findUnique: jest.fn(),
      },
      aiGeneratedContent: {
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      topicItems: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      tenantSettings: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      backgroundJobs: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'job-notion-tx-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn(async (callback: any) => {
        if (typeof callback === 'function') {
          return callback(prisma);
        }
        return callback;
      }),
    };

    recordingsService = {
      classifyRole: jest.fn((roleCode: string) => {
        if (roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN' || roleCode === 'TENANT_ADMIN') return 'admin';
        if (roleCode === 'TUTOR' || roleCode === 'INSTRUCTOR' || roleCode === 'TEACHER') return 'tutor';
        return 'student';
      }),
      resolveTaughtClassIds: jest.fn().mockResolvedValue([liveClassId]),
      resolveStudentBatchIds: jest.fn().mockResolvedValue([batchId]),
      resolveStudentAdmissionId: jest.fn().mockResolvedValue('admission-student-1'),
    };

    notionSyncWorker = {
      enqueueSyncJob: jest.fn().mockResolvedValue({ id: 'job-notion-1' }),
      processJob: jest.fn().mockResolvedValue(undefined),
      getSyncStatus: jest.fn(),
      retrySync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordedClassNotesService,
        { provide: PrismaService, useValue: prisma },
        { provide: LiveRecordingsService, useValue: recordingsService },
        { provide: NotionSyncWorkerService, useValue: notionSyncWorker },
      ],
    }).compile();

    service = module.get<RecordedClassNotesService>(RecordedClassNotesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Access Control & Assertions', () => {
    it('should throw NotFoundException if recording is not found in tenant', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue(null);

      await expect(
        service.getNotes(tenantId, 'non-existent-rec', tutorUserId, 'TUTOR'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if a student attempts to access tutor getNotes', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });

      await expect(
        service.getNotes(tenantId, recordingId, studentUserId, 'STUDENT'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if tutor is not assigned to the class', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId: 'other-class',
      });
      recordingsService.resolveTaughtClassIds.mockResolvedValue(['class-abc']);

      await expect(
        service.getNotes(tenantId, recordingId, tutorUserId, 'TUTOR'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to access any recording in tenant', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: false,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:00:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          lifecycle: { state: 'AI_GENERATED', currentVersion: 1 },
        },
      });

      const res = await service.getNotes(tenantId, recordingId, 'admin-user', 'ADMIN');
      expect(res.recordingId).toBe(recordingId);
      expect(res.isPublished).toBe(false);
      expect(res.notes.lecture.title).toBe(mockStudyNotes.lecture.title);
    });
  });

  describe('Optimistic Concurrency & saveDraft', () => {
    it('should save draft, advance version, update lifecycle to DRAFT, record snapshot and audit entry', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: false,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:00:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          lifecycle: { state: 'AI_GENERATED', currentVersion: 1 },
          versions: [],
          auditLog: [],
        },
      });
      prisma.aiGeneratedContent.updateMany.mockResolvedValue({ count: 1 });
      prisma.aiGeneratedContent.findUniqueOrThrow.mockResolvedValue({
        id: 'content-1',
        version: 2,
        isPublished: false,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:10:00Z'),
      });

      const updatedNotes = {
        ...mockStudyNotes,
        lecture: { ...mockStudyNotes.lecture, title: 'Updated Neural Control Title' },
      };

      const result = await service.saveDraft(tenantId, recordingId, tutorUserId, 'TUTOR', {
        notes: updatedNotes,
        changeSummary: 'Clarified title and learning objectives',
        expectedVersion: 1,
      });

      expect(prisma.aiGeneratedContent.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'content-1', version: 1 },
        }),
      );
      expect(result.version).toBe(2);
      expect(result.lifecycle?.state).toBe('DRAFT');
      expect(result.notes.lecture.title).toBe('Updated Neural Control Title');
    });

    it('should reject draft save if expectedVersion is missing/null (mandatory check)', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: false,
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          lifecycle: { state: 'AI_GENERATED', currentVersion: 1 },
        },
      });

      await expect(
        service.saveDraft(tenantId, recordingId, tutorUserId, 'TUTOR', {
          notes: mockStudyNotes,
          expectedVersion: undefined as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if expectedVersion mismatches current version (optimistic locking)', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 2,
        isPublished: false,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:00:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          lifecycle: { state: 'DRAFT', currentVersion: 2 },
        },
      });

      await expect(
        service.saveDraft(tenantId, recordingId, tutorUserId, 'TUTOR', {
          notes: mockStudyNotes,
          expectedVersion: 1, // Stale version!
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if concurrent edit races and updateMany returns count 0', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: false,
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          lifecycle: { state: 'DRAFT', currentVersion: 1 },
        },
      });
      // Another worker updated the row between findFirst and updateMany
      prisma.aiGeneratedContent.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.saveDraft(tenantId, recordingId, tutorUserId, 'TUTOR', {
          notes: mockStudyNotes,
          expectedVersion: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should invalidate any prior approval when draft is edited, setting approvedVersion to null', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 2,
        isPublished: false,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:00:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          lifecycle: {
            state: 'APPROVED',
            currentVersion: 2,
            approvedVersion: 2,
            approvedBy: tutorUserId,
            approvedAt: '2026-11-22T20:10:00Z',
          },
        },
      });
      prisma.aiGeneratedContent.updateMany.mockResolvedValue({ count: 1 });
      prisma.aiGeneratedContent.findUniqueOrThrow.mockResolvedValue({
        id: 'content-1',
        version: 3,
        isPublished: false,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date(),
      });

      const res = await service.saveDraft(tenantId, recordingId, tutorUserId, 'TUTOR', {
        notes: {
          ...mockStudyNotes,
          lecture: { ...mockStudyNotes.lecture, title: 'Modifying approved notes' },
        },
        expectedVersion: 2,
      });

      expect(res.version).toBe(3);
      expect(res.lifecycle?.state).toBe('DRAFT');
      expect(res.lifecycle?.approvedVersion).toBeNull();
      expect(res.lifecycle?.approvedBy).toBeNull();
      expect(res.lifecycle?.approvedAt).toBeNull();
    });
  });

  describe('approveNotes', () => {
    it('should mark notes as APPROVED and record approval metadata', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: false,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:00:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          lifecycle: { state: 'DRAFT', currentVersion: 1 },
          versions: [],
          auditLog: [],
        },
      });
      prisma.aiGeneratedContent.update.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: false,
        updatedAt: new Date('2026-11-22T20:15:00Z'),
      });

      const res = await service.approveNotes(tenantId, recordingId, tutorUserId, 'TUTOR');

      expect(res.lifecycle?.state).toBe('APPROVED');
      expect(res.lifecycle?.approvedVersion).toBe(1);
      expect(res.lifecycle?.approvedBy).toBe(tutorUserId);
      expect(res.lifecycle?.approvedAt).toBeDefined();
    });

    it('should reject approval if notes structure is missing lecture title or topics', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: false,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:00:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          notes: { lecture: { title: '' }, topics: [] }, // Invalid empty notes
          lifecycle: { state: 'DRAFT', currentVersion: 1 },
        },
      });

      await expect(
        service.approveNotes(tenantId, recordingId, tutorUserId, 'TUTOR'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Approval-to-Publish Integrity & publishNotes', () => {
    it('should reject publish if notes have not been approved first', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: false,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:00:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          lifecycle: { state: 'DRAFT', currentVersion: 1 }, // Not approved yet!
        },
      });

      await expect(
        service.publishNotes(tenantId, recordingId, tutorUserId, 'TUTOR'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject publish if draft was modified after approval (targetVersion mismatch)', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 3, // Draft was edited to v3!
        isPublished: false,
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          lifecycle: {
            state: 'DRAFT',
            currentVersion: 3,
            approvedVersion: 2, // Approval was for v2!
          },
        },
      });

      // Requesting publish for v2 while content is currently on v3
      await expect(
        service.publishNotes(tenantId, recordingId, tutorUserId, 'TUTOR', { version: 2 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should atomically publish approved notes, freeze snapshot, and sync into TopicItems', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.liveClasses.findUnique.mockResolvedValue({
        id: liveClassId,
        topicId,
        title: 'Neural Control Live Class',
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: false,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:00:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          lifecycle: {
            state: 'APPROVED',
            currentVersion: 1,
            approvedVersion: 1,
            approvedBy: tutorUserId,
            approvedAt: '2026-11-22T20:15:00Z',
          },
          versions: [],
          auditLog: [],
        },
      });

      prisma.topicItems.findFirst.mockResolvedValue(null);
      prisma.topicItems.create.mockResolvedValue({
        id: 'topic-item-123',
        topicId,
        title: 'Study Notes: Human Physiology - Neural Control & Coordination',
        status: 'PUBLISHED',
      });
      prisma.aiGeneratedContent.updateMany.mockResolvedValue({ count: 1 });
      prisma.aiGeneratedContent.findUniqueOrThrow.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: true,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:20:00Z'),
      });

      const res = await service.publishNotes(tenantId, recordingId, tutorUserId, 'TUTOR');

      expect(res.isPublished).toBe(true);
      expect(res.lifecycle?.state).toBe('PUBLISHED');
      expect(res.lifecycle?.publishedVersion).toBe(1);
      expect(res.lifecycle?.publishedBy).toBe(tutorUserId);
      expect(res.publishedSnapshot).toBeDefined();
      expect(prisma.topicItems.create).toHaveBeenCalled();
    });

    it('should update existing TopicItem idempotently when re-publishing without creating duplicates', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.liveClasses.findUnique.mockResolvedValue({
        id: liveClassId,
        topicId,
        title: 'Neural Control Live Class',
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 2,
        isPublished: true,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:00:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          publishedSnapshot: mockStudyNotes,
          lifecycle: {
            state: 'APPROVED',
            currentVersion: 2,
            approvedVersion: 2,
            publishedVersion: 1,
            topicItemId: 'topic-item-existing',
          },
          versions: [],
          auditLog: [],
        },
      });

      prisma.topicItems.findFirst.mockResolvedValue({
        id: 'topic-item-existing',
        topicId,
        status: 'PUBLISHED',
      });
      prisma.topicItems.update.mockResolvedValue({
        id: 'topic-item-existing',
        topicId,
        status: 'PUBLISHED',
      });
      prisma.aiGeneratedContent.updateMany.mockResolvedValue({ count: 1 });
      prisma.aiGeneratedContent.findUniqueOrThrow.mockResolvedValue({
        id: 'content-1',
        version: 2,
        isPublished: true,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:25:00Z'),
      });

      await service.publishNotes(tenantId, recordingId, tutorUserId, 'TUTOR');

      expect(prisma.topicItems.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'topic-item-existing' },
        }),
      );
      expect(prisma.topicItems.create).not.toHaveBeenCalled();
    });

    it('should create NOTION_SYNC BackgroundJob inside database transaction when tenant has active Notion integration', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.liveClasses.findUnique.mockResolvedValue({
        id: liveClassId,
        topicId,
        title: 'Neural Control Live Class',
      });
      prisma.tenantSettings.findFirst.mockResolvedValue({
        tenantId,
        brandingConfig: {
          notionIntegration: {
            isActive: true,
            apiKeyEncrypted: 'enc-key',
            destinationParentPageId: 'page-parent-123',
          },
        },
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: false,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:00:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          lifecycle: {
            state: 'APPROVED',
            currentVersion: 1,
            approvedVersion: 1,
            approvedBy: tutorUserId,
            approvedAt: '2026-11-22T20:15:00Z',
          },
          versions: [],
          auditLog: [],
        },
      });
      prisma.topicItems.findFirst.mockResolvedValue(null);
      prisma.topicItems.create.mockResolvedValue({
        id: 'topic-item-123',
        topicId,
        title: 'Study Notes: Human Physiology - Neural Control & Coordination',
        status: 'PUBLISHED',
      });
      prisma.aiGeneratedContent.updateMany.mockResolvedValue({ count: 1 });
      prisma.aiGeneratedContent.findUniqueOrThrow.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: true,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:20:00Z'),
      });

      await service.publishNotes(tenantId, recordingId, tutorUserId, 'TUTOR');

      expect(prisma.backgroundJobs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            jobType: 'NOTION_SYNC',
            payload: expect.objectContaining({
              action: 'PUBLISH',
              version: 1,
              contentId: 'content-1',
            }),
          }),
        }),
      );
      expect(prisma.aiGeneratedContent.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            generatedOutput: expect.objectContaining({
              notionSync: expect.objectContaining({
                syncStatus: 'PENDING',
              }),
            }),
          }),
        }),
      );
    });

    it('should set notionSync.syncStatus to NOT_REQUIRED without creating BackgroundJob when Notion integration is inactive', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.liveClasses.findUnique.mockResolvedValue({
        id: liveClassId,
        topicId,
        title: 'Neural Control Live Class',
      });
      prisma.tenantSettings.findFirst.mockResolvedValue(null);
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: false,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:00:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          lifecycle: {
            state: 'APPROVED',
            currentVersion: 1,
            approvedVersion: 1,
            approvedBy: tutorUserId,
            approvedAt: '2026-11-22T20:15:00Z',
          },
          versions: [],
          auditLog: [],
        },
      });
      prisma.topicItems.findFirst.mockResolvedValue(null);
      prisma.topicItems.create.mockResolvedValue({
        id: 'topic-item-123',
        topicId,
        title: 'Study Notes: Human Physiology - Neural Control & Coordination',
        status: 'PUBLISHED',
      });
      prisma.aiGeneratedContent.updateMany.mockResolvedValue({ count: 1 });
      prisma.aiGeneratedContent.findUniqueOrThrow.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: true,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:20:00Z'),
      });

      await service.publishNotes(tenantId, recordingId, tutorUserId, 'TUTOR');

      expect(prisma.backgroundJobs.create).not.toHaveBeenCalled();
      expect(prisma.aiGeneratedContent.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            generatedOutput: expect.objectContaining({
              notionSync: expect.objectContaining({
                syncStatus: 'NOT_REQUIRED',
              }),
            }),
          }),
        }),
      );
    });
  });

  describe('unpublishNotes', () => {
    it('should immediately revoke student access and set TopicItem status to DRAFT', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: true,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:00:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          publishedSnapshot: mockStudyNotes,
          lifecycle: {
            state: 'PUBLISHED',
            currentVersion: 1,
            publishedVersion: 1,
            topicItemId: 'topic-item-123',
          },
          auditLog: [],
        },
      });

      prisma.topicItems.findFirst.mockResolvedValue({
        id: 'topic-item-123',
        status: 'PUBLISHED',
      });
      prisma.topicItems.update.mockResolvedValue({
        id: 'topic-item-123',
        status: 'DRAFT',
      });
      prisma.aiGeneratedContent.update.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: false,
        updatedAt: new Date('2026-11-22T20:30:00Z'),
      });

      const res = await service.unpublishNotes(tenantId, recordingId, tutorUserId, 'TUTOR', {
        reason: 'Temporary revision needed',
      });

      expect(res.isPublished).toBe(false);
      expect(res.lifecycle?.state).toBe('UNPUBLISHED');
      expect(prisma.topicItems.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'topic-item-123' },
          data: expect.objectContaining({ status: 'DRAFT' }),
        }),
      );
    });

    it('should create BackgroundJob with UNPUBLISH action inside transaction when notes had a synced Notion page', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.tenantSettings.findFirst.mockResolvedValue({
        tenantId,
        brandingConfig: {
          notionIntegration: {
            isActive: true,
            apiKeyEncrypted: 'enc-key',
            destinationParentPageId: 'page-parent-123',
          },
        },
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: true,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:00:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          publishedSnapshot: mockStudyNotes,
          notionSync: {
            syncStatus: 'SYNCED',
            notionPageId: 'page-existing-123',
            syncedVersion: 1,
          },
          lifecycle: {
            state: 'PUBLISHED',
            currentVersion: 1,
            publishedVersion: 1,
            topicItemId: 'topic-item-123',
          },
          auditLog: [],
        },
      });

      prisma.topicItems.findFirst.mockResolvedValue({
        id: 'topic-item-123',
        status: 'PUBLISHED',
      });
      prisma.topicItems.update.mockResolvedValue({
        id: 'topic-item-123',
        status: 'DRAFT',
      });
      prisma.aiGeneratedContent.update.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: false,
        updatedAt: new Date('2026-11-22T20:30:00Z'),
      });

      await service.unpublishNotes(tenantId, recordingId, tutorUserId, 'TUTOR', {
        reason: 'Temporary archival',
      });

      expect(prisma.backgroundJobs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            jobType: 'NOTION_SYNC',
            payload: expect.objectContaining({
              action: 'UNPUBLISH',
              version: 1,
              contentId: 'content-1',
            }),
          }),
        }),
      );
      expect(prisma.aiGeneratedContent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            generatedOutput: expect.objectContaining({
              notionSync: expect.objectContaining({
                syncStatus: 'PENDING',
              }),
            }),
          }),
        }),
      );
    });
  });

  describe('HTML Injection & XSS Neutralization', () => {
    it('should safely escape script tags, img tags, and event handlers in renderNotesToHtml', () => {
      const maliciousNotes: RecordedClassStudyNotes = {
        ...mockStudyNotes,
        lecture: {
          ...mockStudyNotes.lecture,
          overview: 'Overview <script>alert("XSS")</script> test',
          learningObjectives: ['Objective <img src=x onerror=alert(1)>'],
        },
        topics: [
          {
            ...mockStudyNotes.topics[0],
            title: 'Topic <svg onload=alert(2)>',
            explanation: 'Explanation with <iframe src="javascript:alert(3)"></iframe>',
          },
        ],
        definitions: [
          {
            term: 'Term "><script>alert(4)</script>',
            definition: 'Definition \' onclick=\'alert(5)',
          },
        ],
        formulaCheatSheet: [
          {
            name: 'Formula <script>alert(6)</script>',
            expression: 'a < b & c > d',
            variableExplanations: 'Variables "test"',
          },
        ],
        importantConcepts: [
          {
            title: 'Concept <script>',
            category: 'HIGH_YIELD',
            explanation: '<a href="javascript:alert(7)">Click me</a>',
            neetRelevance: 'Relevance <script>',
          },
        ],
        workedExamples: [
          {
            problem: 'Problem with <b onmouseover=alert(8)>hover</b>',
            stepByStepExplanation: ['Step with <script>alert(9)</script>'],
            finalResult: 'Result <img onerror=alert(10) src=1>',
          },
        ],
        neetExamPoints: [
          {
            point: 'Point <script>alert(11)</script>',
            relevance: 'CRITICAL',
            potentialQuestionAngle: 'Angle <script>',
          },
        ],
        lectureConclusion: {
          summary: 'Conclusion <script>alert(12)</script>',
          revisionChecklist: ['Checklist <script>alert(13)</script>'],
          homework: [],
        },
      };

      const html = service.renderNotesToHtml(maliciousNotes);

      // Verifies that NO raw unescaped script, img, svg, or iframe tags exist in the output
      expect(html).not.toContain('<script');
      expect(html).not.toContain('</script>');
      expect(html).not.toContain('<img');
      expect(html).not.toContain('<svg');
      expect(html).not.toContain('<iframe');

      // Verifies that dangerous markup was safely converted to inert HTML entities
      expect(html).toContain('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(html).toContain('&lt;svg onload=alert(2)&gt;');
      expect(html).toContain('a &lt; b &amp; c &gt; d');
    });

    it('should neutralize null-byte injection attempts in escapeHtml', () => {
      const maliciousWithNullByte: RecordedClassStudyNotes = {
        ...mockStudyNotes,
        lecture: {
          ...mockStudyNotes.lecture,
          overview: 'Safe text\0<script>alert(1)</script>',
        },
      };

      const html = service.renderNotesToHtml(maliciousWithNullByte);
      expect(html).not.toContain('\0');
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('getStudentNotes', () => {
    it('should return published snapshot for enrolled student without internal draft/quality data', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.liveClasses.findUnique.mockResolvedValue({
        id: liveClassId,
        batchId,
        sessionType: 'BATCH',
      });
      recordingsService.resolveStudentBatchIds.mockResolvedValue([batchId]);
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 2,
        isPublished: true,
        createdAt: new Date('2026-11-22T20:00:00Z'),
        updatedAt: new Date('2026-11-22T20:20:00Z'),
        generatedOutput: {
          status: 'COMPLETED',
          notes: {
            ...mockStudyNotes,
            lecture: { ...mockStudyNotes.lecture, title: 'Draft In Progress (Unpublished)' },
          },
          publishedSnapshot: mockStudyNotes, // Official published snapshot
          lifecycle: {
            state: 'DRAFT',
            currentVersion: 2,
            publishedVersion: 1,
            publishedAt: '2026-11-22T20:20:00Z',
          },
        },
      });

      const res = await service.getStudentNotes(tenantId, recordingId, studentUserId, 'STUDENT');

      expect(res.recordingId).toBe(recordingId);
      expect(res.version).toBe(1);
      // Student receives publishedSnapshot, NOT the working draft
      expect(res.notes.lecture.title).toBe(mockStudyNotes.lecture.title);
      // Internal quality diagnostics and faculty-only metadata are stripped for students
      expect((res.notes as any).quality).toBeUndefined();
    });

    it('should throw ForbiddenException if notes are unpublished', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.liveClasses.findUnique.mockResolvedValue({
        id: liveClassId,
        batchId,
      });
      recordingsService.resolveStudentBatchIds.mockResolvedValue([batchId]);
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 1,
        isPublished: false, // Unpublished!
        generatedOutput: {
          status: 'COMPLETED',
          notes: mockStudyNotes,
          lifecycle: { state: 'DRAFT', currentVersion: 1 },
        },
      });

      await expect(
        service.getStudentNotes(tenantId, recordingId, studentUserId, 'STUDENT'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if student is not enrolled in the class batch', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.liveClasses.findUnique.mockResolvedValue({
        id: liveClassId,
        batchId: 'other-batch',
      });
      recordingsService.resolveStudentBatchIds.mockResolvedValue(['batch-abc']); // Different batch

      await expect(
        service.getStudentNotes(tenantId, recordingId, studentUserId, 'STUDENT'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if 1:1 session recording is accessed by another student', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.liveClasses.findUnique.mockResolvedValue({
        id: liveClassId,
        batchId,
        sessionType: 'ONE_TO_ONE',
        teacherNotes: JSON.stringify({
          sessionType: 'ONE_TO_ONE',
          studentAdmissionId: 'admission-other-student',
        }),
      });
      recordingsService.resolveStudentBatchIds.mockResolvedValue([batchId]);
      recordingsService.resolveStudentAdmissionId.mockResolvedValue('admission-student-1');

      await expect(
        service.getStudentNotes(tenantId, recordingId, studentUserId, 'STUDENT'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getVersionHistory', () => {
    it('should return version snapshots and audit log', async () => {
      prisma.liveClassRecordings.findFirst.mockResolvedValue({
        id: recordingId,
        tenantId,
        liveClassId,
      });
      prisma.aiGeneratedContent.findFirst.mockResolvedValue({
        id: 'content-1',
        version: 2,
        isPublished: true,
        generatedOutput: {
          status: 'COMPLETED',
          lifecycle: { state: 'PUBLISHED', currentVersion: 2, publishedVersion: 2 },
          versions: [
            { version: 1, state: 'AI_GENERATED', createdAt: '2026-11-22T20:00:00Z' },
            { version: 2, state: 'PUBLISHED', createdAt: '2026-11-22T20:20:00Z' },
          ],
          auditLog: [
            {
              action: 'AI_GENERATION_COMPLETED',
              actorId: 'system',
              timestamp: '2026-11-22T20:00:00Z',
              version: 1,
            },
            {
              action: 'CONTENT_PUBLISHED',
              actorId: tutorUserId,
              timestamp: '2026-11-22T20:20:00Z',
              version: 2,
            },
          ],
        },
      });

      const res = await service.getVersionHistory(tenantId, recordingId, tutorUserId, 'TUTOR');

      expect(res.recordingId).toBe(recordingId);
      expect(res.currentVersion).toBe(2);
      expect(res.versions.length).toBe(2);
      expect(res.auditLog.length).toBe(2);
      expect(res.auditLog[1].action).toBe('CONTENT_PUBLISHED');
    });
  });
});
