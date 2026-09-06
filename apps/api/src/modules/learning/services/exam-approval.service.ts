import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PublishChecklistService } from './publish-checklist.service';
import { RankingService } from './ranking.service';
import { TimelineService } from './timeline.service';
import { ExamPublishStatusEnum, SubmissionTimelineEvent } from '@prisma/client';

@Injectable()
export class ExamApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publishChecklistService: PublishChecklistService,
    private readonly rankingService: RankingService,
    private readonly timelineService: TimelineService,
  ) {}

  /**
   * Generates evaluation review summary and statistics for Tenant Admin review screen
   */
  async getReviewSummary(tenantId: string, examId: string) {
    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const totalSubmissions = await this.prisma.examSubmissions.count({
      where: { tenantId, examId, deletedAt: null },
    });

    const submittedCount = await this.prisma.examSubmissions.count({
      where: {
        tenantId,
        examId,
        status: { in: ['SUBMITTED', 'LATE'] },
        deletedAt: null,
      },
    });

    const absentCount = await this.prisma.examSubmissions.count({
      where: { tenantId, examId, status: 'ABSENT', deletedAt: null },
    });

    const evaluatedCount = await this.prisma.examSubmissions.count({
      where: {
        tenantId,
        examId,
        evaluationStatus: 'COMPLETED',
        deletedAt: null,
      },
    });

    const pendingEvaluationCount = await this.prisma.examSubmissions.count({
      where: {
        tenantId,
        examId,
        status: { not: 'ABSENT' },
        evaluationStatus: { not: 'COMPLETED' },
        deletedAt: null,
      },
    });

    const approvedCount = await this.prisma.examSubmissions.count({
      where: { tenantId, examId, evaluationApproved: true, deletedAt: null },
    });

    const unapprovedCount = await this.prisma.examSubmissions.count({
      where: {
        tenantId,
        examId,
        status: { not: 'ABSENT' },
        evaluationApproved: false,
        deletedAt: null,
      },
    });

    const returnedCount = await this.prisma.examSubmissions.count({
      where: {
        tenantId,
        examId,
        evaluationStatus: 'RE_EVALUATION',
        deletedAt: null,
      },
    });

    const [aggregatedMarks, rawSubmissions] = await Promise.all([
      this.prisma.examSubmissions.aggregate({
        where: {
          tenantId,
          examId,
          evaluationStatus: 'COMPLETED',
          status: { not: 'ABSENT' },
          deletedAt: null,
        },
        _avg: { obtainedMarks: true },
        _max: { obtainedMarks: true },
        _min: { obtainedMarks: true },
      }),
      this.prisma.examSubmissions.findMany({
        where: { tenantId, examId, deletedAt: null },
        include: {
          studentAdmission: {
            include: {
              studentProfileIstudent_profile: {
                include: { userIdusers: true },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);

    const evaluatorUserIds = Array.from(
      new Set(
        rawSubmissions
          .map((s) => s.evaluatedByUserId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const evaluatorUsers =
      evaluatorUserIds.length > 0
        ? await this.prisma.users.findMany({
            where: { id: { in: evaluatorUserIds } },
            select: { id: true, firstName: true, lastName: true, email: true },
          })
        : [];

    const evaluatorMap = new Map(
      evaluatorUsers.map((u) => [
        u.id,
        `${u.firstName} ${u.lastName}`.trim() || u.email,
      ]),
    );

    const submissions = rawSubmissions.map((sub) => {
      const studentUser =
        sub.studentAdmission?.studentProfileIstudent_profile?.userIdusers;
      const studentName = studentUser
        ? `${studentUser.firstName} ${studentUser.lastName}`.trim()
        : 'Student';

      const evaluatorName =
        sub.evaluatedByUserId === 'SYSTEM_CBT' || exam.mode === 'ONLINE'
          ? 'Auto-Calculated (CBT Engine)'
          : sub.evaluatedByUserId
            ? evaluatorMap.get(sub.evaluatedByUserId) || 'Assigned Tutor'
            : null;

      return {
        id: sub.id,
        studentAdmissionId: sub.studentAdmissionId,
        studentName,
        status: sub.status,
        evaluationStatus: sub.evaluationStatus,
        evaluationApproved: sub.evaluationApproved,
        obtainedMarks: Number(sub.obtainedMarks),
        evaluatedByUserId: sub.evaluatedByUserId,
        evaluatedByName: evaluatorName,
        evaluatedAt: sub.evaluatedAt,
        rejectionReason: sub.rejectionReason,
        submittedAt: sub.submittedAt,
      };
    });

    return {
      examId: exam.id,
      title: exam.title,
      mode: exam.mode,
      publishStatus: exam.publishStatus,
      isClosed: exam.isClosed,
      evaluationLockedAt: exam.evaluationLockedAt,
      evaluationLockedBy: exam.evaluationLockedBy,
      resultsPublishedAt: exam.resultsPublishedAt,
      stats: {
        totalSubmissions,
        submittedCount,
        absentCount,
        evaluatedCount,
        pendingEvaluationCount,
        approvedCount,
        unapprovedCount,
        returnedCount,
        averageMarks: aggregatedMarks._avg.obtainedMarks
          ? Number(aggregatedMarks._avg.obtainedMarks)
          : 0,
        highestMarks: aggregatedMarks._max.obtainedMarks
          ? Number(aggregatedMarks._max.obtainedMarks)
          : 0,
        lowestMarks: aggregatedMarks._min.obtainedMarks
          ? Number(aggregatedMarks._min.obtainedMarks)
          : 0,
      },
      submissions,
    };
  }

  /**
   * Admin approves a single submission's evaluation
   */
  async approveSubmission(
    tenantId: string,
    examId: string,
    submissionId: string,
    adminUserId: string,
  ) {
    const submission = await this.prisma.examSubmissions.findFirst({
      where: { id: submissionId, examId, tenantId, deletedAt: null },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.isResultsPublished) {
      throw new ForbiddenException(
        'Results are already published for this exam',
      );
    }

    const now = new Date();
    const updated = await this.prisma.examSubmissions.update({
      where: { id: submissionId },
      data: {
        evaluationApproved: true,
        approvedByUserId: adminUserId,
        approvedAt: now,
        rejectionReason: null,
        updatedBy: adminUserId,
      },
    });

    await this.timelineService.logEvent(
      tenantId,
      submissionId,
      SubmissionTimelineEvent.APPROVED,
      adminUserId,
    );

    return updated;
  }

  /**
   * Admin rejects/returns a submission evaluation to tutor with mandatory reason
   */
  async rejectSubmission(
    tenantId: string,
    examId: string,
    submissionId: string,
    adminUserId: string,
    reason: string,
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException(
        'Rejection reason is mandatory when returning evaluation to tutor',
      );
    }

    const submission = await this.prisma.examSubmissions.findFirst({
      where: { id: submissionId, examId, tenantId, deletedAt: null },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.isResultsPublished) {
      throw new ForbiddenException(
        'Results are already published for this exam',
      );
    }

    const updated = await this.prisma.examSubmissions.update({
      where: { id: submissionId },
      data: {
        evaluationApproved: false,
        evaluationStatus: 'RE_EVALUATION',
        rejectionReason: reason,
        updatedBy: adminUserId,
      },
    });

    await this.timelineService.logEvent(
      tenantId,
      submissionId,
      SubmissionTimelineEvent.RETURNED,
      adminUserId,
      { reason },
    );

    return updated;
  }

  /**
   * Bulk approve all evaluated submissions and lock evaluation phase (`ADMIN_REVIEW`)
   */
  async approveAll(tenantId: string, examId: string, adminUserId: string) {
    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const unevaluatedCount = await this.prisma.examSubmissions.count({
      where: {
        tenantId,
        examId,
        status: { not: 'ABSENT' },
        evaluationStatus: { not: 'COMPLETED' },
        deletedAt: null,
      },
    });

    if (unevaluatedCount > 0) {
      throw new BadRequestException(
        `Cannot approve all. ${unevaluatedCount} non-absent submissions are still pending evaluation.`,
      );
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Bulk approve all evaluated non-absent submissions
      await tx.examSubmissions.updateMany({
        where: {
          tenantId,
          examId,
          status: { not: 'ABSENT' },
          evaluationStatus: 'COMPLETED',
          deletedAt: null,
        },
        data: {
          evaluationApproved: true,
          approvedByUserId: adminUserId,
          approvedAt: now,
          updatedBy: adminUserId,
        },
      });

      // 2. Lock evaluation on Exams model and set publishStatus = ADMIN_REVIEW
      const updatedExam = await tx.exams.update({
        where: { id: examId },
        data: {
          evaluationLockedAt: now,
          evaluationLockedBy: adminUserId,
          publishStatus: ExamPublishStatusEnum.ADMIN_REVIEW,
          updatedBy: adminUserId,
        },
      });

      // 3. Log timeline event for evaluated submissions
      const submissions = await tx.examSubmissions.findMany({
        where: { tenantId, examId, status: { not: 'ABSENT' }, deletedAt: null },
        select: { id: true },
      });

      for (const sub of submissions) {
        await this.timelineService.logEvent(
          tenantId,
          sub.id,
          SubmissionTimelineEvent.APPROVED,
          adminUserId,
          { bulkApproved: true },
          tx,
        );
      }

      return { approvedCount: submissions.length, exam: updatedExam };
    });
  }

  /**
   * Pre-flight checklist validation
   */
  async getPublishChecklist(tenantId: string, examId: string) {
    return this.publishChecklistService.validateChecklist(tenantId, examId);
  }

  /**
   * Final atomic result publication after passing pre-flight checklist
   */
  async publishResults(tenantId: string, examId: string, adminUserId: string) {
    const checklist = await this.publishChecklistService.validateChecklist(
      tenantId,
      examId,
    );

    if (!checklist.canPublish) {
      throw new BadRequestException(
        'Publish checklist failed. Ensure all evaluations are completed, approved, and locked.',
      );
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Auto approve all evaluated submissions
      await tx.examSubmissions.updateMany({
        where: {
          tenantId,
          examId,
          status: { not: 'ABSENT' },
          deletedAt: null,
        },
        data: {
          evaluationApproved: true,
          approvedByUserId: adminUserId,
          approvedAt: now,
          updatedBy: adminUserId,
        },
      });

      // 2. Lock exam evaluation & close exam
      const updatedExam = await tx.exams.update({
        where: { id: examId },
        data: {
          evaluationLockedAt: now,
          evaluationLockedBy: adminUserId,
          isClosed: true,
          closedAt: now,
          resultsPublishedAt: now,
          resultsPublishedBy: adminUserId,
          publishStatus: ExamPublishStatusEnum.RESULT_PUBLISHED,
          updatedBy: adminUserId,
        },
      });

      // 3. Calculate ranks and percentiles
      await this.rankingService.calculateExamRanks(tenantId, examId, tx);

      // 4. Mark non-absent submissions as published
      await tx.examSubmissions.updateMany({
        where: { tenantId, examId, status: { not: 'ABSENT' }, deletedAt: null },
        data: {
          isResultsPublished: true,
          resultsPublishedAt: now,
          resultsPublishedByUserId: adminUserId,
          updatedBy: adminUserId,
        },
      });

      // 5. Log timeline RESULTS_PUBLISHED for all submissions
      const submissions = await tx.examSubmissions.findMany({
        where: { tenantId, examId, deletedAt: null },
        select: { id: true },
      });

      for (const sub of submissions) {
        await this.timelineService.logEvent(
          tenantId,
          sub.id,
          SubmissionTimelineEvent.RESULTS_PUBLISHED,
          adminUserId,
          undefined,
          tx,
        );
      }

      return updatedExam;
    });
  }
}
