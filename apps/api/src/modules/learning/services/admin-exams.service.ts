import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { STORAGE_SERVICE_TOKEN } from '../../storage/interfaces/storage.interface';
import type { IStorageService } from '../../storage/interfaces/storage.interface';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TenantScopedPrisma } from '../../../common/utils/tenant-scoped-prisma';
import type { Prisma } from '@prisma/client';
import {
  paginateAndMap,
  buildPrismaOrderBy,
  buildPrismaSearch,
} from '../../../common/utils/prisma-paginator';
import {
  ExamStatusEnum,
  FileCategoryEnum,
  FileModuleEnum,
} from '@prisma/client';
import { CreateExamDto } from '../dto/create-exam.dto';
import { UpdateExamDto } from '../dto/update-exam.dto';
import { QueryExamsDto } from '../dto/query-exams.dto';
import { ExamClosureService } from './exam-closure.service';

import { ExamApprovalService } from './exam-approval.service';

const EXAM_SEARCH_FIELDS = ['title', 'description'];

@Injectable()
export class AdminExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
    @Inject(STORAGE_SERVICE_TOKEN)
    private readonly storageService: IStorageService,
    private readonly examClosureService: ExamClosureService,
    private readonly examApprovalService: ExamApprovalService,
  ) {}

  private async checkExamScheduleConflict(
    tenantId: string,
    params: {
      courseId: string;
      batchId: string;
      batchIds?: string[];
      windowStart: Date;
      windowEnd: Date;
      excludeExamId?: string;
    },
  ) {
    const targetBatchIds = [
      params.batchId,
      ...(params.batchIds || []),
      'ALL',
      'batch-default',
    ].filter((id) => id && id !== '');

    const overlappingExams = await this.prisma.exams.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: ExamStatusEnum.ACTIVE,
        publishStatus: { notIn: ['ARCHIVED'] },
        ...(params.excludeExamId ? { id: { not: params.excludeExamId } } : {}),
        OR: [
          { batchId: { in: targetBatchIds } },
          { courseId: params.courseId },
        ],
        AND: [
          { examWindowStart: { lt: params.windowEnd } },
          { examWindowEnd: { gt: params.windowStart } },
        ],
      },
      select: {
        id: true,
        title: true,
        batchId: true,
        courseId: true,
        examWindowStart: true,
        examWindowEnd: true,
      },
    });

    if (overlappingExams.length > 0) {
      const conflict = overlappingExams[0];
      const startFmt = conflict.examWindowStart.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const endFmt = conflict.examWindowEnd.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      throw new BadRequestException(
        `Schedule Conflict Detected: Exam "${conflict.title}" is already scheduled for this batch/course between ${startFmt} and ${endFmt}. Please choose a non-overlapping exam window.`,
      );
    }
  }

  async checkConflictPublic(tenantId: string, dto: Record<string, any>) {
    const startIso = dto.scheduledStartAt || dto.examWindowStart || new Date().toISOString();
    const endIso = dto.scheduledEndAt || dto.examWindowEnd || new Date(Date.now() + 7200000).toISOString();
    const windowStart = new Date(dto.examWindowStart || startIso);
    const windowEnd = new Date(dto.examWindowEnd || endIso);

    const primaryBatchId =
      (dto.batchIds && dto.batchIds.length > 0 ? dto.batchIds[0] : dto.batchId) || 'ALL';

    const targetBatchIds = [
      primaryBatchId,
      ...(dto.batchIds || []),
      'ALL',
      'batch-default',
    ].filter((id) => id && id !== '');

    const conflicts: Array<{
      type: 'EXAM' | 'CLASS_SCHEDULE';
      title: string;
      batchName?: string;
      windowStart: string;
      windowEnd: string;
      message: string;
    }> = [];

    // 1. Check overlapping exams
    const overlappingExams = await this.prisma.exams.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: ExamStatusEnum.ACTIVE,
        publishStatus: { notIn: ['ARCHIVED'] },
        ...(dto.excludeExamId ? { id: { not: dto.excludeExamId } } : {}),
        OR: [
          { batchId: { in: targetBatchIds } },
          ...(dto.courseId ? [{ courseId: dto.courseId }] : []),
        ],
        AND: [
          { examWindowStart: { lt: windowEnd } },
          { examWindowEnd: { gt: windowStart } },
        ],
      },
      select: {
        id: true,
        title: true,
        batchId: true,
        examWindowStart: true,
        examWindowEnd: true,
      },
    });

    for (const ex of overlappingExams) {
      const startFmt = ex.examWindowStart.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const endFmt = ex.examWindowEnd.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      conflicts.push({
        type: 'EXAM',
        title: ex.title,
        windowStart: startFmt,
        windowEnd: endFmt,
        message: `Exam "${ex.title}" is already scheduled (${startFmt} – ${endFmt})`,
      });
    }

    // 2. Check overlapping class timetables/schedules
    try {
      const activeSchedules = await this.prisma.schedules.findMany({
        where: {
          tenantId,
          deletedAt: null,
          batchId: { in: targetBatchIds },
        },
      });

      const batchIdsInSched = Array.from(new Set(activeSchedules.map((s) => s.batchId)));
      const subjectIdsInSched = Array.from(new Set(activeSchedules.map((s) => s.subjectId)));

      const schedBatches: Array<{ id: string; name: string }> =
        batchIdsInSched.length > 0
          ? await this.prisma.batches.findMany({
              where: { id: { in: batchIdsInSched } },
              select: { id: true, name: true },
            })
          : [];

      const schedSubjects: Array<{ id: string; name: string }> =
        subjectIdsInSched.length > 0
          ? await this.prisma.subjects.findMany({
              where: { id: { in: subjectIdsInSched } },
              select: { id: true, name: true },
            })
          : [];

      const batchMap = new Map<string, string>();
      schedBatches.forEach((b) => batchMap.set(b.id, b.name));
      const subjectMap = new Map<string, string>();
      schedSubjects.forEach((s) => subjectMap.set(s.id, s.name));

      const windowStartDay = windowStart.getDay();
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const currentDayOfWeek = days[windowStartDay];

      const examStartMinutes = windowStart.getHours() * 60 + windowStart.getMinutes();
      const examEndMinutes = windowEnd.getHours() * 60 + windowEnd.getMinutes();

      for (const sched of activeSchedules) {
        if (sched.dayOfWeek && sched.dayOfWeek !== currentDayOfWeek) continue;
        if (sched.effectiveFrom && windowEnd < new Date(sched.effectiveFrom)) continue;
        if (sched.effectiveUntil && windowStart > new Date(sched.effectiveUntil)) continue;

        if (sched.startTime && sched.endTime) {
          const [sh, sm] = sched.startTime.split(':').map(Number);
          const [eh, em] = sched.endTime.split(':').map(Number);
          const schedStartMins = sh * 60 + sm;
          const schedEndMins = eh * 60 + em;

          if (examStartMinutes < schedEndMins && examEndMinutes > schedStartMins) {
            const subjectName = subjectMap.get(sched.subjectId) || 'Live Class';
            const batchName = batchMap.get(sched.batchId) || 'Batch';

            conflicts.push({
              type: 'CLASS_SCHEDULE',
              title: `${subjectName} Class`,
              batchName,
              windowStart: sched.startTime,
              windowEnd: sched.endTime,
              message: `Live Class "${subjectName}" (${batchName}) scheduled (${sched.startTime} – ${sched.endTime})`,
            });
          }
        }
      }
    } catch {
      // Ignore schedule check errors
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  async createExam(tenantId: string, userId: string, dto: CreateExamDto) {
    const start = new Date(dto.scheduledStartAt);
    const end = new Date(dto.scheduledEndAt);
    const windowStart = dto.examWindowStart
      ? new Date(dto.examWindowStart)
      : start;
    const windowEnd = dto.examWindowEnd ? new Date(dto.examWindowEnd) : end;

    if (start >= end) {
      throw new BadRequestException(
        'Scheduled end time must be strictly after scheduled start time',
      );
    }

    if (windowStart >= windowEnd) {
      throw new BadRequestException(
        'Exam window end must be strictly after exam window start time',
      );
    }

    const primaryBatchId =
      (dto.batchIds && dto.batchIds.length > 0 ? dto.batchIds[0] : dto.batchId) ||
      'ALL';

    await this.checkExamScheduleConflict(tenantId, {
      courseId: dto.courseId,
      batchId: primaryBatchId,
      batchIds: dto.batchIds,
      windowStart,
      windowEnd,
    });

    const createdExam = await this.prisma.exams.create({
      data: {
        tenantId,
        courseId: dto.courseId,
        batchId: primaryBatchId,
        subjectId: dto.subjectId,
        academicYearId: dto.academicYearId,
        title: dto.title,
        description: dto.description || '',
        examType: dto.examType,
        mode: dto.mode,
        totalMarks: dto.totalMarks,
        passingMarks: dto.passingMarks,
        negativeMarkingEnabled: dto.negativeMarkingEnabled ?? false,
        negativeMarkingValue: dto.negativeMarkingValue ?? 0,
        durationMinutes: dto.durationMinutes,
        graceMinutes: dto.graceMinutes ?? 15,
        scheduledStartAt: start,
        scheduledEndAt: end,
        examWindowStart: windowStart,
        examWindowEnd: windowEnd,
        requireFullDurationWindow: dto.requireFullDurationWindow ?? false,
        allowLateUpload: dto.allowLateUpload ?? true,
        allowReplaceUpload: dto.allowReplaceUpload ?? true,
        sectionConfig: (dto.sectionConfig ??
          []) as unknown as Prisma.InputJsonValue,
        instructions: dto.instructions || '',
        publishStatus: 'DRAFT',
        status: ExamStatusEnum.ACTIVE,
        questionPaperId: '',
        omrTemplateId: '',
        omrSheetCount: 0,
        publishedBy: userId,
        publishedAt: new Date(0),
        publishedFromIp: '',
        publishedDevice: '',
        resultsPublishedAt: new Date(0),
        resultsPublishedBy: userId,
        lockedAt: new Date(0),
        lockedBy: '',
        publishedVersion: 1,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return createdExam;
  }

  async updateExam(
    tenantId: string,
    userId: string,
    examId: string,
    dto: UpdateExamDto,
  ) {
    const existing = await this.prisma.exams.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: examId }),
    });

    if (!existing) {
      throw new NotFoundException('Exam not found');
    }

    if (existing.publishStatus === 'RESULT_PUBLISHED') {
      throw new BadRequestException('Cannot modify exam after results have been published');
    }

    const newWindowStart = dto.examWindowStart
      ? new Date(dto.examWindowStart)
      : dto.scheduledStartAt
        ? new Date(dto.scheduledStartAt)
        : existing.examWindowStart;

    const newWindowEnd = dto.examWindowEnd
      ? new Date(dto.examWindowEnd)
      : dto.scheduledEndAt
        ? new Date(dto.scheduledEndAt)
        : existing.examWindowEnd;

    const courseIdToTest = dto.courseId || existing.courseId;
    const batchIdToTest = dto.batchId || existing.batchId;

    if (newWindowStart >= newWindowEnd) {
      throw new BadRequestException(
        'Exam window end must be strictly after exam window start time',
      );
    }

    await this.checkExamScheduleConflict(tenantId, {
      courseId: courseIdToTest,
      batchId: batchIdToTest,
      batchIds: dto.batchIds,
      windowStart: newWindowStart,
      windowEnd: newWindowEnd,
      excludeExamId: examId,
    });

    const data: Record<string, unknown> = { updatedBy: userId };
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.courseId !== undefined) data.courseId = dto.courseId;
    if (dto.batchId !== undefined) data.batchId = dto.batchId;
    if (dto.subjectId !== undefined) data.subjectId = dto.subjectId;
    if (dto.academicYearId !== undefined)
      data.academicYearId = dto.academicYearId;
    if (dto.examType !== undefined) data.examType = dto.examType;
    if (dto.mode !== undefined) data.mode = dto.mode;
    if (dto.totalMarks !== undefined) data.totalMarks = dto.totalMarks;
    if (dto.passingMarks !== undefined) data.passingMarks = dto.passingMarks;
    if (dto.negativeMarkingEnabled !== undefined)
      data.negativeMarkingEnabled = dto.negativeMarkingEnabled;
    if (dto.negativeMarkingValue !== undefined)
      data.negativeMarkingValue = dto.negativeMarkingValue;
    if (dto.durationMinutes !== undefined)
      data.durationMinutes = dto.durationMinutes;
    if (dto.graceMinutes !== undefined) data.graceMinutes = dto.graceMinutes;
    if (dto.instructions !== undefined) data.instructions = dto.instructions;
    if (dto.scheduledStartAt !== undefined)
      data.scheduledStartAt = new Date(dto.scheduledStartAt);
    if (dto.scheduledEndAt !== undefined)
      data.scheduledEndAt = new Date(dto.scheduledEndAt);
    if (dto.examWindowStart !== undefined)
      data.examWindowStart = new Date(dto.examWindowStart);
    if (dto.examWindowEnd !== undefined)
      data.examWindowEnd = new Date(dto.examWindowEnd);
    if (dto.requireFullDurationWindow !== undefined)
      data.requireFullDurationWindow = dto.requireFullDurationWindow;
    if (dto.allowLateUpload !== undefined)
      data.allowLateUpload = dto.allowLateUpload;
    if (dto.allowReplaceUpload !== undefined)
      data.allowReplaceUpload = dto.allowReplaceUpload;
    if (dto.sectionConfig !== undefined) data.sectionConfig = dto.sectionConfig;

    return this.prisma.exams.update({
      where: { id: examId },
      data,
    });
  }

  async findAllExams(tenantId: string, query: QueryExamsDto) {
    const where: Record<string, unknown> = {
      ...this.tenantScoped.buildWhere(tenantId),
      ...(query.search
        ? buildPrismaSearch(query.search, EXAM_SEARCH_FIELDS)
        : {}),
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(query.batchId ? { batchId: query.batchId } : {}),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.publishStatus ? { publishStatus: query.publishStatus } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const orderBy = buildPrismaOrderBy(
      query.sortBy || 'createdAt',
      query.sortOrder || 'desc',
    );

    return paginateAndMap(
      this.prisma.exams,
      { where, orderBy },
      query,
      tenantId,
      (exam) => exam,
    );
  }

  async findExamById(tenantId: string, examId: string) {
    const exam = await this.prisma.exams.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: examId }),
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Lazy closure check
    await this.examClosureService.checkAndTriggerLazyClosure(
      tenantId,
      examId,
      'system',
    );

    let questionPaperSignedUrl: string | null = null;
    let answerKeySignedUrl: string | null = null;

    if (exam.questionPaperFileId) {
      questionPaperSignedUrl = await this.storageService
        .createSignedUrl({
          tenantId,
          fileUploadId: exam.questionPaperFileId,
          download: false,
        })
        .catch(() => null);
    }

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
      ...exam,
      questionPaperSignedUrl,
      answerKeySignedUrl,
    };
  }

  async uploadQuestionPaper(
    tenantId: string,
    userId: string,
    examId: string,
    file: Express.Multer.File,
  ) {
    const exam = await this.prisma.exams.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: examId }),
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const fileUpload = await this.storageService.uploadFile({
      tenantId,
      userId,
      file,
      fileType: FileCategoryEnum.QUESTION_PAPER,
      moduleCode: FileModuleEnum.EXAMS,
    });

    const updatedExam = await this.prisma.exams.update({
      where: { id: examId },
      data: {
        questionPaperFileId: fileUpload.id,
        updatedBy: userId,
      },
    });

    return {
      message: 'Question paper uploaded successfully',
      fileUpload: {
        ...fileUpload,
        fileSizeBytes: Number(fileUpload.fileSizeBytes),
      },
      exam: {
        ...updatedExam,
        totalMarks: Number(updatedExam.totalMarks),
        passingMarks: Number(updatedExam.passingMarks),
        negativeMarkingValue: Number(updatedExam.negativeMarkingValue),
      },
    };
  }

  async uploadAnswerKey(
    tenantId: string,
    userId: string,
    examId: string,
    file: Express.Multer.File,
  ) {
    const exam = await this.prisma.exams.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: examId }),
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const fileUpload = await this.storageService.uploadFile({
      tenantId,
      userId,
      file,
      fileType: FileCategoryEnum.DOCUMENT,
      moduleCode: FileModuleEnum.EXAMS,
    });

    const updatedExam = await this.prisma.exams.update({
      where: { id: examId },
      data: {
        answerKeyFileId: fileUpload.id,
        updatedBy: userId,
      },
    });

    return {
      message: 'Answer key uploaded successfully',
      fileUpload: {
        ...fileUpload,
        fileSizeBytes: Number(fileUpload.fileSizeBytes),
      },
      exam: {
        ...updatedExam,
        totalMarks: Number(updatedExam.totalMarks),
        passingMarks: Number(updatedExam.passingMarks),
        negativeMarkingValue: Number(updatedExam.negativeMarkingValue),
      },
    };
  }

  async publishExam(tenantId: string, userId: string, examId: string) {
    const exam = await this.prisma.exams.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: examId }),
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.mode !== 'ONLINE' && !exam.questionPaperFileId) {
      throw new BadRequestException(
        'Cannot publish offline exam without uploading Question Paper PDF first.',
      );
    }

    if (exam.publishStatus === 'PUBLISHED') {
      return exam;
    }

    return this.prisma.exams.update({
      where: { id: examId },
      data: {
        publishStatus: 'PUBLISHED',
        publishedAt: new Date(),
        publishedBy: userId,
        updatedBy: userId,
      },
    });
  }

  async closeExam(tenantId: string, userId: string, examId: string) {
    return this.examClosureService.closeExam(tenantId, examId, userId);
  }

  async lockSubmissions(tenantId: string, userId: string, examId: string) {
    return this.examClosureService.lockSubmissions(tenantId, examId, userId);
  }

  async getExamStats(tenantId: string, examId: string) {
    const exam = await this.prisma.exams.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: examId }),
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    await this.examClosureService.checkAndTriggerLazyClosure(
      tenantId,
      examId,
      'system',
    );

    const totalStudents = await this.prisma.studentBatchEnrollments.count({
      where: {
        batchId: exam.batchId,
        tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    const baseWhere = { tenantId, examId, deletedAt: null };

    const [submittedCount, absentCount, evaluatedCount, pendingEvalCount] =
      await Promise.all([
        this.prisma.examSubmissions.count({
          where: { ...baseWhere, status: { not: 'ABSENT' } },
        }),
        this.prisma.examSubmissions.count({
          where: { ...baseWhere, status: 'ABSENT' },
        }),
        this.prisma.examSubmissions.count({
          where: { ...baseWhere, evaluationStatus: 'COMPLETED' },
        }),
        this.prisma.examSubmissions.count({
          where: { ...baseWhere, evaluationStatus: { not: 'COMPLETED' } },
        }),
      ]);

    const scoreAgg = await this.prisma.examSubmissions.aggregate({
      where: {
        ...baseWhere,
        status: { not: 'ABSENT' },
        evaluationStatus: 'COMPLETED',
      },
      _avg: { obtainedMarks: true },
      _max: { obtainedMarks: true },
      _min: { obtainedMarks: true },
    });

    return {
      examId,
      title: exam.title,
      totalStudents,
      submittedCount,
      submittedPercentage:
        totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0,
      absentCount,
      evaluatedCount,
      evaluatedPercentage:
        submittedCount > 0 ? (evaluatedCount / submittedCount) * 100 : 0,
      pendingEvalCount,
      averageScore: scoreAgg._avg.obtainedMarks
        ? Number(scoreAgg._avg.obtainedMarks)
        : 0,
      highestScore: scoreAgg._max.obtainedMarks
        ? Number(scoreAgg._max.obtainedMarks)
        : 0,
      lowestScore: scoreAgg._min.obtainedMarks
        ? Number(scoreAgg._min.obtainedMarks)
        : 0,
      isResultsPublished: exam.resultsPublishedAt.getTime() > 0,
    };
  }

  async publishResults(tenantId: string, userId: string, examId: string) {
    return this.examApprovalService.publishResults(tenantId, examId, userId);
  }

  async deleteExam(tenantId: string, examId: string) {
    const exam = await this.prisma.exams.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: examId }),
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    await this.prisma.exams.update({
      where: { id: examId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { success: true, message: 'Exam deleted successfully' };
  }
}
