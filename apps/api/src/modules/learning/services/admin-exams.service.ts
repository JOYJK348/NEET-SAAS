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

    return this.prisma.exams.create({
      data: {
        tenantId,
        courseId: dto.courseId,
        batchId: dto.batchId,
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

    if (existing.publishStatus !== 'DRAFT') {
      throw new BadRequestException('Cannot modify non-draft exam');
    }

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
      query.sortOrder,
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
}
