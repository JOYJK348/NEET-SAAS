/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ExamApprovalService } from './exam-approval.service';
import { ExamPublishStatusEnum, SubmissionTimelineEvent } from '@prisma/client';

describe('ExamApprovalService', () => {
  let service: ExamApprovalService;
  let mockPrisma: any;
  let mockPublishChecklistService: any;
  let mockRankingService: any;
  let mockTimelineService: any;

  const tenantId = 'tenant-1';
  const examId = 'exam-100';
  const submissionId = 'sub-100';
  const adminUserId = 'admin-user-1';

  const mockExam = {
    id: examId,
    tenantId,
    title: 'NEET Grand Test 01',
    publishStatus: ExamPublishStatusEnum.UNDER_REVIEW,
    isClosed: true,
    evaluationLockedAt: null,
    evaluationLockedBy: null,
    resultsPublishedAt: new Date(0),
  };

  const mockSubmission = {
    id: submissionId,
    tenantId,
    examId,
    status: 'SUBMITTED',
    evaluationStatus: 'COMPLETED',
    evaluationApproved: false,
    isResultsPublished: false,
    obtainedMarks: 150,
  };

  beforeEach(() => {
    mockPrisma = {
      exams: {
        findFirst: jest.fn().mockResolvedValue(mockExam),
        update: jest
          .fn()
          .mockImplementation(({ data }: any) =>
            Promise.resolve({ ...mockExam, ...data }),
          ),
      },
      examSubmissions: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(mockSubmission),
        findMany: jest.fn().mockResolvedValue([mockSubmission]),
        update: jest
          .fn()
          .mockImplementation(({ data }: any) =>
            Promise.resolve({ ...mockSubmission, ...data }),
          ),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        aggregate: jest.fn().mockResolvedValue({
          _avg: { obtainedMarks: 150 },
          _max: { obtainedMarks: 180 },
          _min: { obtainedMarks: 120 },
        }),
      },
      $transaction: jest.fn((cb: any) => cb(mockPrisma)),
    };

    mockPublishChecklistService = {
      validateChecklist: jest.fn().mockResolvedValue({
        canPublish: true,
        items: [{ key: 'ALL_EVALUATED', label: 'All evaluated', passed: true }],
      }),
    };

    mockRankingService = {
      calculateExamRanks: jest.fn().mockResolvedValue({ updatedCount: 1 }),
    };

    mockTimelineService = {
      logEvent: jest.fn().mockResolvedValue({ id: 'tl-1' }),
    };

    service = new ExamApprovalService(
      mockPrisma,
      mockPublishChecklistService,
      mockRankingService,
      mockTimelineService,
    );
  });

  describe('approveSubmission', () => {
    it('sets evaluationApproved = true and logs APPROVED timeline event', async () => {
      await service.approveSubmission(
        tenantId,
        examId,
        submissionId,
        adminUserId,
      );

      expect(mockPrisma.examSubmissions.update).toHaveBeenCalledWith({
        where: { id: submissionId },
        data: expect.objectContaining({
          evaluationApproved: true,
          approvedByUserId: adminUserId,
        }),
      });
      expect(mockTimelineService.logEvent).toHaveBeenCalledWith(
        tenantId,
        submissionId,
        SubmissionTimelineEvent.APPROVED,
        adminUserId,
      );
    });

    it('throws ForbiddenException if results are already published', async () => {
      mockPrisma.examSubmissions.findFirst.mockResolvedValue({
        ...mockSubmission,
        isResultsPublished: true,
      });

      await expect(
        service.approveSubmission(tenantId, examId, submissionId, adminUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('rejectSubmission', () => {
    it('sets evaluationStatus = RE_EVALUATION and logs RETURNED event with reason', async () => {
      await service.rejectSubmission(
        tenantId,
        examId,
        submissionId,
        adminUserId,
        'Recalculate Section B marks',
      );

      expect(mockPrisma.examSubmissions.update).toHaveBeenCalledWith({
        where: { id: submissionId },
        data: expect.objectContaining({
          evaluationApproved: false,
          evaluationStatus: 'RE_EVALUATION',
          rejectionReason: 'Recalculate Section B marks',
        }),
      });
      expect(mockTimelineService.logEvent).toHaveBeenCalledWith(
        tenantId,
        submissionId,
        SubmissionTimelineEvent.RETURNED,
        adminUserId,
        { reason: 'Recalculate Section B marks' },
      );
    });

    it('throws BadRequestException if rejection reason is empty', async () => {
      await expect(
        service.rejectSubmission(
          tenantId,
          examId,
          submissionId,
          adminUserId,
          '',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveAll', () => {
    it('bulk approves evaluated submissions, locks evaluation, and sets publishStatus = ADMIN_REVIEW', async () => {
      const result = await service.approveAll(tenantId, examId, adminUserId);

      expect(result.approvedCount).toBe(1);
      expect(mockPrisma.exams.update).toHaveBeenCalledWith({
        where: { id: examId },
        data: expect.objectContaining({
          publishStatus: ExamPublishStatusEnum.ADMIN_REVIEW,
          evaluationLockedBy: adminUserId,
        }),
      });
    });

    it('throws BadRequestException if unevaluated submissions exist', async () => {
      mockPrisma.examSubmissions.count.mockResolvedValue(3); // 3 unevaluated

      await expect(
        service.approveAll(tenantId, examId, adminUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('publishResults', () => {
    it('executes ranking engine, updates status to RESULT_PUBLISHED, and logs RESULTS_PUBLISHED event', async () => {
      await service.publishResults(tenantId, examId, adminUserId);

      expect(mockRankingService.calculateExamRanks).toHaveBeenCalled();
      expect(mockPrisma.exams.update).toHaveBeenCalledWith({
        where: { id: examId },
        data: expect.objectContaining({
          publishStatus: ExamPublishStatusEnum.RESULT_PUBLISHED,
          resultsPublishedBy: adminUserId,
        }),
      });
    });

    it('throws BadRequestException if publish checklist fails', async () => {
      mockPublishChecklistService.validateChecklist.mockResolvedValue({
        canPublish: false,
        items: [{ key: 'ALL_APPROVED', label: 'All approved', passed: false }],
      });

      await expect(
        service.publishResults(tenantId, examId, adminUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
