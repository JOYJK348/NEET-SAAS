/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { NotFoundException } from '@nestjs/common';
import { ExamClosureService } from './exam-closure.service';

describe('ExamClosureService', () => {
  let service: ExamClosureService;
  let mockPrismaService: any;

  const tenantId = 'tenant-1';
  const examId = 'exam-1';
  const userId = 'admin-1';
  const batchId = 'batch-1';

  const mockExam = {
    id: examId,
    tenantId,
    batchId,
    isClosed: false,
    isSubmissionLocked: false,
    scheduledEndAt: new Date('2026-07-28T00:00:00Z'),
  };

  beforeEach(() => {
    mockPrismaService = {
      exams: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      studentBatchEnrollments: {
        findMany: jest.fn(),
      },
      examSubmissions: {
        findMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn((cb: any) => cb(mockPrismaService)),
    };

    service = new ExamClosureService(mockPrismaService);
  });

  describe('closeExam', () => {
    it('throws NotFoundException when exam is not found', async () => {
      mockPrismaService.exams.findFirst.mockResolvedValue(null);

      await expect(
        service.closeExam(tenantId, 'non-existent', userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns closed: true with 0 absents if exam is already closed (idempotent)', async () => {
      mockPrismaService.exams.findFirst.mockResolvedValue({
        ...mockExam,
        isClosed: true,
      });

      const result = await service.closeExam(tenantId, examId, userId);

      expect(result).toEqual({ closed: true, absentsCreated: 0 });
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('closes exam and creates ABSENT submissions for enrolled students without submissions', async () => {
      mockPrismaService.exams.findFirst.mockResolvedValue(mockExam);
      mockPrismaService.studentBatchEnrollments.findMany.mockResolvedValue([
        { studentAdmissionId: 'student-adm-1' },
        { studentAdmissionId: 'student-adm-2' },
      ]);
      mockPrismaService.examSubmissions.findMany.mockResolvedValue([
        { studentAdmissionId: 'student-adm-1' }, // student 1 already submitted
      ]);
      mockPrismaService.examSubmissions.createMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.closeExam(tenantId, examId, userId);

      expect(result).toEqual({ closed: true, absentsCreated: 1 });
      expect(mockPrismaService.exams.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: examId },
          data: expect.objectContaining({
            isClosed: true,
            isSubmissionLocked: true,
          }),
        }),
      );
      expect(mockPrismaService.examSubmissions.createMany).toHaveBeenCalledWith(
        {
          data: [
            expect.objectContaining({
              tenantId,
              examId,
              studentAdmissionId: 'student-adm-2',
              status: 'ABSENT',
            }),
          ],
          skipDuplicates: true,
        },
      );
    });
  });

  describe('lockSubmissions', () => {
    it('locks submissions if not already locked', async () => {
      mockPrismaService.exams.findFirst.mockResolvedValue(mockExam);

      const result = await service.lockSubmissions(tenantId, examId, userId);

      expect(result).toBe(true);
      expect(mockPrismaService.exams.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: examId },
          data: expect.objectContaining({
            isSubmissionLocked: true,
          }),
        }),
      );
    });
  });
});
