/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { ForbiddenException } from '@nestjs/common';
import { TutorExamsService } from './tutor-exams.service';

describe('TutorExamsService', () => {
  let service: TutorExamsService;
  let mockPrismaService: any;
  let mockTenantScoped: any;
  let mockStorageService: any;
  let mockExamClosureService: any;
  let mockExamStateService: any;
  let mockTimelineService: any;

  const tenantId = 'tenant-1';
  const tutorUserId = 'tutor-user-1';
  const examId = 'exam-300';
  const submissionId = 'sub-300';

  const mockExam = {
    id: examId,
    tenantId,
    batchId: 'batch-1',
    subjectId: 'subject-1',
    title: 'Grand Test 01',
    totalMarks: 720,
    passingMarks: 360,
    scheduledStartAt: new Date('2026-07-28T09:00:00Z'),
    scheduledEndAt: new Date('2026-07-28T12:00:00Z'),
    isClosed: false,
    resultsPublishedAt: new Date(0),
  };

  const mockSubmission = {
    id: submissionId,
    tenantId,
    examId,
    studentAdmissionId: 'student-adm-1',
    answerSheetFileId: 'file-answers-100',
    status: 'SUBMITTED',
    evaluationStatus: 'PENDING',
    evaluationVersion: 1,
    obtainedMarks: 0,
    marksBreakdown: [],
    tutorNotes: null,
    isResultsPublished: false,
    submittedAt: new Date('2026-07-28T10:00:00Z'),
    evaluationStartedAt: null,
    exam: mockExam,
    history: [],
  };

  beforeEach(() => {
    mockPrismaService = {
      exams: {
        findMany: jest.fn().mockResolvedValue([mockExam]),
        findFirst: jest.fn().mockResolvedValue(mockExam),
        update: jest.fn().mockResolvedValue(mockExam),
      },
      examSubmissions: {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([mockSubmission]),
        findFirst: jest.fn().mockResolvedValue(mockSubmission),
        update: jest
          .fn()
          .mockImplementation(({ data }: any) =>
            Promise.resolve({ ...mockSubmission, ...data }),
          ),
      },
      examSubmissionHistory: {
        create: jest.fn().mockResolvedValue({ id: 'history-1' }),
      },
      $transaction: jest.fn((cb: any) => cb(mockPrismaService)),
    };

    mockTenantScoped = {
      buildWhere: jest
        .fn()
        .mockImplementation((tid: string, extra?: Record<string, unknown>) => ({
          tenantId: tid,
          deletedAt: null,
          ...extra,
        })),
    };

    mockStorageService = {
      createSignedUrl: jest
        .fn()
        .mockResolvedValue('https://signed.url/answers.pdf'),
    };

    mockExamClosureService = {
      checkAndTriggerLazyClosure: jest.fn().mockResolvedValue(false),
    };

    mockExamStateService = {
      canTutorEvaluate: jest.fn().mockReturnValue(true),
    };

    mockTimelineService = {
      logEvent: jest.fn().mockResolvedValue({ id: 'tl-1' }),
    };

    const mockOnlineCbtService: any = {
      seedSampleQuestionsIfEmpty: jest.fn().mockResolvedValue(undefined),
    };

    service = new TutorExamsService(
      mockPrismaService,
      mockTenantScoped,
      mockStorageService,
      mockExamClosureService,
      mockExamStateService,
      mockTimelineService,
      mockOnlineCbtService,
    );
  });

  describe('getExamSubmissionsBuckets', () => {
    it('categorizes submissions into workload buckets', async () => {
      const result = await service.getExamSubmissionsBuckets(
        tenantId,
        tutorUserId,
        examId,
      );

      expect(result.examId).toBe(examId);
      expect(result.todaysPending).toHaveLength(1);
      expect(result.completed).toHaveLength(0);
      expect(result.absent).toHaveLength(0);
    });
  });

  describe('getSubmissionDetail', () => {
    it('returns submission detail with answer sheet signed URL and starts evaluation', async () => {
      const result = await service.getSubmissionDetail(
        tenantId,
        tutorUserId,
        examId,
        submissionId,
      );

      expect(result.id).toBe(submissionId);
      expect(result.answerSheetSignedUrl).toBe(
        'https://signed.url/answers.pdf',
      );
      expect(mockPrismaService.examSubmissions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: submissionId },
          data: expect.objectContaining({ evaluationStatus: 'IN_PROGRESS' }),
        }),
      );
    });
  });

  describe('evaluateSubmission', () => {
    it('saves marks breakdown, tutor notes, and audit history record atomically', async () => {
      const dto = {
        obtainedMarks: 150,
        marksBreakdown: [
          {
            sectionId: 'sec-1',
            sectionName: 'Physics',
            obtainedMarks: 75,
            maxMarks: 90,
          },
          {
            sectionId: 'sec-2',
            sectionName: 'Chemistry',
            obtainedMarks: 75,
            maxMarks: 90,
          },
        ],
        tutorNotes: 'Good attempt in Physics',
        reason: 'Initial evaluation',
      };

      const result = await service.evaluateSubmission(
        tenantId,
        tutorUserId,
        examId,
        submissionId,
        dto,
      );

      expect(result.submission.obtainedMarks).toBe(150);
      expect(result.submission.evaluationStatus).toBe('COMPLETED');
      expect(
        mockPrismaService.examSubmissionHistory.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            submissionId,
            editedByUserId: tutorUserId,
            newMarks: 150,
            reason: 'Initial evaluation',
          }),
        }),
      );
    });

    it('throws ForbiddenException if evaluation is locked or already approved', async () => {
      mockExamStateService.canTutorEvaluate.mockReturnValue(false);

      const dto = { obtainedMarks: 150 };

      await expect(
        service.evaluateSubmission(
          tenantId,
          tutorUserId,
          examId,
          submissionId,
          dto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
