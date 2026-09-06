import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { DocumentExtractorService } from './document-extractor.service';
import { StructuredQuestionParserService, ParsedQuestionItem } from './structured-question-parser.service';
import {
  QuestionDifficultyEnum,
  QuestionTypeEnum,
  ImportStatusEnum,
  QuestionSourceEnum,
  BloomsLevelEnum,
  QuestionStatusEnum,
} from '@prisma/client';

@Injectable()
export class QuestionImportService {
  private readonly logger = new Logger(QuestionImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly extractorService: DocumentExtractorService,
    private readonly parserService: StructuredQuestionParserService,
  ) {}

  /**
   * Initialize and execute question extraction and parsing for an exam document.
   */
  async processDocumentImport(
    tenantId: string,
    examId: string,
    userId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType?: string,
    defaultMarks = 4,
    defaultNegativeMarks = 1,
  ) {
    let subjectId = 'general';
    if (examId !== 'temp-exam') {
      const exam = await this.prisma.exams.findFirst({
        where: { id: examId, tenantId, deletedAt: null },
      });
      if (exam && exam.subjectId) {
        subjectId = exam.subjectId;
      }
    }

    // 1. Extract raw text from file
    const rawText = await this.extractorService.extractText(fileBuffer, fileName, mimeType);

    // 2. Parse text into structured question AST with validation
    const parsedResult = this.parserService.parseText(
      rawText,
      defaultMarks,
      defaultNegativeMarks,
    );

    // 3. Save import job record for preview & asynchronous tracking
    let jobId = `job-${Date.now()}`;
    let jobStatus: ImportStatusEnum = ImportStatusEnum.PENDING;

    try {
      // Find a valid user ID for createdBy/updatedBy to prevent FK constraint failures
      const existingUser = await this.prisma.users.findFirst({
        where: { id: userId, tenantId, deletedAt: null },
      });
      const validUserId = existingUser ? userId : (
        (await this.prisma.users.findFirst({ where: { tenantId, deletedAt: null } }))?.id || userId
      );

      const job = await this.prisma.questionImportJobs.create({
        data: {
          tenantId,
          examId,
          fileName,
          fileType: fileName.split('.').pop() || 'pdf',
          fileSizeBytes: BigInt(fileBuffer.length),
          storageObjectId: '',
          subjectId: subjectId || 'general',
          chapterId: 'general',
          defaultDifficulty: QuestionDifficultyEnum.MEDIUM,
          defaultLanguage: 'EN',
          totalRows: parsedResult.totalQuestionsFound,
          importedRows: 0,
          failedRows: parsedResult.invalidCount,
          skippedRows: 0,
          status: ImportStatusEnum.PENDING,
          parsedJson: parsedResult.questions as any,
          errorLog: [],
          startedAt: new Date(),
          completedAt: new Date(),
          createdBy: validUserId,
          updatedBy: validUserId,
        },
      });
      jobId = job.id;
      jobStatus = job.status;
    } catch (dbErr: any) {
      this.logger.warn(`Could not persist QuestionImportJob in DB (returning preview in-memory): ${dbErr?.message || dbErr}`);
    }

    return {
      jobId,
      examId,
      status: jobStatus,
      totalQuestionsFound: parsedResult.totalQuestionsFound,
      validCount: parsedResult.validCount,
      needsReviewCount: parsedResult.needsReviewCount,
      invalidCount: parsedResult.invalidCount,
      questions: parsedResult.questions,
    };
  }

  /**
   * Retrieve import job details with normalized validation preview.
   */
  async getImportJobDetail(tenantId: string, examId: string, jobId: string) {
    const job = await this.prisma.questionImportJobs.findFirst({
      where: { id: jobId, examId, tenantId, deletedAt: null },
    });

    if (!job) {
      throw new NotFoundException('Import job not found');
    }

    const questions = (job.parsedJson || []) as unknown as ParsedQuestionItem[];

    return {
      jobId: job.id,
      examId: job.examId,
      fileName: job.fileName,
      status: job.status,
      totalQuestionsFound: job.totalRows,
      questions,
    };
  }

  /**
   * Commit all validated questions using bulk createMany — fast even for 200+ questions.
   *
   * Strategy:
   *   1. Pre-generate UUIDs for every question row (so options/examQuestions can reference them)
   *   2. Build three flat arrays: questionsData, optionsData, examQuestionsData
   *   3. Execute a single array-form Prisma $transaction with 4 operations:
   *      deleteMany(stale examQuestions) + createMany(questions) + createMany(options) + createMany(examQuestions)
   *   → Total DB round-trips: 4, regardless of question count. No timeout.
   */
  async commitImportJob(
    tenantId: string,
    examId: string,
    userId: string,
    jobId: string,
    questionsOverride?: ParsedQuestionItem[],
  ) {
    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    let job: any = null;
    if (jobId) {
      job = await this.prisma.questionImportJobs.findFirst({
        where: { id: jobId, tenantId, deletedAt: null },
      });
    }

    const questionsToImport =
      questionsOverride || (job?.parsedJson as unknown as ParsedQuestionItem[]) || [];

    const validQuestions = questionsToImport.filter(
      (q) => q.questionText && String(q.questionText).trim().length > 0,
    );

    if (validQuestions.length === 0) {
      throw new BadRequestException(
        'No valid questions found in the uploaded document. Please check the file format.',
      );
    }

    this.logger.log(`Committing ${validQuestions.length} questions for exam ${examId}`);

    // ── Step 1: Ensure exam section exists ────────────────────────────────────
    let defaultSectionId = '';
    const existingSection = await this.prisma.examSections.findFirst({
      where: { examId, tenantId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });

    if (existingSection) {
      defaultSectionId = existingSection.id;
    } else {
      try {
        const newSection = await this.prisma.examSections.create({
          data: {
            tenantId,
            examId,
            name: 'General Section',
            displayOrder: 1,
            description: 'Default Exam Section',
            totalMarks: Number(exam.totalMarks || 720),
            questionCount: validQuestions.length,
            marksPerQuestion: 4,
            negativeMarksPerQuestion: 1,
            durationMinutes: exam.durationMinutes || 180,
            subjectId: exam.subjectId || 'general',
            createdBy: userId,
            updatedBy: userId,
          },
        });
        defaultSectionId = newSection.id;
      } catch (secErr: any) {
        // Race condition — section created concurrently, retry find
        this.logger.warn(`Section create race (${secErr?.code}): retrying findFirst`);
        const retried = await this.prisma.examSections.findFirst({
          where: { examId, tenantId, deletedAt: null },
        });
        if (retried) {
          defaultSectionId = retried.id;
        } else {
          throw new BadRequestException(`Failed to create exam section: ${secErr?.message}`);
        }
      }
    }

    // ── Step 2: Pre-generate UUIDs + build bulk data arrays ──────────────────
    const timeStamp = `${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
    const now = new Date();

    const questionsData: any[] = [];
    const optionsData: any[] = [];
    const examQuestionsData: any[] = [];

    for (let i = 0; i < validQuestions.length; i++) {
      const q = validQuestions[i];
      const qId = randomUUID();
      const displayOrder = i + 1;

      // --- Question row ---
      questionsData.push({
        id: qId,
        tenantId,
        subjectId: exam.subjectId || 'general',
        chapterId: 'general',
        topicId: 'general',
        questionCode: `Q-${examId.slice(-6)}-${displayOrder}-${timeStamp}`,
        questionText: String(q.questionText).trim(),
        questionType: QuestionTypeEnum.MCQ,
        difficulty: QuestionDifficultyEnum.MEDIUM,
        bloomsLevel: BloomsLevelEnum.APPLY,
        language: 'EN',
        source: QuestionSourceEnum.IMPORT,
        questionStatus: QuestionStatusEnum.APPROVED,
        publishedVersion: 1,
        isLocked: false,
        lockedAt: now,
        lockedBy: userId,
        approvedBy: userId,
        approvedAt: now,
        aiMetadata: {},
        embeddingMetadata: {},
        difficultyPrediction: {},
        taxonomyMetadata: {},
        createdBy: userId,
        updatedBy: userId,
      });

      // --- Options rows ---
      const rawOptions =
        Array.isArray(q.options) && q.options.length > 0
          ? q.options
          : [
              { label: 'A', text: 'Option A' },
              { label: 'B', text: 'Option B' },
              { label: 'C', text: 'Option C' },
              { label: 'D', text: 'Option D' },
            ];

      for (let j = 0; j < rawOptions.length; j++) {
        const opt = rawOptions[j];
        const label = String(opt.label || String.fromCharCode(65 + j));
        const isCorrect =
          q.correctAnswer != null &&
          String(q.correctAnswer).toUpperCase() === label.toUpperCase();

        optionsData.push({
          id: randomUUID(),
          tenantId,
          questionId: qId,
          optionOrder: j + 1,
          optionLabel: label,
          optionText: String(opt.text || '').trim(),
          attachmentId: '',
          isCorrect,
          createdBy: userId,
          updatedBy: userId,
        });
      }

      // --- ExamQuestions row ---
      examQuestionsData.push({
        id: randomUUID(),
        tenantId,
        examId,
        sectionId: defaultSectionId,
        questionBankId: qId,
        displayOrder,
        marks: Number(q.marks) || 4,
        negativeMarks: Number(q.negativeMarks) || 1,
        questionType: 'MCQ',
        difficulty: QuestionDifficultyEnum.MEDIUM,
        topicTag: 'General',
        chapterId: 'general',
        createdBy: userId,
        updatedBy: userId,
      });
    }

    // ── Step 3: Single batch — 4 DB calls total regardless of question count ──
    try {
      await this.prisma.$transaction([
        this.prisma.examQuestions.deleteMany({ where: { examId, tenantId } }),
        this.prisma.questions.createMany({ data: questionsData }),
        this.prisma.questionOptions.createMany({ data: optionsData }),
        this.prisma.examQuestions.createMany({ data: examQuestionsData }),
      ]);
    } catch (txErr: any) {
      this.logger.error(
        `Bulk import failed: code=${txErr?.code}, meta=${JSON.stringify(txErr?.meta)}, msg=${txErr?.message}`,
      );
      throw new BadRequestException(
        `Question import failed (${txErr?.code || 'DB_ERROR'}): ${txErr?.message || 'Check server logs'}`,
      );
    }

    const importedCount = questionsData.length;
    const totalMarksSum = examQuestionsData.reduce((sum, eq) => sum + Number(eq.marks), 0);

    this.logger.log(`Successfully imported ${importedCount} questions for exam ${examId}`);

    // ── Step 4: Mark import job as completed ─────────────────────────────────
    if (jobId && job) {
      this.prisma.questionImportJobs
        .update({
          where: { id: jobId },
          data: {
            status: ImportStatusEnum.COMPLETED,
            importedRows: importedCount,
            failedRows: 0,
            completedAt: new Date(),
            updatedBy: userId,
          },
        })
        .catch((err: any) => this.logger.warn(`Job status update failed: ${err?.message}`));
    }

    // ── Step 5: Recalculate exam total marks (fire and forget) ────────────────
    if (totalMarksSum > 0) {
      this.prisma.exams
        .update({
          where: { id: examId },
          data: { totalMarks: totalMarksSum, updatedBy: userId },
        })
        .catch((err: any) => this.logger.warn(`Exam totalMarks update failed: ${err?.message}`));
    }

    return {
      importedCount,
      failedCount: 0,
      totalExamQuestions: importedCount,
      dynamicTotalMarks: totalMarksSum,
      createdQuestionIds: questionsData.map((q) => q.id),
    };
  }
}
