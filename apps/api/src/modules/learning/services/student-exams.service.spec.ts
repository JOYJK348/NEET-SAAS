/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { StudentExamsService } from './student-exams.service';
import { ExamPublishStatusEnum, SubmissionTimelineEvent } from '@prisma/client';

describe('StudentExamsService', () => {
  let service: StudentExamsService;
  let mockPrismaService: any;
  let mockTenantScoped: any;
  let mockStorageService: any;
  let mockExamClosureService: any;
  let mockExamStateService: any;
  let mockTimelineService: any;

  const tenantId = 'tenant-1';
  const userId = 'student-user-1';
  const examId = 'exam-200';
  const admissionId = 'admission-1';

  const mockExam = {
    id: examId,
    tenantId,
    batchId: 'batch-1',
    title: 'Weekly Test 01',
    publishStatus: ExamPublishStatusEnum.PUBLISHED,
    scheduledStartAt: new Date('2026-07-28T09:00:00Z'),
    scheduledEndAt: new Date('2026-07-28T17:00:00Z'),
    examWindowStart: new Date('2026-07-28T09:00:00Z'),
    examWindowEnd: new Date('2026-07-28T17:00:00Z'),
    durationMinutes: 120,
    graceMinutes: 15,
    allowLateUpload: true,
    allowReplaceUpload: true,
    requireFullDurationWindow: false,
    isClosed: false,
    isSubmissionLocked: false,
    questionPaperFileId: 'qp-file-100',
    resultsPublishedAt: new Date(0),
    totalMarks: 180,
    passingMarks: 90,
  };

  const mockAdmission = {
    id: admissionId,
    studentProfileId: userId,
    tenantId,
  };

  beforeEach(() => {
    mockPrismaService = {
      studentAdmissions: {
        findFirst: jest.fn().mockResolvedValue(mockAdmission),
      },
      studentBatchEnrollments: {
        findFirst: jest.fn().mockResolvedValue({ batchId: 'batch-1' }),
      },
      exams: {
        findMany: jest.fn().mockResolvedValue([mockExam]),
        findFirst: jest.fn().mockResolvedValue(mockExam),
      },
      examSubmissions: {
        findFirst: jest.fn().mockResolvedValue(null),
        upsert: jest
          .fn()
          .mockImplementation(({ create }: any) =>
            Promise.resolve({ id: 'sub-1', ...create }),
          ),
        create: jest
          .fn()
          .mockImplementation(({ data }: any) =>
            Promise.resolve({ id: 'sub-1', ...data }),
          ),
        update: jest
          .fn()
          .mockImplementation(({ data }: any) =>
            Promise.resolve({ id: 'sub-1', ...data }),
          ),
      },
      examSubmissionTimeline: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'tl-1' }),
      },
      examSubmissionFiles: {
        create: jest.fn().mockResolvedValue({ id: 'esf-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
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
      uploadFile: jest.fn().mockResolvedValue({ id: 'file-answer-1' }),
      replaceFile: jest.fn().mockResolvedValue({ id: 'file-answer-2' }),
      createSignedUrl: jest
        .fn()
        .mockResolvedValue('https://signed.url/paper.pdf'),
    };

    mockExamClosureService = {
      checkAndTriggerLazyClosure: jest.fn().mockResolvedValue(false),
      closeExam: jest.fn().mockResolvedValue({ closed: true }),
    };

    mockExamStateService = {
      getExamState: jest.fn().mockReturnValue('LIVE'),
      canStudentStart: jest.fn().mockReturnValue(true),
      resolveUploadStatus: jest.fn().mockReturnValue('ALLOWED'),
    };

    mockTimelineService = {
      logEvent: jest.fn().mockResolvedValue({ id: 'tl-1' }),
    };

    service = new StudentExamsService(
      mockPrismaService,
      mockTenantScoped,
      mockStorageService,
      mockExamClosureService,
      mockExamStateService,
      mockTimelineService,
    );
  });

  describe('startExam', () => {
    it('initializes timer fields and logs STARTED event when student starts exam', async () => {
      const result = await service.startExam(tenantId, userId, examId);

      expect(mockExamStateService.canStudentStart).toHaveBeenCalled();
      expect(mockPrismaService.examSubmissions.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            examId_studentAdmissionId: expect.objectContaining({
              examId,
              studentAdmissionId: admissionId,
            }),
          }),
        }),
      );
      expect(
        mockPrismaService.examSubmissionTimeline.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event: SubmissionTimelineEvent.STARTED,
          }),
        }),
      );
      expect(result.startedAt).toBeDefined();
      expect(result.submissionId).toBeDefined();
    });

    it('throws BadRequestException if student cannot start exam', async () => {
      mockExamStateService.canStudentStart.mockReturnValue(false);

      await expect(service.startExam(tenantId, userId, examId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getQuestionPaperUrl', () => {
    it('returns question paper signed URL if student has started exam', async () => {
      mockPrismaService.examSubmissions.findFirst.mockResolvedValue({
        id: 'sub-1',
        startedAt: new Date('2026-07-28T10:00:00Z'),
      });

      const result = await service.getQuestionPaperUrl(
        tenantId,
        userId,
        examId,
      );

      expect(result.questionPaperSignedUrl).toBe(
        'https://signed.url/paper.pdf',
      );
      expect(mockTimelineService.logEvent).toHaveBeenCalledWith(
        tenantId,
        'sub-1',
        SubmissionTimelineEvent.QP_DOWNLOADED,
        userId,
        undefined,
      );
    });

    it('throws ForbiddenException if student has not started exam yet', async () => {
      mockPrismaService.examSubmissions.findFirst.mockResolvedValue(null);

      await expect(
        service.getQuestionPaperUrl(tenantId, userId, examId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('heartbeat', () => {
    it('updates lastSeenAt and logs HEARTBEAT event', async () => {
      mockPrismaService.examSubmissions.findFirst.mockResolvedValue({
        id: 'sub-1',
        startedAt: new Date('2026-07-28T10:00:00Z'),
      });

      const result = await service.heartbeat(tenantId, userId, examId);

      expect(result.success).toBe(true);
      expect(mockPrismaService.examSubmissions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({ lastSeenAt: expect.any(Date) }),
        }),
      );
      expect(mockTimelineService.logEvent).toHaveBeenCalledWith(
        tenantId,
        'sub-1',
        SubmissionTimelineEvent.HEARTBEAT,
        userId,
        undefined,
      );
    });
  });

  describe('uploadAnswerSheet', () => {
    it('uploads answer sheet and tracks file in ExamSubmissionFiles', async () => {
      // First call inside uploadAnswerSheet: returns submission without answerSheetFileId → first-time upload
      mockPrismaService.examSubmissions.findFirst
        .mockResolvedValueOnce({
          id: 'sub-1',
          startedAt: new Date('2026-07-28T10:00:00Z'),
          calculatedEndAt: new Date('2026-07-28T12:00:00Z'),
        })
        // Second call after transaction: returns submission with answerSheetFileId set
        .mockResolvedValueOnce({
          id: 'sub-1',
          startedAt: new Date('2026-07-28T10:00:00Z'),
          calculatedEndAt: new Date('2026-07-28T12:00:00Z'),
          answerSheetFileId: 'file-answer-1',
        });

      const mockFile = { originalname: 'answers.pdf' } as Express.Multer.File;
      const result = await service.uploadAnswerSheet(
        tenantId,
        userId,
        examId,
        mockFile,
      );

      expect(mockStorageService.uploadFile).toHaveBeenCalled();
      expect(mockPrismaService.examSubmissionFiles.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            submissionId: 'sub-1',
            fileUploadId: 'file-answer-1',
            fileType: 'CURRENT',
          }),
        }),
      );
      expect(result.submission!.answerSheetFileId).toBe('file-answer-1');
    });
  });
});
