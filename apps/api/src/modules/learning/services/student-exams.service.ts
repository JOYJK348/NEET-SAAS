import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { STORAGE_SERVICE_TOKEN } from '../../storage/interfaces/storage.interface';
import type { IStorageService } from '../../storage/interfaces/storage.interface';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TenantScopedPrisma } from '../../../common/utils/tenant-scoped-prisma';
import {
  FileCategoryEnum,
  FileModuleEnum,
  FileUploads,
  SubmissionFileTypeEnum,
  SubmissionTimelineEvent,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { ExamClosureService } from './exam-closure.service';
import { ExamStateService } from './exam-state.service';
import { TimelineService } from './timeline.service';

@Injectable()
export class StudentExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
    @Inject(STORAGE_SERVICE_TOKEN)
    private readonly storageService: IStorageService,
    private readonly examClosureService: ExamClosureService,
    private readonly examStateService: ExamStateService,
    private readonly timelineService: TimelineService,
  ) {}

  private async getStudentAdmission(tenantId: string, userId: string) {
    let admission = await this.prisma.studentAdmissions.findFirst({
      where: { studentProfileId: userId, deletedAt: null },
      orderBy: [{ admissionStatus: 'asc' }, { createdAt: 'desc' }],
    });

    if (!admission) {
      const profile = await this.prisma.studentProfiles.findFirst({
        where: { userId, deletedAt: null },
      });

      if (profile) {
        admission = await this.prisma.studentAdmissions.findFirst({
          where: {
            studentProfileId: profile.userId,
            deletedAt: null,
          },
          orderBy: [{ admissionStatus: 'asc' }, { createdAt: 'desc' }],
        });
      }
    }

    if (!admission) {
      admission = await this.prisma.studentAdmissions.findFirst({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!admission) {
      const [ay, crs, br] = await Promise.all([
        this.prisma.academicYears.findFirst({ where: { tenantId, deletedAt: null } }),
        this.prisma.courses.findFirst({ where: { tenantId, deletedAt: null } }),
        this.prisma.branches.findFirst({ where: { tenantId, deletedAt: null } }),
      ]);

      if (ay && crs && br) {
        admission = await this.prisma.studentAdmissions.create({
          data: {
            tenantId,
            studentProfileId: userId,
            admissionNumber: `ADM-${userId.slice(0, 6).toUpperCase()}`,
            academicYearId: ay.id,
            courseId: crs.id,
            branchId: br.id,
            admissionStatus: 'ACTIVE',
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }
    }

    if (!admission) {
      throw new NotFoundException('No active student admission record found for this user');
    }

    const enrollments = await this.prisma.studentBatchEnrollments.findMany({
      where: { studentAdmissionId: admission.id, deletedAt: null },
      select: { batchId: true },
    });

    let batchIds = enrollments.map((e) => e.batchId).filter(Boolean);

    if (batchIds.length === 0) {
      const allBatches = await this.prisma.batches.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true },
        take: 10,
      });
      batchIds = allBatches.map((b) => b.id);
    }

    const batchId = batchIds[0] ?? null;

    return { admission, batchIds, batchId };
  }

  async getMyExams(
    tenantId: string,
    userId: string,
    page?: number,
    limit?: number,
  ) {
    const { admission, batchIds } = await this.getStudentAdmission(
      tenantId,
      userId,
    );

    const take = limit || 20;
    const skip = page ? (page - 1) * take : 0;

    const orConditions: Prisma.ExamsWhereInput[] = [
      { batchId: 'ALL' },
      { batchId: 'batch-default' },
      { batchId: '' },
    ];

    if (batchIds.length > 0) {
      orConditions.push({ batchId: { in: batchIds } });
    }

    if (admission?.courseId) {
      orConditions.push({ courseId: admission.courseId });
    }

    const examWhere: Prisma.ExamsWhereInput = {
      tenantId,
      publishStatus: {
        in: [
          'PUBLISHED',
          'SCHEDULED',
          'LOCKED',
          'UNDER_REVIEW',
          'ADMIN_REVIEW',
          'RESULT_PUBLISHED',
          'ARCHIVED',
        ],
      },
      deletedAt: null,
      OR: orConditions,
    };

    const [total, exams] = await Promise.all([
      this.prisma.exams.count({ where: examWhere }),
      this.prisma.exams.findMany({
        where: examWhere,
        orderBy: { scheduledStartAt: 'asc' },
        skip,
        take,
      }),
    ]);

    const now = new Date();

    const data = await Promise.all(
      exams.map(async (exam) => {
        try {
          await this.examClosureService.checkAndTriggerLazyClosure(
            tenantId,
            exam.id,
            'system',
          );
        } catch {
          // Ignore closure errors during exam list fetch to guarantee 200 OK
        }

        const submission = admission?.id
          ? await this.prisma.examSubmissions.findFirst({
              where: {
                tenantId,
                examId: exam.id,
                studentAdmissionId: admission.id,
                deletedAt: null,
              },
              orderBy: { createdAt: 'desc' },
            })
          : null;

        const derivedStatus = this.examStateService.getExamState(exam, now);
        const canStart = this.examStateService.canStudentStart(exam, now);

        let remainingSeconds = 0;
        if (submission?.calculatedEndAt) {
          let endMs = submission.calculatedEndAt.getTime();
          if (exam.examWindowEnd && endMs > exam.examWindowEnd.getTime()) {
            endMs = exam.examWindowEnd.getTime();
          }
          const graceMs =
            submission.graceEndAt?.getTime() ??
            endMs + (exam.graceMinutes || 0) * 60 * 1000;
          const nowMs = now.getTime();

          if (nowMs < endMs) {
            remainingSeconds = Math.floor((endMs - nowMs) / 1000);
          } else if (nowMs < graceMs) {
            remainingSeconds = Math.floor((graceMs - nowMs) / 1000);
          } else {
            remainingSeconds = 0;
          }
        }

        return {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          mode: exam.mode,
          examType: exam.examType,
          totalMarks: Number(exam.totalMarks),
          passingMarks: Number(exam.passingMarks),
          durationMinutes: exam.durationMinutes,
          graceMinutes: exam.graceMinutes,
          examWindowStart: exam.examWindowStart,
          examWindowEnd: exam.examWindowEnd,
          publishStatus: exam.publishStatus,
          studentExamStatus: derivedStatus,
          canStart,
          remainingSeconds,
          isSubmissionLocked: exam.isSubmissionLocked || exam.isClosed,
          submission: submission
            ? {
                id: submission.id,
                status: submission.status,
                evaluationStatus: submission.evaluationStatus,
                isResultsPublished:
                  submission.isResultsPublished ||
                  (exam.resultsPublishedAt &&
                    exam.resultsPublishedAt.getTime() > 0),
                startedAt: submission.startedAt,
                calculatedEndAt: submission.calculatedEndAt,
                graceEndAt: submission.graceEndAt,
                submittedAt: submission.submittedAt,
                obtainedMarks: Number(submission.obtainedMarks),
              }
            : null,
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

  async startExam(
    tenantId: string,
    userId: string,
    examId: string,
    metadata?: Record<string, unknown>,
  ) {
    const { admission, batchIds, batchId } = await this.getStudentAdmission(
      tenantId,
      userId,
    );

    const exam = await this.prisma.exams.findFirst({
      where: {
        id: examId,
        tenantId,
        publishStatus: 'PUBLISHED',
        deletedAt: null,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const isBatchOrCourseAllowed =
      !exam.batchId ||
      exam.batchId === 'ALL' ||
      exam.batchId === 'batch-default' ||
      exam.batchId === '' ||
      (batchIds.length > 0 && batchIds.includes(exam.batchId)) ||
      (admission?.courseId && exam.courseId === admission.courseId);

    if (!isBatchOrCourseAllowed) {
      throw new NotFoundException(
        'Exam not found or not assigned to your batch/course',
      );
    }

    const now = new Date();

    if (!this.examStateService.canStudentStart(exam, now)) {
      throw new BadRequestException('Exam cannot be started at this time');
    }

    const startedAt = now;
    let calculatedEndAt = new Date(
      startedAt.getTime() + exam.durationMinutes * 60 * 1000,
    );
    if (exam.examWindowEnd && calculatedEndAt > exam.examWindowEnd) {
      calculatedEndAt = exam.examWindowEnd;
    }
    const graceEndAt = new Date(
      calculatedEndAt.getTime() + exam.graceMinutes * 60 * 1000,
    );

    const submission = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.examSubmissions.findFirst({
        where: {
          tenantId,
          examId,
          studentAdmissionId: admission.id,
          deletedAt: null,
        },
      });

      if (existing?.startedAt) {
        return existing;
      }

      const created = await tx.examSubmissions.upsert({
        where: {
          examId_studentAdmissionId: {
            examId,
            studentAdmissionId: admission.id,
          },
        },
        create: {
          tenantId,
          examId,
          studentAdmissionId: admission.id,
          startedAt,
          calculatedEndAt,
          graceEndAt,
          lastSeenAt: startedAt,
          status: 'SUBMITTED',
          evaluationStatus: 'PENDING',
          obtainedMarks: 0.0,
          createdBy: userId,
          updatedBy: userId,
        },
        update: {
          startedAt,
          calculatedEndAt,
          graceEndAt,
          lastSeenAt: startedAt,
          updatedBy: userId,
        },
      });

      // Log timeline event inside the transaction
      const existingTimeline = await tx.examSubmissionTimeline.findFirst({
        where: {
          submissionId: created.id,
          event: SubmissionTimelineEvent.STARTED,
        },
      });
      if (!existingTimeline) {
        await tx.examSubmissionTimeline.create({
          data: {
            tenantId,
            submissionId: created.id,
            event: SubmissionTimelineEvent.STARTED,
            metadata: (metadata ?? {}) as unknown as Prisma.InputJsonValue,
            createdBy: userId,
          },
        });
      }

      return created;
    });

    return {
      submissionId: submission.id,
      startedAt: submission.startedAt,
      calculatedEndAt: submission.calculatedEndAt,
      graceEndAt: submission.graceEndAt,
    };
  }

  async getQuestionPaperUrl(
    tenantId: string,
    userId: string,
    examId: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ questionPaperSignedUrl: string }> {
    const { admission } = await this.getStudentAdmission(tenantId, userId);

    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
    });

    if (!exam || !exam.questionPaperFileId) {
      throw new NotFoundException(
        'Question paper file not available for this exam',
      );
    }

    const submission = await this.prisma.examSubmissions.findFirst({
      where: {
        tenantId,
        examId,
        studentAdmissionId: admission.id,
        deletedAt: null,
      },
    });

    // Question Paper Download Guard: Must click Ready to Start first
    if (!submission?.startedAt) {
      throw new ForbiddenException(
        'You must click Ready to Start before accessing the question paper',
      );
    }

    const signedUrl = await this.storageService.createSignedUrl({
      tenantId,
      fileUploadId: exam.questionPaperFileId,
      download: false,
    });

    const now = new Date();
    await this.prisma.examSubmissions.update({
      where: { id: submission.id },
      data: { qpDownloadedAt: now, updatedBy: userId },
    });

    await this.timelineService.logEvent(
      tenantId,
      submission.id,
      SubmissionTimelineEvent.QP_DOWNLOADED,
      userId,
      metadata,
    );

    return { questionPaperSignedUrl: signedUrl };
  }

  async heartbeat(
    tenantId: string,
    userId: string,
    examId: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ success: boolean; lastSeenAt: Date }> {
    const { admission } = await this.getStudentAdmission(tenantId, userId);

    const submission = await this.prisma.examSubmissions.findFirst({
      where: {
        tenantId,
        examId,
        studentAdmissionId: admission.id,
        deletedAt: null,
      },
    });

    if (!submission?.startedAt) {
      throw new BadRequestException('Session has not been started yet');
    }

    const now = new Date();
    await this.prisma.examSubmissions.update({
      where: { id: submission.id },
      data: { lastSeenAt: now, updatedBy: userId },
    });

    await this.timelineService.logEvent(
      tenantId,
      submission.id,
      SubmissionTimelineEvent.HEARTBEAT,
      userId,
      metadata,
    );

    return { success: true, lastSeenAt: now };
  }

  async getExamDetail(tenantId: string, userId: string, examId: string) {
    const { admission, batchIds, batchId } = await this.getStudentAdmission(
      tenantId,
      userId,
    );

    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const isBatchOrCourseAllowed =
      !exam.batchId ||
      exam.batchId === 'ALL' ||
      exam.batchId === 'batch-default' ||
      exam.batchId === '' ||
      (batchIds.length > 0 && batchIds.includes(exam.batchId)) ||
      (admission?.courseId && exam.courseId === admission.courseId);

    if (!isBatchOrCourseAllowed) {
      throw new NotFoundException(
        'Exam not found or not assigned to your batch/course',
      );
    }

    const now = new Date();
    await this.examClosureService.checkAndTriggerLazyClosure(
      tenantId,
      examId,
      'system',
    );

    const submission = await this.prisma.examSubmissions.findFirst({
      where: {
        tenantId,
        examId,
        studentAdmissionId: admission.id,
        deletedAt: null,
      },
      include: {
        submissionFiles: {
          orderBy: { uploadedAt: 'desc' },
        },
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const derivedStatus = this.examStateService.getExamState(exam, now);
    const canStart = this.examStateService.canStudentStart(exam, now);

    let remainingSeconds = 0;
    if (submission?.calculatedEndAt) {
      let endMs = submission.calculatedEndAt.getTime();
      if (exam.examWindowEnd && endMs > exam.examWindowEnd.getTime()) {
        endMs = exam.examWindowEnd.getTime();
      }
      const graceMs =
        submission.graceEndAt?.getTime() ??
        endMs + (exam.graceMinutes || 0) * 60 * 1000;
      const nowMs = now.getTime();

      if (nowMs < endMs) {
        remainingSeconds = Math.floor((endMs - nowMs) / 1000);
      } else if (nowMs < graceMs) {
        remainingSeconds = Math.floor((graceMs - nowMs) / 1000);
      } else {
        remainingSeconds = 0;
      }
    }

    let questionPaperSignedUrl: string | null = null;
    let answerSheetSignedUrl: string | null = null;

    // QP signed URL generated ONLY if student has started exam
    if (exam.questionPaperFileId && submission?.startedAt) {
      questionPaperSignedUrl = await this.storageService
        .createSignedUrl({
          tenantId,
          fileUploadId: exam.questionPaperFileId,
          download: false,
        })
        .catch(() => null);
    }

    if (submission?.answerSheetFileId) {
      answerSheetSignedUrl = await this.storageService
        .createSignedUrl({
          tenantId,
          fileUploadId: submission.answerSheetFileId,
          download: false,
        })
        .catch(() => null);
    }

    return {
      ...exam,
      totalMarks: Number(exam.totalMarks),
      passingMarks: Number(exam.passingMarks),
      studentExamStatus: derivedStatus,
      canStart,
      remainingSeconds,
      questionPaperSignedUrl,
      answerSheetSignedUrl,
      submission,
    };
  }

  async uploadAnswerSheet(
    tenantId: string,
    userId: string,
    examId: string,
    file: Express.Multer.File,
    metadata?: Record<string, unknown>,
  ) {
    const { admission, batchIds, batchId } = await this.getStudentAdmission(
      tenantId,
      userId,
    );

    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const isBatchOrCourseAllowed =
      !exam.batchId ||
      exam.batchId === 'ALL' ||
      exam.batchId === 'batch-default' ||
      exam.batchId === '' ||
      (batchIds.length > 0 && batchIds.includes(exam.batchId)) ||
      (admission?.courseId && exam.courseId === admission.courseId);

    if (!isBatchOrCourseAllowed) {
      throw new NotFoundException(
        'Exam not found or not assigned to your batch/course',
      );
    }

    const now = new Date();

    if (exam.isClosed || exam.isSubmissionLocked) {
      throw new BadRequestException('Submissions for this exam are locked');
    }

    const submission = await this.prisma.examSubmissions.findFirst({
      where: {
        tenantId,
        examId,
        studentAdmissionId: admission.id,
        deletedAt: null,
      },
    });

    if (!submission?.startedAt) {
      throw new BadRequestException(
        'You must start the exam before uploading an answer sheet',
      );
    }

    const uploadStatus = this.examStateService.resolveUploadStatus(
      submission,
      exam.allowLateUpload,
      now,
      exam.examWindowEnd,
    );

    if (uploadStatus === 'EXPIRED') {
      throw new BadRequestException('Exam submission window has expired');
    }

    if (submission.status === 'ABSENT') {
      throw new BadRequestException(
        'Cannot upload answer sheet for closed/absent exam',
      );
    }

    if (submission.isResultsPublished) {
      throw new BadRequestException(
        'Results are already published for this exam',
      );
    }

    const isReplace = !!submission.answerSheetFileId;

    if (isReplace && !exam.allowReplaceUpload) {
      throw new BadRequestException(
        'Answer sheet replacement is disabled for this exam',
      );
    }

    let fileUpload: FileUploads | undefined;

    if (isReplace) {
      // Storage upload (external — can't be inside Prisma tx)
      fileUpload = await this.storageService.replaceFile({
        tenantId,
        fileUploadId: submission.answerSheetFileId!,
        userId,
        file,
      });
      const fw = fileUpload;

      // Atomic DB update for replace
      const eventType = SubmissionTimelineEvent.ANSWER_SHEET_REPLACED;
      await this.prisma.$transaction(async (tx) => {
        await tx.examSubmissionFiles.updateMany({
          where: {
            submissionId: submission.id,
            fileType: SubmissionFileTypeEnum.CURRENT,
          },
          data: { fileType: SubmissionFileTypeEnum.REPLACED },
        });

        await tx.examSubmissionFiles.create({
          data: {
            tenantId,
            submissionId: submission.id,
            fileUploadId: fw.id,
            fileType: SubmissionFileTypeEnum.CURRENT,
            uploadedBy: userId,
          },
        });

        await tx.examSubmissions.update({
          where: { id: submission.id },
          data: {
            answerSheetFileId: fw.id,
            submittedAt: now,
            status: uploadStatus === 'GRACE' ? 'LATE' : 'SUBMITTED',
            updatedBy: userId,
          },
        });

        await tx.examSubmissionTimeline.create({
          data: {
            tenantId,
            submissionId: submission.id,
            event: eventType,
            metadata: {
              fileUploadId: fw.id,
              uploadStatus,
              ...metadata,
            },
            createdBy: userId,
          },
        });
      });
    } else {
      // Storage upload (external — can't be inside Prisma tx)
      fileUpload = await this.storageService.uploadFile({
        tenantId,
        userId,
        file,
        fileType: FileCategoryEnum.ANSWER_SHEET,
        moduleCode: FileModuleEnum.SUBMISSIONS,
      });
      const fw = fileUpload;

      // Atomic DB update for first upload
      const eventType = SubmissionTimelineEvent.ANSWER_SHEET_UPLOADED;
      await this.prisma.$transaction(async (tx) => {
        await tx.examSubmissions.update({
          where: { id: submission.id },
          data: {
            answerSheetFileId: fw.id,
            submittedAt: now,
            status: uploadStatus === 'GRACE' ? 'LATE' : 'SUBMITTED',
            updatedBy: userId,
          },
        });

        await tx.examSubmissionFiles.create({
          data: {
            tenantId,
            submissionId: submission.id,
            fileUploadId: fw.id,
            fileType: SubmissionFileTypeEnum.CURRENT,
            uploadedBy: userId,
          },
        });

        await tx.examSubmissionTimeline.create({
          data: {
            tenantId,
            submissionId: submission.id,
            event: eventType,
            metadata: {
              fileUploadId: fw.id,
              uploadStatus,
              ...metadata,
            },
            createdBy: userId,
          },
        });
      });
    }

    const updated = await this.prisma.examSubmissions.findFirst({
      where: { id: submission.id },
    });

    return {
      message: 'Answer sheet uploaded successfully',
      fileUpload: fileUpload
        ? {
            ...fileUpload,
            fileSizeBytes: Number(fileUpload.fileSizeBytes),
          }
        : null,
      submission: updated
        ? {
            ...updated,
            obtainedMarks: Number(updated.obtainedMarks),
          }
        : null,
    };
  }

  async getResult(tenantId: string, userId: string, examId: string) {
    const { admission } = await this.getStudentAdmission(tenantId, userId);

    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const submission = await this.prisma.examSubmissions.findFirst({
      where: {
        tenantId,
        examId,
        studentAdmissionId: admission.id,
        deletedAt: null,
      },
    });

    if (!submission) {
      throw new NotFoundException('No submission record found for this exam');
    }

    if (
      !submission.isResultsPublished &&
      exam.resultsPublishedAt.getTime() === 0
    ) {
      throw new ForbiddenException(
        'Results for this exam have not been published yet',
      );
    }

    const rawBreakdown: Record<string, unknown>[] = Array.isArray(
      submission.marksBreakdown,
    )
      ? (submission.marksBreakdown as Record<string, unknown>[])
      : [];

    const totalMarksNum = Number(exam.totalMarks);
    const obtainedMarksNum = Number(submission.obtainedMarks || 0);
    const secCount = rawBreakdown.length || 1;
    const defaultMaxPerSection = Math.round(totalMarksNum / secCount);
    const defaultObtainedPerSection = Math.round(obtainedMarksNum / secCount);

    const formattedBreakdown = rawBreakdown.map((sec, idx) => ({
      sectionName:
        (sec.sectionName as string) ||
        (sec.name as string) ||
        `Section ${idx + 1}`,
      obtainedMarks:
        sec.obtainedMarks !== undefined &&
        sec.obtainedMarks !== null &&
        !isNaN(Number(sec.obtainedMarks))
          ? Number(sec.obtainedMarks)
          : sec.marks !== undefined
            ? Number(sec.marks)
            : sec.score !== undefined
              ? Number(sec.score)
              : defaultObtainedPerSection,
      maxMarks:
        sec.maxMarks && Number(sec.maxMarks) > 0
          ? Number(sec.maxMarks)
          : defaultMaxPerSection,
    }));

    return {
      examId: exam.id,
      examTitle: exam.title,
      totalMarks: totalMarksNum,
      passingMarks: Number(exam.passingMarks),
      obtainedMarks: Number(submission.obtainedMarks),
      rank: submission.rank,
      percentile: submission.percentile,
      status: submission.status,
      evaluationStatus: submission.evaluationStatus,
      tutorNotes: submission.tutorNotes,
      marksBreakdown: formattedBreakdown,
      submittedAt: submission.submittedAt,
      evaluatedAt: submission.evaluatedAt,
      isPassed: Number(submission.obtainedMarks) >= Number(exam.passingMarks),
    };
  }
}
