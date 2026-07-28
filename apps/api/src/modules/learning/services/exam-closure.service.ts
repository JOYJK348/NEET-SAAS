import { Injectable, NotFoundException } from '@nestjs/common';
import { ExamSubmissionStatusEnum, EvaluationStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class ExamClosureService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotent exam closure logic.
   * Locks submissions, sets isClosed = true, and generates ABSENT submissions
   * in a single transaction for all enrolled students without an existing submission.
   */
  async closeExam(
    tenantId: string,
    examId: string,
    userId: string,
  ): Promise<{ closed: boolean; absentsCreated: number }> {
    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.isClosed) {
      return { closed: true, absentsCreated: 0 };
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Re-check isClosed inside transaction to prevent race conditions
      const currentExam = await tx.exams.findFirst({
        where: { id: examId, tenantId, deletedAt: null },
      });

      if (!currentExam || currentExam.isClosed) {
        return { closed: true, absentsCreated: 0 };
      }

      // 2. Lock submissions and mark exam as closed
      await tx.exams.update({
        where: { id: examId },
        data: {
          isClosed: true,
          closedAt: now,
          isSubmissionLocked: true,
          submissionLockedAt: currentExam.submissionLockedAt ?? now,
          updatedBy: userId,
        },
      });

      // 3. Find all active student enrollments for this exam's batch
      const enrollments = await tx.studentBatchEnrollments.findMany({
        where: {
          batchId: currentExam.batchId,
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: { studentAdmissionId: true },
      });

      // 4. Find all existing submissions for this exam
      const existingSubmissions = await tx.examSubmissions.findMany({
        where: {
          examId,
          tenantId,
          deletedAt: null,
        },
        select: { studentAdmissionId: true },
      });

      const existingAdmissionIds = new Set(
        existingSubmissions.map((s) => s.studentAdmissionId),
      );

      // 5. Filter enrolled students who have no submission record
      const absentAdmissionIds = Array.from(
        new Set(
          enrollments
            .map((e) => e.studentAdmissionId)
            .filter(
              (id): id is string =>
                Boolean(id) && !existingAdmissionIds.has(id),
            ),
        ),
      );

      if (absentAdmissionIds.length === 0) {
        return { closed: true, absentsCreated: 0 };
      }

      // 6. Create ABSENT submissions for students without a submission
      const absentRecords = absentAdmissionIds.map((studentAdmissionId) => ({
        tenantId,
        examId,
        studentAdmissionId,
        status: ExamSubmissionStatusEnum.ABSENT,
        evaluationStatus: EvaluationStatusEnum.PENDING,
        obtainedMarks: 0.0,
        createdBy: userId,
        updatedBy: userId,
      }));

      await tx.examSubmissions.createMany({
        data: absentRecords,
        skipDuplicates: true,
      });

      return { closed: true, absentsCreated: absentRecords.length };
    });
  }

  /**
   * Locks submissions for an exam manually or automatically.
   */
  async lockSubmissions(
    tenantId: string,
    examId: string,
    userId: string,
  ): Promise<boolean> {
    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.isSubmissionLocked) {
      return true;
    }

    await this.prisma.exams.update({
      where: { id: examId },
      data: {
        isSubmissionLocked: true,
        submissionLockedAt: new Date(),
        updatedBy: userId,
      },
    });

    return true;
  }

  /**
   * Helper to trigger closure lazily if scheduled end time has passed.
   */
  async checkAndTriggerLazyClosure(
    tenantId: string,
    examId: string,
    userId: string,
  ): Promise<boolean> {
    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
    });

    if (!exam || exam.isClosed) {
      return exam?.isClosed ?? false;
    }

    if (new Date() > exam.scheduledEndAt) {
      const result = await this.closeExam(tenantId, examId, userId);
      return result.closed;
    }

    return false;
  }
}
