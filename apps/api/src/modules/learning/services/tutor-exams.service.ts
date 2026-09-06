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
import { OnlineCbtService } from './online-cbt.service';

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
    private readonly onlineCbtService: OnlineCbtService,
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
      where: { userId: tutorUserId, deletedAt: null },
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

    // Trigger lazy closures with tutorUserId as actor
    await Promise.all(
      exams.map((exam) =>
        this.examClosureService
          .checkAndTriggerLazyClosure(tenantId, exam.id, tutorUserId)
          .catch(() => false),
      ),
    );

    const data = await Promise.all(
      exams.map(async (exam) => {
        let answerKeySignedUrl: string | null = null;
        if (exam.answerKeyFileId) {
          answerKeySignedUrl = await this.storageService
            .createSignedUrl({
              tenantId,
              fileUploadId: exam.answerKeyFileId,
              download: false,
            })
            .catch(() => null);
        }

        return {
          id: exam.id,
          title: exam.title,
          batchId: exam.batchId,
          subjectId: exam.subjectId,
          totalMarks: Number(exam.totalMarks),
          scheduledStartAt: exam.scheduledStartAt,
          scheduledEndAt: exam.scheduledEndAt,
          publishStatus: exam.publishStatus,
          mode: exam.mode,
          isClosed: exam.isClosed,
          isResultsPublished: exam.resultsPublishedAt.getTime() > 0,
          isEvaluationLocked: !!exam.evaluationLockedAt,
          answerKeyFileId: exam.answerKeyFileId,
          answerKeySignedUrl,
          pendingEvaluations: pendingMap.get(exam.id) ?? 0,
          completedEvaluations: completedMap.get(exam.id) ?? 0,
          returnedEvaluations: returnedMap.get(exam.id) ?? 0,
        };
      }),
    );

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
    await this.examClosureService
      .checkAndTriggerLazyClosure(tenantId, examId, tutorUserId)
      .catch(() => false);

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

    let answerKeySignedUrl: string | null = null;
    if (exam.answerKeyFileId) {
      answerKeySignedUrl = await this.storageService
        .createSignedUrl({
          tenantId,
          fileUploadId: exam.answerKeyFileId,
          download: false,
        })
        .catch(() => null);
    }

    return {
      examId,
      title: exam.title,
      mode: exam.mode,
      sectionConfig: exam.sectionConfig,
      isEvaluationLocked: !!exam.evaluationLockedAt,
      answerKeyFileId: exam.answerKeyFileId,
      answerKeySignedUrl,
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

    const examMode = submission.exam.mode || 'OFFLINE';
    let cbtStats: any = null;
    let cbtBreakdown: any[] = [];

    if (examMode === 'ONLINE' || submission.evaluatedByUserId === 'SYSTEM_CBT') {
      const studentProfile = submission.studentAdmission?.studentProfileIstudent_profile as any;
      const candidateStudentIds = [
        submission.studentAdmissionId,
        studentProfile?.userId,
        studentProfile?.id,
        submission.studentAdmission?.id,
      ].filter(Boolean) as string[];

      const [attempt, examResult] = await Promise.all([
        this.prisma.examAttempts.findFirst({
          where: {
            examId,
            tenantId,
            deletedAt: null,
            OR: [
              { studentAdmissionId: { in: candidateStudentIds } },
              { createdBy: { in: candidateStudentIds } },
            ],
          },
          orderBy: { startedAt: 'desc' },
        }),
        this.prisma.examResults.findFirst({
          where: {
            examId,
            tenantId,
            deletedAt: null,
            OR: [
              { studentAdmissionId: { in: candidateStudentIds } },
              { createdBy: { in: candidateStudentIds } },
            ],
          },
        }),
      ]);

      if (examResult) {
        cbtStats = {
          correct: examResult.correct,
          wrong: examResult.wrong,
          skipped: examResult.skipped,
          percentage: Number(examResult.percentage),
          passFail: examResult.passFail,
          grade: examResult.grade,
        };
      }

      let examQuestions = await this.prisma.examQuestions.findMany({
        where: { examId, tenantId, deletedAt: null },
        orderBy: { displayOrder: 'asc' },
      });

      if (examQuestions.length === 0) {
        await this.onlineCbtService.seedSampleQuestionsIfEmpty(tenantId, examId, tutorUserId).catch(() => null);
        examQuestions = await this.prisma.examQuestions.findMany({
          where: { examId, tenantId, deletedAt: null },
          orderBy: { displayOrder: 'asc' },
        });
      }

      if (examQuestions.length > 0) {
        const examAnswers = attempt
          ? await this.prisma.examAnswers.findMany({
              where: { attemptId: attempt.id, tenantId, deletedAt: null },
            })
          : [];

        const questionIds = examQuestions.map((eq) => eq.questionBankId);

        const [questions, questionOptions, explanations] = await Promise.all([
          this.prisma.questions.findMany({
            where: { id: { in: questionIds }, tenantId, deletedAt: null },
          }),
          this.prisma.questionOptions.findMany({
            where: { questionId: { in: questionIds }, tenantId, deletedAt: null },
            orderBy: { optionOrder: 'asc' },
          }),
          this.prisma.questionExplanations.findMany({
            where: { questionId: { in: questionIds }, tenantId, deletedAt: null },
          }),
        ]);

        const qMap = new Map(questions.map((q) => [q.id, q]));
        const explanationMap = new Map(explanations.map((e) => [e.questionId, e]));
        const ansMap = new Map(examAnswers.map((a) => [a.questionId, a]));

        const optionsMap = new Map<string, typeof questionOptions>();
        questionOptions.forEach((opt) => {
          if (!optionsMap.has(opt.questionId)) {
            optionsMap.set(opt.questionId, []);
          }
          optionsMap.get(opt.questionId)!.push(opt);
        });

        cbtBreakdown = examQuestions.map((eq, idx) => {
          const q = qMap.get(eq.questionBankId);
          const ans = ansMap.get(eq.questionBankId);
          const opts = optionsMap.get(eq.questionBankId) || [];
          const exp = explanationMap.get(eq.questionBankId);

          const correctOpt = opts.find((o) => o.isCorrect)?.optionLabel || '-';
          const selectedOpt = ans?.selectedOption || '';
          const isCorrect = ans?.isCorrect ?? (selectedOpt ? selectedOpt.toUpperCase() === correctOpt.toUpperCase() : false);

          return {
            questionIndex: idx + 1,
            questionId: eq.questionBankId,
            questionText: q?.questionText || `Question ${idx + 1}`,
            selectedOption: selectedOpt,
            correctOption: correctOpt,
            isCorrect,
            marksAwarded: Number(ans?.marksAwarded ?? (isCorrect ? eq.marks : selectedOpt ? -eq.negativeMarks : 0)),
            marks: Number(eq.marks),
            negativeMarks: Number(eq.negativeMarks),
            options: opts.map((o) => ({
              label: o.optionLabel,
              text: o.optionText,
              isCorrect: o.isCorrect,
            })),
            explanation: exp
              ? {
                  solutionText: exp.solutionText || exp.shortExplanation || '',
                  shortExplanation: exp.shortExplanation || '',
                }
              : null,
          };
        });
      }
    }

    return {
      id: submission.id,
      examId: submission.examId,
      examTitle: submission.exam.title,
      examMode,
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
      cbtStats,
      cbtBreakdown,
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
