import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { STORAGE_SERVICE_TOKEN } from '../../storage/interfaces/storage.interface';
import type { IStorageService } from '../../storage/interfaces/storage.interface';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TenantScopedPrisma } from '../../../common/utils/tenant-scoped-prisma';
import { EvaluateSubmissionDto } from '../dto/evaluate-submission.dto';
import { ExamClosureService } from './exam-closure.service';
import { ExamStateService } from './exam-state.service';
import { TimelineService } from './timeline.service';
import { ExamPublishStatusEnum, SubmissionTimelineEvent } from '@prisma/client';
import type { Prisma } from '@prisma/client';

@Injectable()
export class TutorExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
    @Inject(STORAGE_SERVICE_TOKEN)
    private readonly storageService: IStorageService,
    private readonly examClosureService: ExamClosureService,
    private readonly examStateService: ExamStateService,
    private readonly timelineService: TimelineService,
  ) {}

  async getMyAssignedExams(
    tenantId: string,
    tutorUserId: string,
    page?: number,
    limit?: number,
  ) {
    const take = limit || 20;
    const skip = page ? (page - 1) * take : 0;

    const staffProfile = await this.prisma.staffProfiles.findFirst({
      where: { userId: tutorUserId, tenantId, deletedAt: null },
      include: {
        staff_batch_assignmentss: {
          where: { deletedAt: null, isActive: true },
          select: { batchId: true },
        },
      },
    });

    const assignedBatchIds = (staffProfile?.staff_batch_assignmentss || [])
      .map((a) => a.batchId)
      .filter(Boolean);

    const examWhere: Prisma.ExamsWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (assignedBatchIds.length > 0) {
      examWhere.batchId = { in: assignedBatchIds };
    }

    const [total, exams] = await Promise.all([
      this.prisma.exams.count({
        where: examWhere,
      }),
      this.prisma.exams.findMany({
        where: examWhere,
        orderBy: { scheduledStartAt: 'desc' },
        skip,
        take,
      }),
    ]);

    if (exams.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: take,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    const examIds = exams.map((e) => e.id);

    // Batch aggregation: single query per metric instead of N queries
    const [pendingAgg, completedAgg, returnedAgg] = await Promise.all([
      this.prisma.examSubmissions.groupBy({
        by: ['examId'],
        where: {
          tenantId,
          examId: { in: examIds },
          status: { not: 'ABSENT' },
          evaluationStatus: { not: 'COMPLETED' },
          deletedAt: null,
        },
        _count: { id: true },
      }),
      this.prisma.examSubmissions.groupBy({
        by: ['examId'],
        where: {
          tenantId,
          examId: { in: examIds },
          evaluationStatus: 'COMPLETED',
          deletedAt: null,
        },
        _count: { id: true },
      }),
      this.prisma.examSubmissions.groupBy({
        by: ['examId'],
        where: {
          tenantId,
          examId: { in: examIds },
          evaluationStatus: 'RE_EVALUATION',
          deletedAt: null,
        },
        _count: { id: true },
      }),
    ]);

    const pendingMap = new Map(pendingAgg.map((r) => [r.examId, r._count.id]));
    const completedMap = new Map(
      completedAgg.map((r) => [r.examId, r._count.id]),
    );
    const returnedMap = new Map(
      returnedAgg.map((r) => [r.examId, r._count.id]),
    );

    // Trigger lazy closures (still per-exam, but this is a lightweight check)
    await Promise.all(
      exams.map((exam) =>
        this.examClosureService.checkAndTriggerLazyClosure(
          tenantId,
          exam.id,
          'system',
        ),
      ),
    );

    const data = exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      batchId: exam.batchId,
      subjectId: exam.subjectId,
      totalMarks: Number(exam.totalMarks),
      scheduledStartAt: exam.scheduledStartAt,
      scheduledEndAt: exam.scheduledEndAt,
      publishStatus: exam.publishStatus,
      isClosed: exam.isClosed,
      isResultsPublished: exam.resultsPublishedAt.getTime() > 0,
      isEvaluationLocked: !!exam.evaluationLockedAt,
      pendingEvaluations: pendingMap.get(exam.id) ?? 0,
      completedEvaluations: completedMap.get(exam.id) ?? 0,
      returnedEvaluations: returnedMap.get(exam.id) ?? 0,
    }));

    const totalPages = Math.ceil(total / take);
    return {
      data,
      meta: {
        total,
        page: page || 1,
        limit: take,
        totalPages,
        hasNextPage: (page || 1) < totalPages,
        hasPreviousPage: (page || 1) > 1,
      },
    };
  }

  async getExamSubmissionsBuckets(
    tenantId: string,
    tutorUserId: string,
    examId: string,
  ) {
    const exam = await this.prisma.exams.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: examId }),
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const now = new Date();
    await this.examClosureService.checkAndTriggerLazyClosure(
      tenantId,
      examId,
      'system',
    );

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const submissions = await this.prisma.examSubmissions.findMany({
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
    });

    type SubmissionElement = typeof submissions extends (infer U)[] ? U : never;

    const todaysPending: Array<{
      id: string;
      studentAdmissionId: string;
      studentName: string;
      status: SubmissionElement['status'];
      evaluationStatus: SubmissionElement['evaluationStatus'];
      evaluationApproved: boolean | null;
      evaluationVersion: number | null;
      rejectionReason: string | null;
      submittedAt: Date | null;
      obtainedMarks: number;
      isResultsPublished: boolean;
    }> = [];
    const overdue: typeof todaysPending = [];
    const completed: typeof todaysPending = [];
    const absent: typeof todaysPending = [];
    const returned: typeof todaysPending = [];

    for (const sub of submissions) {
      const studentName = sub.studentAdmission?.studentProfileIstudent_profile
        ?.userIdusers
        ? `${sub.studentAdmission.studentProfileIstudent_profile.userIdusers.firstName} ${sub.studentAdmission.studentProfileIstudent_profile.userIdusers.lastName}`.trim()
        : 'Student';

      const formatted = {
        id: sub.id,
        studentAdmissionId: sub.studentAdmissionId,
        studentName,
        status: sub.status,
        evaluationStatus: sub.evaluationStatus,
        evaluationApproved: sub.evaluationApproved,
        evaluationVersion: sub.evaluationVersion,
        rejectionReason: sub.rejectionReason,
        submittedAt: sub.submittedAt,
        obtainedMarks: Number(sub.obtainedMarks),
        isResultsPublished: sub.isResultsPublished,
      };

      if (sub.status === 'ABSENT') {
        absent.push(formatted);
      } else if (sub.evaluationStatus === 'RE_EVALUATION') {
        returned.push(formatted);
      } else if (sub.evaluationStatus === 'COMPLETED') {
        completed.push(formatted);
      } else if (sub.submittedAt && sub.submittedAt >= startOfToday) {
        todaysPending.push(formatted);
      } else {
        overdue.push(formatted);
      }
    }

    return {
      examId,
      title: exam.title,
      sectionConfig: exam.sectionConfig,
      isEvaluationLocked: !!exam.evaluationLockedAt,
      totalCount: submissions.length,
      todaysPending,
      overdue,
      completed,
      returned,
      absent,
    };
  }

  async getSubmissionDetail(
    tenantId: string,
    tutorUserId: string,
    examId: string,
    submissionId: string,
  ) {
    const submission = await this.prisma.examSubmissions.findFirst({
      where: { id: submissionId, examId, tenantId, deletedAt: null },
      include: {
        exam: true,
        studentAdmission: {
          include: {
            studentProfileIstudent_profile: {
              include: { userIdusers: true },
            },
          },
        },
        history: {
          orderBy: { editedAt: 'desc' },
        },
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Mark evaluation as IN_PROGRESS if tutor opens pending submission
    if (
      !submission.evaluationStartedAt &&
      submission.evaluationStatus === 'PENDING'
    ) {
      await this.prisma.examSubmissions.update({
        where: { id: submissionId },
        data: {
          evaluationStartedAt: new Date(),
          evaluationStatus: 'IN_PROGRESS',
          updatedBy: tutorUserId,
        },
      });
    }

    // Log TUTOR_OPENED event
    await this.timelineService.logEvent(
      tenantId,
      submissionId,
      SubmissionTimelineEvent.TUTOR_OPENED,
      tutorUserId,
    );

    let answerSheetSignedUrl: string | null = null;
    if (submission.answerSheetFileId) {
      answerSheetSignedUrl = await this.storageService
        .createSignedUrl({
          tenantId,
          fileUploadId: submission.answerSheetFileId,
          download: false,
        })
        .catch(() => null);
    }

    let answerKeySignedUrl: string | null = null;
    if (submission.exam.answerKeyFileId) {
      answerKeySignedUrl = await this.storageService
        .createSignedUrl({
          tenantId,
          fileUploadId: submission.exam.answerKeyFileId,
          download: false,
        })
        .catch(() => null);
    }

    const studentUser =
      submission.studentAdmission?.studentProfileIstudent_profile?.userIdusers;

    return {
      id: submission.id,
      examId: submission.examId,
      examTitle: submission.exam.title,
      totalMarks: Number(submission.exam.totalMarks),
      passingMarks: Number(submission.exam.passingMarks),
      sectionConfig: submission.exam.sectionConfig,
      studentAdmissionId: submission.studentAdmissionId,
      studentName: studentUser
        ? `${studentUser.firstName} ${studentUser.lastName}`.trim()
        : 'Student',
      studentEmail: studentUser?.email ?? '',
      status: submission.status,
      evaluationStatus: submission.evaluationStatus,
      evaluationApproved: submission.evaluationApproved,
      evaluationVersion: submission.evaluationVersion,
      rejectionReason: submission.rejectionReason,
      submittedAt: submission.submittedAt,
      evaluationStartedAt: submission.evaluationStartedAt,
      evaluationCompletedAt: submission.evaluationCompletedAt,
      obtainedMarks: Number(submission.obtainedMarks),
      marksBreakdown: submission.marksBreakdown,
      tutorNotes: submission.tutorNotes,
      isResultsPublished:
        submission.isResultsPublished ||
        submission.exam.resultsPublishedAt.getTime() > 0,
      isEvaluationLocked: !this.examStateService.canTutorEvaluate(
        submission.exam,
        submission,
      ),
      answerSheetSignedUrl,
      answerKeySignedUrl,
      history: submission.history.map((h) => ({
        id: h.id,
        editedByUserId: h.editedByUserId,
        editedAt: h.editedAt,
        oldMarks: Number(h.oldMarks),
        newMarks: Number(h.newMarks),
        oldBreakdown: h.oldBreakdown,
        newBreakdown: h.newBreakdown,
        reason: h.reason,
      })),
      timeline: submission.timeline,
    };
  }

  async evaluateSubmission(
    tenantId: string,
    tutorUserId: string,
    examId: string,
    submissionId: string,
    dto: EvaluateSubmissionDto,
  ) {
    const submission = await this.prisma.examSubmissions.findFirst({
      where: { id: submissionId, examId, tenantId, deletedAt: null },
      include: { exam: true },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (!this.examStateService.canTutorEvaluate(submission.exam, submission)) {
      throw new ForbiddenException(
        'Evaluation is locked by tenant admin or already approved',
      );
    }

    const now = new Date();
    const newVersion = submission.evaluationVersion + 1;

    return this.prisma.$transaction(async (tx) => {
      const oldMarks = submission.obtainedMarks;
      const oldBreakdown = submission.marksBreakdown ?? [];

      const updatedSubmission = await tx.examSubmissions.update({
        where: { id: submissionId },
        data: {
          obtainedMarks: dto.obtainedMarks,
          marksBreakdown: dto.marksBreakdown
            ? (dto.marksBreakdown as unknown as Prisma.InputJsonValue)
            : (submission.marksBreakdown as unknown as Prisma.InputJsonValue),
          tutorNotes: dto.tutorNotes ?? submission.tutorNotes,
          evaluationStatus: 'COMPLETED',
          evaluationApproved: false,
          evaluationVersion: newVersion,
          evaluatedByUserId: tutorUserId,
          evaluatedAt: now,
          evaluationCompletedAt: now,
          evaluationStartedAt: submission.evaluationStartedAt ?? now,
          updatedBy: tutorUserId,
        },
      });

      // Update Exam status to UNDER_REVIEW if currently LOCKED or PUBLISHED
      if (
        submission.exam.publishStatus === ExamPublishStatusEnum.LOCKED ||
        submission.exam.publishStatus === ExamPublishStatusEnum.PUBLISHED
      ) {
        await tx.exams.update({
          where: { id: examId },
          data: {
            publishStatus: ExamPublishStatusEnum.UNDER_REVIEW,
            updatedBy: tutorUserId,
          },
        });
      }

      const auditRecord = await tx.examSubmissionHistory.create({
        data: {
          tenantId,
          submissionId,
          editedByUserId: tutorUserId,
          editedAt: now,
          oldMarks,
          newMarks: dto.obtainedMarks,
          oldBreakdown: oldBreakdown,
          newBreakdown: dto.marksBreakdown
            ? (dto.marksBreakdown as unknown as Prisma.InputJsonValue)
            : oldBreakdown,
          reason: dto.reason || `Evaluation v${newVersion} saved by tutor`,
        },
      });

      await this.timelineService.logEvent(
        tenantId,
        submissionId,
        SubmissionTimelineEvent.EVALUATED,
        tutorUserId,
        { version: newVersion, marks: dto.obtainedMarks },
        tx,
      );

      return { submission: updatedSubmission, auditRecord };
    });
  }
}
