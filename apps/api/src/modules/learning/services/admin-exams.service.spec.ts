/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { BadRequestException } from '@nestjs/common';
import { AdminExamsService } from './admin-exams.service';

describe('AdminExamsService', () => {
  let service: AdminExamsService;
  let mockPrismaService: any;
  let mockTenantScoped: any;
  let mockStorageService: any;
  let mockExamClosureService: any;
  let mockExamApprovalService: any;

  const tenantId = 'tenant-1';
  const userId = 'admin-1';
  const examId = 'exam-100';

  const mockExam = {
    id: examId,
    tenantId,
    courseId: 'course-1',
    batchId: 'batch-1',
    subjectId: 'subject-1',
    academicYearId: 'year-1',
    title: 'NEET Practice Test 01',
    publishStatus: 'DRAFT',
    status: 'SCHEDULED',
    questionPaperFileId: null,
    answerKeyFileId: null,
    resultsPublishedAt: new Date(0),
    scheduledStartAt: new Date('2026-07-28T09:00:00Z'),
    scheduledEndAt: new Date('2026-07-28T12:00:00Z'),
  };

  beforeEach(() => {
    mockPrismaService = {
      exams: {
        create: jest
          .fn()
          .mockImplementation(({ data }: any) =>
            Promise.resolve({ id: examId, ...data }),
          ),
        findFirst: jest.fn().mockResolvedValue(mockExam),
        update: jest
          .fn()
          .mockImplementation(({ data }: any) =>
            Promise.resolve({ ...mockExam, ...data }),
          ),
        findMany: jest.fn().mockResolvedValue([mockExam]),
        count: jest.fn().mockResolvedValue(1),
      },
      studentBatchEnrollments: {
        count: jest.fn().mockResolvedValue(50),
      },
      examSubmissions: {
        count: jest.fn().mockResolvedValue(40),
        aggregate: jest.fn().mockResolvedValue({
          _avg: { obtainedMarks: 140 },
          _max: { obtainedMarks: 175 },
          _min: { obtainedMarks: 80 },
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 40 }),
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
      uploadFile: jest.fn().mockResolvedValue({ id: 'file-paper-1' }),
      createSignedUrl: jest
        .fn()
        .mockResolvedValue('https://signed.url/paper.pdf'),
    };

    mockExamClosureService = {
      closeExam: jest
        .fn()
        .mockResolvedValue({ closed: true, absentsCreated: 5 }),
      lockSubmissions: jest.fn().mockResolvedValue(true),
      checkAndTriggerLazyClosure: jest.fn().mockResolvedValue(false),
    };

    mockExamApprovalService = {
      publishResults: jest
        .fn()
        .mockResolvedValue({ success: true, resultsPublishedAt: new Date() }),
    };

    service = new AdminExamsService(
      mockPrismaService,
      mockTenantScoped,
      mockStorageService,
      mockExamClosureService,
      mockExamApprovalService,
    );
  });

  describe('createExam', () => {
    it('creates exam with DRAFT publishStatus', async () => {
      const dto = {
        courseId: 'course-1',
        batchId: 'batch-1',
        subjectId: 'subject-1',
        academicYearId: 'year-1',
        title: 'NEET Practice Test 01',
        examType: 'WEEKLY' as any,
        mode: 'OFFLINE' as any,
        totalMarks: 720,
        passingMarks: 360,
        durationMinutes: 180,
        scheduledStartAt: '2026-07-28T09:00:00Z',
        scheduledEndAt: '2026-07-28T12:00:00Z',
      };

      const result = await service.createExam(tenantId, userId, dto);

      expect(result.id).toBe(examId);
      expect(result.publishStatus).toBe('DRAFT');
    });

    it('throws BadRequestException when scheduled end is before start', async () => {
      const invalidDto = {
        courseId: 'course-1',
        batchId: 'batch-1',
        subjectId: 'subject-1',
        academicYearId: 'year-1',
        title: 'Invalid Exam',
        examType: 'WEEKLY' as any,
        mode: 'OFFLINE' as any,
        totalMarks: 720,
        passingMarks: 360,
        durationMinutes: 180,
        scheduledStartAt: '2026-07-28T12:00:00Z',
        scheduledEndAt: '2026-07-28T09:00:00Z',
      };

      await expect(
        service.createExam(tenantId, userId, invalidDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadQuestionPaper', () => {
    it('uploads PDF file to storage and links questionPaperFileId', async () => {
      const mockFile = { originalname: 'paper.pdf' } as Express.Multer.File;

      const result = await service.uploadQuestionPaper(
        tenantId,
        userId,
        examId,
        mockFile,
      );

      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          userId,
          file: mockFile,
          fileType: 'QUESTION_PAPER',
        }),
      );
      expect(result.exam.questionPaperFileId).toBe('file-paper-1');
    });
  });

  describe('publishResults', () => {
    it('delegates result publication to ExamApprovalService', async () => {
      await service.publishResults(tenantId, userId, examId);

      expect(mockExamApprovalService.publishResults).toHaveBeenCalledWith(
        tenantId,
        examId,
        userId,
      );
    });
  });
});
