import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AnswerStatusEnum, EvaluationStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface AutosaveAnswerDto {
  questionId: string;
  selectedOption: string; // "A", "B", "C", "D" or empty ""
  answerStatus?: string;
}

@Injectable()
export class OnlineCbtService {
  private readonly logger = new Logger(OnlineCbtService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start or resume an Online CBT exam attempt for student.
   */
  async startExamAttempt(
    tenantId: string,
    studentUserId: string,
    examId: string,
    deviceType = 'DESKTOP',
  ) {
    // 1. Resolve student profile & admission ID
    const studentProfile = await this.prisma.studentProfiles.findFirst({
      where: { userId: studentUserId, deletedAt: null },
    });

    const studentAdmissionId = studentProfile?.userId || studentUserId;

    // 2. Fetch exam details
    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
      include: {
        submissions: {
          where: { studentAdmissionId, deletedAt: null },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found.');
    }

    // 3. Server-side timing window check
    const now = new Date();
    if (exam.examWindowStart && now < new Date(exam.examWindowStart)) {
      throw new BadRequestException(
        `Exam window has not opened yet. Scheduled start: ${new Date(exam.examWindowStart).toLocaleString()}`,
      );
    }

    if (exam.examWindowEnd && now > new Date(exam.examWindowEnd)) {
      throw new BadRequestException(
        `Exam window has closed on ${new Date(exam.examWindowEnd).toLocaleString()}`,
      );
    }

    // 4. Check existing attempts
    const existingAttempt = await this.prisma.examAttempts.findFirst({
      where: { examId, studentAdmissionId, tenantId, deletedAt: null },
    });

    let attempt = existingAttempt;

    if (attempt) {
      if (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED') {
        throw new BadRequestException('You have already submitted this exam attempt.');
      }
    } else {
      // Create new attempt record
      attempt = await this.prisma.examAttempts.create({
        data: {
          tenantId,
          examId,
          studentAdmissionId,
          startedAt: now,
          submittedAt: new Date(0),
          autoSubmittedAt: new Date(0),
          lastActivityAt: now,
          status: 'IN_PROGRESS' as any,
          submittedBySystem: false,
          deviceType,
          browserName: 'Browser',
          browserVersion: '1.0',
          osName: 'Web',
          ipAddress: '127.0.0.1',
          country: 'IN',
          deviceMetadata: {},
          userAgent: '',
          timeTakenSeconds: 0,
          timePausedSeconds: 0,
          proctoringSessionId: '',
          proctoringStatus: 'OK',
          omrSheetId: '',
          answerSheetReceivedAt: new Date(0),
          createdBy: studentUserId,
          updatedBy: studentUserId,
        },
      });
    }

    // 5. Fetch all questions for this exam
    let examQuestions = await this.prisma.examQuestions.findMany({
      where: { examId, tenantId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });

    let questionIds = examQuestions.map((eq) => eq.questionBankId);

    let questions = await this.prisma.questions.findMany({
      where: { id: { in: questionIds }, tenantId, deletedAt: null },
    });

    if (examQuestions.length === 0 || questions.length === 0) {
      await this.seedSampleQuestionsIfEmpty(tenantId, examId, studentUserId);

      examQuestions = await this.prisma.examQuestions.findMany({
        where: { examId, tenantId, deletedAt: null },
        orderBy: { displayOrder: 'asc' },
      });

      questionIds = examQuestions.map((eq) => eq.questionBankId);

      questions = await this.prisma.questions.findMany({
        where: { id: { in: questionIds }, tenantId, deletedAt: null },
      });
    }

    const questionOptions = await this.prisma.questionOptions.findMany({
      where: { questionId: { in: questionIds }, tenantId, deletedAt: null },
      orderBy: { optionOrder: 'asc' },
    });

    // Fetch existing saved answers for resumption
    const existingAnswers = await this.prisma.examAnswers.findMany({
      where: { attemptId: attempt.id, tenantId, deletedAt: null },
    });

    const answerMap = new Map(existingAnswers.map((a) => [a.questionId, a]));
    const optionsMap = new Map<string, typeof questionOptions>();

    questionOptions.forEach((opt) => {
      if (!optionsMap.has(opt.questionId)) {
        optionsMap.set(opt.questionId, []);
      }
      optionsMap.get(opt.questionId)!.push(opt);
    });

    const savedAnswersMap: Record<string, { selectedOption: string | null; answerStatus: any }> = {};
    existingAnswers.forEach((a) => {
      let status = 'NOT_ANSWERED';
      if (a.answerStatus === AnswerStatusEnum.FLAGGED && a.selectedOption) {
        status = 'ANSWERED_AND_MARKED';
      } else if (a.answerStatus === AnswerStatusEnum.FLAGGED) {
        status = 'MARKED_FOR_REVIEW';
      } else if (a.selectedOption) {
        status = 'ANSWERED';
      }
      savedAnswersMap[a.questionId] = {
        selectedOption: a.selectedOption || null,
        answerStatus: status,
      };
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Build student payload — STRICT SECURITY: Omit isCorrect & explanations!
    const questionsPayload = examQuestions.map((eq) => {
      const q = questionMap.get(eq.questionBankId);
      const opts = optionsMap.get(eq.questionBankId) || [];
      const savedAns = answerMap.get(eq.questionBankId);

      return {
        id: eq.questionBankId,
        questionId: eq.questionBankId,
        questionCode: q?.questionCode || `Q-${eq.displayOrder}`,
        displayOrder: eq.displayOrder,
        marks: Number(eq.marks),
        negativeMarks: Number(eq.negativeMarks),
        questionText: q?.questionText || '',
        questionType: q?.questionType || 'SINGLE_CHOICE',
        sectionId: eq.sectionId || 'general',
        sectionName: eq.topicTag || 'General',
        options: opts.map((o) => ({
          id: o.id,
          label: o.optionLabel,
          text: o.optionText,
          optionLabel: o.optionLabel,
          optionText: o.optionText,
        })),
        savedAnswer: savedAns?.selectedOption || '',
        savedStatus: savedAns?.answerStatus || 'NOT_VISITED',
      };
    });

    // Server-calculated time remaining in seconds
    const durationSec = (exam.durationMinutes || 180) * 60;
    const elapsedSec = Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000);
    const remainingSeconds = Math.max(0, durationSec - elapsedSec);

    return {
      id: attempt.id,
      attemptId: attempt.id,
      examId,
      examTitle: exam.title,
      title: exam.title,
      totalMarks: Number(exam.totalMarks),
      durationMinutes: exam.durationMinutes,
      startedAt: attempt.startedAt,
      expiresAt: new Date(attempt.startedAt.getTime() + durationSec * 1000).toISOString(),
      timeRemainingSeconds: remainingSeconds,
      remainingSeconds,
      questions: questionsPayload,
      savedAnswers: savedAnswersMap,
    };
  }

  /**
   * Realtime debounced answer autosave with server timer enforcement.
   */
  async autosaveAnswer(
    tenantId: string,
    studentUserId: string,
    attemptId: string,
    dto: AutosaveAnswerDto,
  ) {
    const attempt = await this.prisma.examAttempts.findFirst({
      where: { id: attemptId, tenantId, deletedAt: null },
      include: {
        createdByusers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Exam attempt not found.');
    }

    if (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED') {
      throw new BadRequestException('Exam attempt is already submitted.');
    }

    const exam = await this.prisma.exams.findFirst({
      where: { id: attempt.examId, tenantId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found.');
    }

    // Check duration expiration
    const now = new Date();
    const durationMs = ((exam.durationMinutes || 180) + (exam.graceMinutes || 15)) * 60 * 1000;
    const timeSpentMs = now.getTime() - attempt.startedAt.getTime();

    if (timeSpentMs > durationMs) {
      // Auto-submit expired attempt
      await this.submitExamAttempt(tenantId, studentUserId, attemptId);
      return { status: 'EXPIRED', remainingSeconds: 0 };
    }

    // Safe enum mapping for DB: AnswerStatusEnum can be UNATTEMPTED, FLAGGED, CORRECT, INCORRECT, PARTIAL
    let dbAnswerStatus: AnswerStatusEnum = AnswerStatusEnum.UNATTEMPTED;
    if (
      dto.answerStatus === 'MARKED_FOR_REVIEW' ||
      dto.answerStatus === 'ANSWERED_AND_MARKED' ||
      dto.answerStatus === 'ANSWERED_AND_MARKED_FOR_REVIEW' ||
      dto.answerStatus === 'FLAGGED'
    ) {
      dbAnswerStatus = AnswerStatusEnum.FLAGGED;
    }

    // Ensure valid user ID for FK relations
    const userExists = await this.prisma.users.findUnique({ where: { id: studentUserId } });
    const validUserId = userExists ? studentUserId : attempt.createdBy;

    await this.prisma.examAnswers.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: dto.questionId,
        },
      },
      create: {
        tenantId,
        attemptId,
        questionId: dto.questionId,
        selectedOption: dto.selectedOption || '',
        answerText: dto.selectedOption || '',
        isCorrect: false,
        marksAwarded: 0,
        answerStatus: dbAnswerStatus,
        evaluationStatus: EvaluationStatusEnum.PENDING,
        evaluatedBy: validUserId,
        evaluatedAt: now,
        answeredAt: now,
        createdBy: validUserId,
        updatedBy: validUserId,
      },
      update: {
        selectedOption: dto.selectedOption || '',
        answerText: dto.selectedOption || '',
        answerStatus: dbAnswerStatus,
        answeredAt: now,
        updatedBy: validUserId,
      },
    });

    // Update last activity
    await this.prisma.examAttempts.update({
      where: { id: attemptId },
      data: {
        lastActivityAt: now,
        timeTakenSeconds: Math.floor(timeSpentMs / 1000),
      },
    });

    const remainingSeconds = Math.max(0, Math.floor((durationMs - timeSpentMs) / 1000));

    return {
      status: 'SAVED',
      questionId: dto.questionId,
      selectedOption: dto.selectedOption,
      remainingSeconds,
    };
  }

  /**
   * Finalize CBT submission, evaluate answers (+marks / -negative), calculate score & result.
   */
  async submitExamAttempt(tenantId: string, studentUserId: string, attemptId: string) {
    const attempt = await this.prisma.examAttempts.findFirst({
      where: { id: attemptId, tenantId, deletedAt: null },
    });

    if (!attempt) {
      throw new NotFoundException('Exam attempt not found.');
    }

    if (attempt.status === 'SUBMITTED') {
      return this.getExamResult(tenantId, attempt.examId, studentUserId);
    }

    const exam = await this.prisma.exams.findFirst({
      where: { id: attempt.examId, tenantId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found.');
    }

    const now = new Date();

    // Ensure valid user ID for FK relations to Users table
    const userExists = await this.prisma.users.findUnique({ where: { id: studentUserId } });
    const validUserId = userExists
      ? studentUserId
      : attempt.createdBy || (await this.prisma.users.findFirst({ where: { tenantId } }))?.id || studentUserId;

    // Check if studentAdmissionId actually exists in StudentAdmissions table for ExamSubmissions FK constraint
    let validStudentAdmissionId: string | null = null;
    const admissionById = await this.prisma.studentAdmissions.findFirst({
      where: { id: attempt.studentAdmissionId, tenantId, deletedAt: null },
    });

    if (admissionById) {
      validStudentAdmissionId = admissionById.id;
    } else {
      const admissionByUserId = await this.prisma.studentAdmissions.findFirst({
        where: {
          tenantId,
          deletedAt: null,
          studentProfileIstudent_profile: { userId: studentUserId },
        },
      });
      if (admissionByUserId) {
        validStudentAdmissionId = admissionByUserId.id;
      }
    }

    // Fetch all exam questions and correct options
    const examQuestions = await this.prisma.examQuestions.findMany({
      where: { examId: exam.id, tenantId, deletedAt: null },
    });

    const questionIds = examQuestions.map((eq) => eq.questionBankId);

    const correctOptions = await this.prisma.questionOptions.findMany({
      where: { questionId: { in: questionIds }, isCorrect: true, tenantId, deletedAt: null },
    });

    const correctOptionMap = new Map(correctOptions.map((o) => [o.questionId, o.optionLabel]));

    // Fetch student's answers
    const studentAnswers = await this.prisma.examAnswers.findMany({
      where: { attemptId, tenantId, deletedAt: null },
    });

    const studentAnswerMap = new Map(studentAnswers.map((a) => [a.questionId, a]));

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let totalObtainedMarks = 0;

    // Evaluate each question in transaction
    await this.prisma.$transaction(async (tx) => {
      for (const eq of examQuestions) {
        const qId = eq.questionBankId;
        const qMarks = Number(eq.marks);
        const qNegMarks = Number(eq.negativeMarks);
        const correctOpt = correctOptionMap.get(qId);
        const studentAns = studentAnswerMap.get(qId);

        let isCorrect = false;
        let marksAwarded = 0;

        if (!studentAns || !studentAns.selectedOption) {
          skippedCount++;
          marksAwarded = 0;
        } else if (correctOpt && studentAns.selectedOption.toUpperCase() === correctOpt.toUpperCase()) {
          correctCount++;
          isCorrect = true;
          marksAwarded = qMarks;
        } else {
          wrongCount++;
          isCorrect = false;
          marksAwarded = exam.negativeMarkingEnabled ? -qNegMarks : 0;
        }

        totalObtainedMarks += marksAwarded;

        if (studentAns) {
          await tx.examAnswers.update({
            where: { id: studentAns.id },
            data: {
              isCorrect,
              marksAwarded,
              evaluationStatus: EvaluationStatusEnum.COMPLETED,
              evaluatedAt: now,
              updatedBy: validUserId,
            },
          });
        }
      }

      // Floor total marks to zero if negative
      const finalObtainedMarks = Math.max(0, totalObtainedMarks);
      const totalExamMarks = Number(exam.totalMarks || 100);
      const percentage = (finalObtainedMarks / totalExamMarks) * 100;
      const passFail = finalObtainedMarks >= Number(exam.passingMarks || 0);

      // Update attempt status
      await tx.examAttempts.update({
        where: { id: attemptId },
        data: {
          status: 'SUBMITTED' as any,
          submittedAt: now,
          timeTakenSeconds: Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000),
          updatedBy: validUserId,
        },
      });

      // Upsert ExamResults record
      await tx.examResults.upsert({
        where: {
          examId_studentAdmissionId: {
            examId: exam.id,
            studentAdmissionId: attempt.studentAdmissionId,
          },
        },
        create: {
          tenantId,
          examId: exam.id,
          attemptId,
          studentAdmissionId: attempt.studentAdmissionId,
          resultStatus: 'PUBLISHED' as any,
          totalMarks: totalExamMarks,
          obtainedMarks: finalObtainedMarks,
          correct: correctCount,
          wrong: wrongCount,
          skipped: skippedCount,
          percentage,
          percentile: 100,
          rank: 1,
          passingMarks: Number(exam.passingMarks || 0),
          passFail,
          grade: passFail ? 'PASS' : 'FAIL',
          isFinal: true,
          reEvaluationRequested: false,
          reEvaluatedAt: new Date(0),
          reEvaluatedBy: validUserId,
          aiEvaluationMetadata: {},
          resultHash: '',
          publishedAt: now,
          publishedBy: validUserId,
          createdBy: validUserId,
          updatedBy: validUserId,
        },
        update: {
          obtainedMarks: finalObtainedMarks,
          correct: correctCount,
          wrong: wrongCount,
          skipped: skippedCount,
          percentage,
          passFail,
          updatedBy: validUserId,
        },
      });

      // Upsert ExamSubmissions record only if validStudentAdmissionId is present
      if (validStudentAdmissionId) {
        await tx.examSubmissions.upsert({
          where: {
            examId_studentAdmissionId: {
              examId: exam.id,
              studentAdmissionId: validStudentAdmissionId,
            },
          },
          create: {
            tenantId,
            examId: exam.id,
            studentAdmissionId: validStudentAdmissionId,
            status: 'SUBMITTED' as any,
            evaluationStatus: 'COMPLETED' as any,
            evaluationApproved: false,
            evaluationVersion: 1,
            obtainedMarks: finalObtainedMarks,
            submittedAt: now,
            evaluatedAt: now,
            evaluatedByUserId: validUserId,
            marksBreakdown: [
              { sectionName: 'Correct Answers', obtainedMarks: correctCount * 4, maxMarks: correctCount * 4 },
              { sectionName: 'Wrong Answers', obtainedMarks: -wrongCount, maxMarks: 0 },
              { sectionName: 'Skipped Questions', obtainedMarks: 0, maxMarks: 0 },
            ],
            tutorNotes: `Auto-evaluated by CBT Engine (${correctCount} Correct, ${wrongCount} Wrong, ${skippedCount} Skipped). Total Score: ${finalObtainedMarks}/${totalExamMarks}`,
            isResultsPublished: true,
            resultsPublishedAt: now,
            createdBy: validUserId,
            updatedBy: validUserId,
          },
          update: {
            status: 'SUBMITTED' as any,
            evaluationStatus: 'COMPLETED' as any,
            obtainedMarks: finalObtainedMarks,
            submittedAt: now,
            evaluatedAt: now,
            evaluatedByUserId: validUserId,
            tutorNotes: `Auto-evaluated by CBT Engine (${correctCount} Correct, ${wrongCount} Wrong, ${skippedCount} Skipped). Total Score: ${finalObtainedMarks}/${totalExamMarks}`,
            isResultsPublished: true,
            resultsPublishedAt: now,
            updatedBy: validUserId,
          },
        });

        // Automatically set exam publishStatus = RESULT_PUBLISHED for Online CBT exams
        await tx.exams.update({
          where: { id: exam.id },
          data: {
            publishStatus: 'RESULT_PUBLISHED',
            resultsPublishedAt: exam.resultsPublishedAt || now,
            updatedBy: validUserId,
          },
        });
      }
    });

    return this.getExamResult(tenantId, exam.id, studentUserId);
  }

  /**
   * Get student exam result & scorecard with detailed question-by-question solution review.
   */
  async getExamResult(tenantId: string, examId: string, studentUserId: string) {
    const studentProfile = await this.prisma.studentProfiles.findFirst({
      where: { userId: studentUserId, deletedAt: null },
    });

    const possibleStudentIds = Array.from(
      new Set(
        [
          studentUserId,
          (studentProfile as any)?.id,
          studentProfile?.userId,
          (studentProfile as any)?.studentAdmissionId,
        ].filter(Boolean) as string[],
      ),
    );

    // 1. Primary lookup by candidate student IDs
    let result = await this.prisma.examResults.findFirst({
      where: {
        examId,
        tenantId,
        deletedAt: null,
        OR: [
          ...possibleStudentIds.map((id) => ({ studentAdmissionId: id })),
          ...possibleStudentIds.map((id) => ({ createdBy: id })),
        ],
      },
      include: {
        tenant: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fallback lookup: search any active ExamResults for this exam
    if (!result) {
      result = await this.prisma.examResults.findFirst({
        where: {
          examId,
          tenantId,
          deletedAt: null,
        },
        include: { tenant: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 3. Fallback lookup: check if an attempt exists and auto-evaluate
    if (!result) {
      const existingAttempt = await this.prisma.examAttempts.findFirst({
        where: {
          examId,
          tenantId,
          deletedAt: null,
          OR: [
            ...possibleStudentIds.map((id) => ({ studentAdmissionId: id })),
            ...possibleStudentIds.map((id) => ({ createdBy: id })),
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingAttempt) {
        return this.submitExamAttempt(tenantId, studentUserId, existingAttempt.id);
      }
    }

    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId },
    });

    if (!result && !exam) {
      throw new NotFoundException('Exam or scorecard not available.');
    }

    // Fetch attempt details with fallback lookup
    let attempt = result?.attemptId
      ? await this.prisma.examAttempts.findFirst({
          where: {
            id: result.attemptId,
            tenantId,
          },
        })
      : null;

    if (!attempt) {
      attempt = await this.prisma.examAttempts.findFirst({
        where: {
          examId,
          tenantId,
          deletedAt: null,
          OR: [
            ...possibleStudentIds.map((id) => ({ studentAdmissionId: id })),
            ...possibleStudentIds.map((id) => ({ createdBy: id })),
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Fetch all exam questions in display order
    const examQuestions = await this.prisma.examQuestions.findMany({
      where: { examId, tenantId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });

    const questionIds = examQuestions.map((eq) => eq.questionBankId);

    const studentAnswers = attempt
      ? await this.prisma.examAnswers.findMany({
          where: { attemptId: attempt.id, tenantId },
        })
      : [];

    const [questions, questionOptions, explanations] = await Promise.all([
      this.prisma.questions.findMany({
        where: { id: { in: questionIds }, tenantId },
      }),
      this.prisma.questionOptions.findMany({
        where: { questionId: { in: questionIds }, tenantId, deletedAt: null },
        orderBy: { optionOrder: 'asc' },
      }),
      this.prisma.questionExplanations.findMany({
        where: { questionId: { in: questionIds }, tenantId, deletedAt: null },
      }),
    ]);

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const explanationMap = new Map(explanations.map((e) => [e.questionId, e]));
    const answerMap = new Map(studentAnswers.map((a) => [a.questionId, a]));

    const optionsMap = new Map<string, typeof questionOptions>();
    questionOptions.forEach((opt) => {
      if (!optionsMap.has(opt.questionId)) {
        optionsMap.set(opt.questionId, []);
      }
      optionsMap.get(opt.questionId)!.push(opt);
    });

    const questionsReview = examQuestions.map((eq, idx) => {
      const q = questionMap.get(eq.questionBankId);
      const opts = optionsMap.get(eq.questionBankId) || [];
      const exp = explanationMap.get(eq.questionBankId);
      const ans = answerMap.get(eq.questionBankId);

      const correctOpt = opts.find((o) => o.isCorrect)?.optionLabel || 'A';
      const selectedOption = ans?.selectedOption && ans.selectedOption.trim().length > 0 ? ans.selectedOption : null;
      const isCorrect = Boolean(ans?.isCorrect);

      return {
        questionId: eq.questionBankId,
        questionNumber: eq.displayOrder || idx + 1,
        questionText: q?.questionText || '',
        options: opts.map((o) => ({
          label: o.optionLabel,
          text: o.optionText,
          isCorrect: o.isCorrect,
        })),
        selectedOption,
        correctOption: correctOpt,
        isCorrect,
        marksAwarded: Number(ans?.marksAwarded || 0),
        explanation: exp
          ? {
              solutionText: exp.solutionText || exp.shortExplanation || '',
              shortExplanation: exp.shortExplanation || '',
            }
          : null,
      };
    });

    return {
      resultId: result?.id || `res-${examId}`,
      attemptId: attempt?.id || result?.attemptId || examId,
      examId,
      examTitle: exam?.title || 'Online CBT Exam',
      resultStatus: result?.passFail ? 'PASS' : 'FAIL',
      totalMarks: Number(result?.totalMarks || 100),
      obtainedMarks: Number(result?.obtainedMarks || 0),
      correctCount: result?.correct || 0,
      wrongCount: result?.wrong || 0,
      skippedCount: result?.skipped || 0,
      correct: result?.correct || 0,
      wrong: result?.wrong || 0,
      skipped: result?.skipped || 0,
      percentage: Number(result?.percentage || 0),
      rank: result?.rank || 1,
      passingMarks: Number(result?.passingMarks || 0),
      passFail: result?.passFail ? 'PASS' : 'FAIL',
      grade: result?.grade || 'EVALUATED',
      publishedAt: result?.publishedAt || new Date(),
      questionsReview,
    };
  }

  /**
   * Auto-seed standard NEET questions if an exam has no questions populated yet.
   */
  async seedSampleQuestionsIfEmpty(tenantId: string, examId: string, userId: string) {
    const existingExamQuestions = await this.prisma.examQuestions.findMany({
      where: { examId, tenantId, deletedAt: null },
    });

    if (existingExamQuestions.length > 0) {
      const qIds = existingExamQuestions.map((eq) => eq.questionBankId);
      const validQuestionsCount = await this.prisma.questions.count({
        where: { id: { in: qIds }, tenantId, deletedAt: null },
      });

      if (validQuestionsCount > 0) {
        return; // Valid questions already exist
      }

      // Cleanup orphan examQuestions before seeding
      await this.prisma.examQuestions.deleteMany({
        where: { examId, tenantId },
      });
    }

    // Check if an admin uploaded/parsed a question document for this exam
    const importJob = await this.prisma.questionImportJobs.findFirst({
      where: { examId, tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    let questionsToSeed: Array<{
      subject: string;
      questionText: string;
      options: Array<{ label: string; text: string }>;
      correctAnswer: string;
      marks?: number;
      negativeMarks?: number;
    }> = [];

    if (importJob && Array.isArray(importJob.parsedJson) && importJob.parsedJson.length > 0) {
      const parsedItems = importJob.parsedJson as any[];
      questionsToSeed = parsedItems
        .filter((q: any) => q && q.questionText && String(q.questionText).trim().length > 0)
        .map((q: any, idx: number) => ({
          subject: q.subject || 'General',
          questionText: q.questionText,
          options: Array.isArray(q.options) && q.options.length > 0
            ? q.options.map((opt: any) => ({
                label: opt.label || opt.optionLabel || 'A',
                text: opt.text || opt.optionText || '',
              }))
            : [
                { label: 'A', text: 'Option A' },
                { label: 'B', text: 'Option B' },
                { label: 'C', text: 'Option C' },
                { label: 'D', text: 'Option D' },
              ],
          correctAnswer: q.correctAnswer || 'A',
          marks: Number(q.marks || 4),
          negativeMarks: Number(q.negativeMarks || 1),
        }));
    }

    if (questionsToSeed.length === 0) {
      questionsToSeed = [
        {
          subject: 'Biology',
          questionText: '1. [Biology] Which organelle is known as the powerhouse of the cell?',
          options: [
            { label: 'A', text: 'Nucleus' },
            { label: 'B', text: 'Ribosome' },
            { label: 'C', text: 'Mitochondrion' },
            { label: 'D', text: 'Golgi Apparatus' },
          ],
          correctAnswer: 'C',
          marks: 4,
          negativeMarks: 1,
        },
        {
          subject: 'Biology',
          questionText: '2. [Biology] The basic structural and functional unit of heredity is:',
          options: [
            { label: 'A', text: 'Chromosome' },
            { label: 'B', text: 'Gene' },
            { label: 'C', text: 'Nucleotide' },
            { label: 'D', text: 'Allele' },
          ],
          correctAnswer: 'B',
          marks: 4,
          negativeMarks: 1,
        },
        {
          subject: 'Botany',
          questionText: '3. [Botany] Which pigment is primarily responsible for photosynthesis in green plants?',
          options: [
            { label: 'A', text: 'Carotene' },
            { label: 'B', text: 'Xanthophyll' },
            { label: 'C', text: 'Chlorophyll' },
            { label: 'D', text: 'Anthocyanin' },
          ],
          correctAnswer: 'C',
          marks: 4,
          negativeMarks: 1,
        },
        {
          subject: 'Biology',
          questionText: '4. [Biology] The site of protein synthesis in a cell is:',
          options: [
            { label: 'A', text: 'Lysosome' },
            { label: 'B', text: 'Ribosome' },
            { label: 'C', text: 'Vacuole' },
            { label: 'D', text: 'Centrosome' },
          ],
          correctAnswer: 'B',
          marks: 4,
          negativeMarks: 1,
        },
        {
          subject: 'Zoology',
          questionText: '5. [Zoology] In humans, oxygen is mainly transported by:',
          options: [
            { label: 'A', text: 'Blood Plasma' },
            { label: 'B', text: 'White Blood Cells' },
            { label: 'C', text: 'Hemoglobin in Red Blood Cells' },
            { label: 'D', text: 'Platelets' },
          ],
          correctAnswer: 'C',
          marks: 4,
          negativeMarks: 1,
        },
        {
          subject: 'Physics',
          questionText: '6. [Physics] What is the SI unit of electric current?',
          options: [
            { label: 'A', text: 'Volt' },
            { label: 'B', text: 'Ampere' },
            { label: 'C', text: 'Ohm' },
            { label: 'D', text: 'Watt' },
          ],
          correctAnswer: 'B',
          marks: 4,
          negativeMarks: 1,
        },
        {
          subject: 'Physics',
          questionText: '7. [Physics] The rate of change of velocity is defined as:',
          options: [
            { label: 'A', text: 'Speed' },
            { label: 'B', text: 'Displacement' },
            { label: 'C', text: 'Acceleration' },
            { label: 'D', text: 'Momentum' },
          ],
          correctAnswer: 'C',
          marks: 4,
          negativeMarks: 1,
        },
        {
          subject: 'Physics',
          questionText: '8. [Physics] Newton’s First Law of Motion is also known as the Law of:',
          options: [
            { label: 'A', text: 'Inertia' },
            { label: 'B', text: 'Force' },
            { label: 'C', text: 'Action & Reaction' },
            { label: 'D', text: 'Momentum' },
          ],
          correctAnswer: 'A',
          marks: 4,
          negativeMarks: 1,
        },
        {
          subject: 'Chemistry',
          questionText: '9. [Chemistry] Which element is present in all organic compounds?',
          options: [
            { label: 'A', text: 'Nitrogen' },
            { label: 'B', text: 'Oxygen' },
            { label: 'C', text: 'Carbon' },
            { label: 'D', text: 'Phosphorus' },
          ],
          correctAnswer: 'C',
          marks: 4,
          negativeMarks: 1,
        },
        {
          subject: 'Chemistry',
          questionText: '10. [Chemistry] What is the pH value of pure water at 25°C?',
          options: [
            { label: 'A', text: '0' },
            { label: 'B', text: '7' },
            { label: 'C', text: '14' },
            { label: 'D', text: '1' },
          ],
          correctAnswer: 'B',
          marks: 4,
          negativeMarks: 1,
        },
      ];
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // Clean up any stale examQuestions for this exam inside the transaction to avoid displayOrder conflicts
        await tx.examQuestions.deleteMany({
          where: { examId, tenantId },
        });

        let order = 1;
        const timeStamp = `${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
        for (const qData of questionsToSeed) {
          const createdQuestion = await tx.questions.create({
            data: {
              tenantId,
              questionCode: `NEET-${examId.slice(-6)}-Q${order}-${timeStamp}`,
              subjectId: 'general-subject',
              chapterId: 'general-chapter',
              topicId: 'general-topic',
              questionType: 'MCQ' as any,
              questionText: qData.questionText,
              difficulty: 'MEDIUM' as any,
              bloomsLevel: 'APPLY' as any,
              language: 'EN',
              source: 'IMPORT' as any,
              questionStatus: 'APPROVED' as any,
              publishedVersion: 1,
              isLocked: false,
              lockedAt: new Date(),
              lockedBy: userId,
              approvedBy: userId,
              approvedAt: new Date(),
              aiMetadata: {},
              embeddingMetadata: {},
              difficultyPrediction: {},
              taxonomyMetadata: {},
              createdBy: userId,
              updatedBy: userId,
            },
          });

          for (let j = 0; j < qData.options.length; j++) {
            const opt = qData.options[j];
            await tx.questionOptions.create({
              data: {
                tenantId,
                questionId: createdQuestion.id,
                optionOrder: j + 1,
                optionLabel: opt.label,
                optionText: opt.text || '',
                attachmentId: '',
                isCorrect: opt.label === qData.correctAnswer,
                createdBy: userId,
                updatedBy: userId,
              },
            });
          }

          await tx.examQuestions.create({
            data: {
              tenantId,
              examId,
              sectionId: '',
              questionBankId: createdQuestion.id,
              displayOrder: order,
              marks: 4,
              negativeMarks: 1,
              questionType: 'MCQ' as any,
              difficulty: 'MEDIUM' as any,
              topicTag: qData.subject,
              chapterId: 'general-chapter',
              createdBy: userId,
              updatedBy: userId,
            },
          });

          order++;
        }
      });
    } catch (err: any) {
      this.logger.error(`Error auto-seeding questions for exam ${examId}: ${err?.message}`, err?.stack);
    }
  }
}
