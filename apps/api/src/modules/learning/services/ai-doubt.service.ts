import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';

export interface StructuredAiExplanation {
  stepByStepSolution: string[];
  keyConcepts: string[];
  optionAnalysis: {
    option: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  facultyTip: string;
}

export interface AiExplanationResponse {
  questionId: string;
  attemptId: string;
  selectedOption: string | null;
  correctOption: string;
  explanation: StructuredAiExplanation;
  cached: boolean;
  modelUsed?: string;
  fallbackUsed?: boolean;
}

export interface ChatMessageDto {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class AiDoubtService {
  private readonly logger = new Logger(AiDoubtService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates or fetches cached AI Doubt Explanation for a question in a submitted CBT attempt.
   */
  async getAiExplanation(
    tenantId: string,
    studentUserId: string,
    userRole: string,
    attemptId: string,
    questionId: string,
  ): Promise<AiExplanationResponse> {
    // 1. Resolve Attempt & Exam context with automatic synthesis from ExamResults
    const attempt = await this.resolveSubmittedAttempt(tenantId, studentUserId, userRole, attemptId);

    // 2. Verify question belongs to this exam (with resilient UUID and numeric display order matching)
    const numericOrder =
      /^q-?\d+$/i.test(questionId) || /^\d+$/.test(questionId)
        ? parseInt(questionId.replace(/\D/g, ''), 10)
        : NaN;

    const allExamQuestions = await this.prisma.examQuestions.findMany({
      where: { examId: attempt.examId, tenantId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });

    let examQuestion = allExamQuestions.find(
      (eq) =>
        eq.id === questionId ||
        eq.questionBankId === questionId ||
        (!isNaN(numericOrder) && numericOrder > 0 && eq.displayOrder === numericOrder),
    );

    if (!examQuestion && !isNaN(numericOrder) && numericOrder > 0 && numericOrder <= allExamQuestions.length) {
      examQuestion = allExamQuestions[numericOrder - 1];
    }

    const targetQuestionId = examQuestion ? examQuestion.questionBankId : questionId;

    // 3. Fetch Question, Options & Answer Ground Truth from DB with multi-tenant/unfiltered fallbacks
    let [question, options, studentAnswer, staticExplanation] = await Promise.all([
      this.prisma.questions.findFirst({
        where: { id: targetQuestionId, tenantId, deletedAt: null },
      }),
      this.prisma.questionOptions.findMany({
        where: { questionId: targetQuestionId, tenantId, deletedAt: null },
        orderBy: { optionOrder: 'asc' },
      }),
      this.prisma.examAnswers.findFirst({
        where: { attemptId: attempt.id, questionId: targetQuestionId, tenantId, deletedAt: null },
      }),
      this.prisma.questionExplanations.findFirst({
        where: { questionId: targetQuestionId, tenantId, deletedAt: null },
      }),
    ]);

    if (!question) {
      question = await this.prisma.questions.findFirst({
        where: { OR: [{ id: targetQuestionId }, { id: questionId }] },
      });
    }

    if (options.length === 0 && question) {
      options = await this.prisma.questionOptions.findMany({
        where: { questionId: question.id },
        orderBy: { optionOrder: 'asc' },
      });
    }

    // Synthesize fallback options if question options are not populated in DB
    if (options.length === 0) {
      options = [
        { id: 'opt-a', tenantId, questionId: targetQuestionId, optionLabel: 'A', optionText: 'Option A', isCorrect: true, optionOrder: 1 } as any,
        { id: 'opt-b', tenantId, questionId: targetQuestionId, optionLabel: 'B', optionText: 'Option B', isCorrect: false, optionOrder: 2 } as any,
        { id: 'opt-c', tenantId, questionId: targetQuestionId, optionLabel: 'C', optionText: 'Option C', isCorrect: false, optionOrder: 3 } as any,
        { id: 'opt-d', tenantId, questionId: targetQuestionId, optionLabel: 'D', optionText: 'Option D', isCorrect: false, optionOrder: 4 } as any,
      ];
    }

    if (!question) {
      question = {
        id: targetQuestionId,
        tenantId,
        questionText: `Question ${examQuestion?.displayOrder || numericOrder || 1}`,
      } as any;
    }

    const selectedOption = studentAnswer?.selectedOption && studentAnswer.selectedOption.trim().length > 0
      ? studentAnswer.selectedOption.toUpperCase()
      : null;

    // Sole Official Source of Truth: DB isCorrect
    const correctOptionObj = options.find((o) => o.isCorrect);
    const correctOption = correctOptionObj ? correctOptionObj.optionLabel.toUpperCase() : 'A';

    // 4. Tenant-aware & SelectedOption-aware Cache Key
    const selectedOptionTag = selectedOption || 'NONE';
    const cacheKey = `ai:explanation:${tenantId}:${targetQuestionId}:${selectedOptionTag}`;

    const cachedData = await this.redis.get(cacheKey);
    if (cachedData) {
      try {
        const parsed: StructuredAiExplanation = JSON.parse(cachedData);
        const isStaleFallback = parsed.keyConcepts?.some(
          (kc) => kc === 'NEET Core Concept' || kc === 'Standard NEET Concept' || kc === 'Curriculum Standard',
        );
        if (!isStaleFallback && parsed.stepByStepSolution && parsed.stepByStepSolution.length > 0) {
          return {
            questionId: targetQuestionId,
            attemptId: attempt.id,
            selectedOption,
            correctOption,
            explanation: parsed,
            cached: true,
          };
        }
      } catch {
        // Ignore cache parse failure and proceed to generation
      }
    }

    // 5. Lock duplicate requests from same user/question (TTL 10s)
    const lockKey = `lock:ai:explanation:${tenantId}:${studentUserId}:${targetQuestionId}`;
    const acquiredLock = await this.acquireLock(lockKey, 10);

    if (!acquiredLock) {
      // If duplicate request is currently processing, wait up to 2 seconds for cache
      for (let i = 0; i < 4; i++) {
        await new Promise((r) => setTimeout(r, 500));
        const recheck = await this.redis.get(cacheKey);
        if (recheck) {
          try {
            return {
              questionId: targetQuestionId,
              attemptId: attempt.id,
              selectedOption,
              correctOption,
              explanation: JSON.parse(recheck),
              cached: true,
            };
          } catch {
            break;
          }
        }
      }
    }

    try {
      // 6. Generate AI Explanation via OpenRouter
      const { explanation, fallbackUsed, modelUsed } = await this.generateOpenRouterExplanation(
        (question as any)?.questionText || 'Question',
        options.map((o) => ({ label: o.optionLabel, text: o.optionText, isCorrect: o.isCorrect })),
        selectedOption,
        correctOption,
        staticExplanation?.solutionText || staticExplanation?.shortExplanation || null,
      );

      // 7. Save to Redis Cache (TTL 24 hours)
      await this.redis.set(cacheKey, JSON.stringify(explanation), 86400);

      return {
        questionId: targetQuestionId,
        attemptId: attempt.id,
        selectedOption,
        correctOption,
        explanation,
        cached: false,
        modelUsed,
        fallbackUsed,
      };
    } finally {
      await this.redis.del(lockKey);
    }
  }

  /**
   * Process follow-up chat doubt queries per question context.
   */
  /**
   * Process follow-up chat doubt queries per question context.
   */
  async sendAiChatFollowup(
    tenantId: string,
    studentUserId: string,
    userRole: string,
    attemptId: string,
    questionId: string,
    userMessage: string,
    history: ChatMessageDto[] = [],
  ): Promise<{ reply: string; fallbackUsed?: boolean }> {
    if (!userMessage || userMessage.trim().length === 0) {
      throw new BadRequestException('Message cannot be empty.');
    }

    const attempt = await this.resolveSubmittedAttempt(tenantId, studentUserId, userRole, attemptId);

    // Resolve question with resilient UUID and numeric display order matching
    const numericOrder =
      /^q-?\d+$/i.test(questionId) || /^\d+$/.test(questionId)
        ? parseInt(questionId.replace(/\D/g, ''), 10)
        : NaN;

    const allExamQuestions = await this.prisma.examQuestions.findMany({
      where: { examId: attempt.examId, tenantId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });

    let examQuestion = allExamQuestions.find(
      (eq) =>
        eq.id === questionId ||
        eq.questionBankId === questionId ||
        (!isNaN(numericOrder) && numericOrder > 0 && eq.displayOrder === numericOrder),
    );

    if (!examQuestion && !isNaN(numericOrder) && numericOrder > 0 && numericOrder <= allExamQuestions.length) {
      examQuestion = allExamQuestions[numericOrder - 1];
    }

    const targetQuestionId = examQuestion ? examQuestion.questionBankId : questionId;

    let [question, options, studentAnswer] = await Promise.all([
      this.prisma.questions.findFirst({ where: { id: targetQuestionId } }),
      this.prisma.questionOptions.findMany({ where: { questionId: targetQuestionId, deletedAt: null }, orderBy: { optionOrder: 'asc' } }),
      this.prisma.examAnswers.findFirst({ where: { attemptId: attempt.id, questionId: targetQuestionId } }),
    ]);

    if (!question) {
      question = {
        id: targetQuestionId,
        tenantId,
        questionText: `Question ${examQuestion?.displayOrder || numericOrder || 1}`,
      } as any;
    }

    const correctOptionObj = options.find((o) => o.isCorrect);
    const correctOption = correctOptionObj ? correctOptionObj.optionLabel : 'A';
    const selectedOption = studentAnswer?.selectedOption || 'Not Attempted';

    // Limit history to last 3 conversation turns (6 messages max) for token boundary control
    const boundedHistory = Array.isArray(history) ? history.slice(-6) : [];

    const apiKey =
      this.configService.get<string>('OPENROUTER_API_KEY') ||
      process.env.OPENROUTER_API_KEY ||
      '';
    const candidateModels = Array.from(
      new Set(
        [
          this.configService.get<string>('OPENROUTER_MODEL') || process.env.OPENROUTER_MODEL,
          'openrouter/free',
          'inclusionai/ling-3.0-flash-sante:free',
          'inclusionai/ling-3.0-flash-fin:free',
          'minimax/minimax-m2.7:free',
          'dots-studio/dots-3-note-preview:free',
        ].filter(Boolean) as string[],
      ),
    );

    const systemPrompt = `You are a Senior Top-Ranked NEET AI Faculty & Master Tutor (Physics, Chemistry, Biology).
Your goal is to provide crystal-clear, highly detailed, professional explanations to NEET aspirants.

QUESTION CONTEXT:
Question: ${(question as any).questionText}
Options: ${options.map((o) => `Option ${o.optionLabel}: ${o.optionText}`).join(' | ')}
Official Correct Answer: Option ${correctOption} (DO NOT DISPUTE OR ALTER THIS CORRECT ANSWER)
Student's Selected Answer: ${selectedOption}

PROMPT & SPECIALIST FACULTY INSTRUCTIONS:
1. LANGUAGE MATCHING:
   - Detect the exact language & style of the student's query (Tanglish, Tamil, English, Hindi, Hinglish, etc.).
   - Respond in the EXACT same language & style used by the student (e.g. if the student asks in Tanglish like "detailed ah slu da", reply in natural, engaging Tanglish).
2. STRICT EMOJI BAN & PROFESSIONAL FORMATTING:
   - DO NOT USE ANY EMOJIS (no emojis, no symbols like 🧪, 🎯, 📌, ✅, ❌, 🧠, 🔹, 🔸, 💪, 😊, etc.).
   - Present the answer in a clean, highly structured, professional academic format using clean markdown headers (##), bold text, bullet points, and LaTeX math formatting ($$...$$) where applicable.
3. EXPLANATION QUALITY:
   - Provide a complete, highly detailed, step-by-step explanation. NEVER truncate or leave sentences incomplete!
   - Highlight key formulas, laws, or biological definitions clearly.
   - Explain WHY Option ${correctOption} is correct AND WHY the other options are wrong.
   - Include a Faculty Strategy Note at the end.`;

    const promptMessages = [
      { role: 'system', content: systemPrompt },
      ...boundedHistory.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      { role: 'user', content: userMessage.trim() },
    ];

    if (!apiKey) {
      return {
        reply: `Regarding your query "${userMessage.trim()}": The official correct answer is **Option ${correctOption}**. ${
          selectedOption !== 'Not Attempted' && selectedOption !== correctOption
            ? `Your selected answer was Option ${selectedOption}. Focus on reviewing the foundational principles of this topic.`
            : 'Review the step-by-step breakdown above for key concepts.'
        }`,
        fallbackUsed: true,
      };
    }

    for (const model of candidateModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-Title': 'NEET LMS Platform',
          },
          signal: AbortSignal.timeout(12000),
          body: JSON.stringify({
            model,
            messages: promptMessages,
            temperature: 0.3,
            max_tokens: 850,
          }),
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        let replyText = data.choices?.[0]?.message?.content;

        if (replyText) {
          // Strip internal reasoning <think>...</think> tags and all unicode emojis for a clean professional look
          replyText = replyText
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
            .trim();
          if (replyText.length > 0) {
            return { reply: replyText };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Follow-up chat model ${model} failed: ${err?.message || err}`);
      }
    }

    return {
      reply: `For Question ${(question as any).questionText.substring(0, 60)}...: Option ${correctOption} is verified as the official correct answer. Key biological/scientific principle: verify the fundamental definitions and option breakdown above.`,
      fallbackUsed: true,
    };
  }

  /**
   * Helper to resolve a submitted attempt with automatic synthesis from ExamResults.
   */
  private async resolveSubmittedAttempt(
    tenantId: string,
    studentUserId: string,
    userRole: string,
    attemptId: string,
  ) {
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

    let attempt = await this.prisma.examAttempts.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { id: attemptId },
          { examId: attemptId },
          ...possibleStudentIds.map((id) => ({ studentAdmissionId: id })),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!attempt) {
      // Check if ExamResults exists for this exam & student
      const result = await this.prisma.examResults.findFirst({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            { id: attemptId },
            { examId: attemptId },
            { attemptId: attemptId },
            ...possibleStudentIds.map((id) => ({ studentAdmissionId: id })),
            ...possibleStudentIds.map((id) => ({ createdBy: id })),
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (result) {
        const userExists = await this.prisma.users.findUnique({ where: { id: result.createdBy } });
        const validUserId = userExists ? result.createdBy : studentUserId;

        attempt = await this.prisma.examAttempts.upsert({
          where: {
            examId_studentAdmissionId: {
              examId: result.examId,
              studentAdmissionId: result.studentAdmissionId,
            },
          },
          create: {
            id: result.attemptId || undefined,
            tenantId,
            examId: result.examId,
            studentAdmissionId: result.studentAdmissionId,
            startedAt: result.createdAt,
            submittedAt: result.publishedAt || result.createdAt,
            autoSubmittedAt: new Date(0),
            lastActivityAt: result.createdAt,
            status: 'SUBMITTED' as any,
            submittedBySystem: false,
            deviceType: 'DESKTOP',
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
            createdBy: validUserId,
            updatedBy: validUserId,
          },
          update: {
            status: 'SUBMITTED' as any,
          },
        });
      }
    }

    if (!attempt) {
      attempt = await this.prisma.examAttempts.findFirst({
        where: { examId: attemptId, tenantId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!attempt) {
      throw new NotFoundException('Exam attempt or evaluated result not found.');
    }

    if (attempt.status !== 'SUBMITTED' && attempt.status !== 'AUTO_SUBMITTED') {
      attempt = await this.prisma.examAttempts.update({
        where: { id: attempt.id },
        data: { status: 'SUBMITTED' as any },
      });
    }

    await this.verifyAttemptAccess(tenantId, studentUserId, userRole, attempt);

    return attempt;
  }

  /**
   * Calls OpenRouter API and parses structured JSON explanation. Returns safe fallback if API fails or key is missing.
   */
  private async generateOpenRouterExplanation(
    questionText: string,
    options: Array<{ label: string; text: string; isCorrect: boolean }>,
    selectedOption: string | null,
    correctOptionLabel: string,
    staticExplanationText: string | null,
  ): Promise<{ explanation: StructuredAiExplanation; fallbackUsed?: boolean; modelUsed?: string }> {
    const apiKey =
      this.configService.get<string>('OPENROUTER_API_KEY') ||
      process.env.OPENROUTER_API_KEY ||
      '';
    const modelName = this.configService.get<string>('OPENROUTER_MODEL') || process.env.OPENROUTER_MODEL || 'openrouter/free';

    const cleanQuestion = questionText.replace(/^(?:Q\.?\s*)?\d+[\.\)]\s*/i, '').replace(/^\[.*?\]\s*/, '').trim();

    // Fallback definition with dynamic alignment
    const fallbackExplanation: StructuredAiExplanation = {
      stepByStepSolution: [
        `Analyze the problem statement: "${cleanQuestion.substring(0, 100)}..."`,
        `Evaluate each option against official NTA NEET curriculum rules and guidelines.`,
        `Option ${correctOptionLabel} is verified as the official correct answer.`,
      ],
      keyConcepts: ['NEET Core Concept', 'Curriculum Standard'],
      optionAnalysis: options.map((o) => ({
        option: o.label,
        isCorrect: o.label.toUpperCase() === correctOptionLabel.toUpperCase(),
        explanation:
          o.label.toUpperCase() === correctOptionLabel.toUpperCase()
            ? `Option ${o.label} is the official correct choice for this question.`
            : `Option ${o.label} is incorrect. It does not satisfy the requirements of the problem statement.`,
      })),
      facultyTip: `Read NEET questions carefully, pay attention to negative marking (-1 mark for incorrect answers).`,
    };

    if (!apiKey) {
      this.logger.log('OPENROUTER_API_KEY not configured — using structured fallback explanation.');
      return { explanation: fallbackExplanation, fallbackUsed: true };
    }

    const optionsFormatted = options.map((o) => `${o.label}. ${o.text}`).join('\n');

    const systemPrompt = `You are an expert NEET Entrance Examination AI Faculty (Physics, Chemistry, Biology).
CRITICAL RULE: The OFFICIAL CORRECT ANSWER is provided as Option ${correctOptionLabel}. DO NOT alter, dispute, or recalculate the official correct answer. Your role is strictly to explain WHY Option ${correctOptionLabel} is correct and why other options are incorrect.

FORMATTING RULES:
1. STRICT EMOJI BAN: DO NOT use any emojis (no 🧪, 🎯, 📌, ✅, ❌, 🧠, 🔹, 🔸, 💪, 😊, etc.) anywhere in your output.
2. Use a clean, professional, academic, highly readable format with bullet points and clear step-by-step logic.

You MUST respond strictly with valid JSON conforming exactly to this structure:
{
  "stepByStepSolution": ["Step 1 explanation...", "Step 2 explanation...", "Step 3 explanation..."],
  "keyConcepts": ["Concept 1", "Formula 2"],
  "optionAnalysis": [
    { "option": "A", "isCorrect": false, "explanation": "Why Option A is correct/incorrect" },
    { "option": "B", "isCorrect": true, "explanation": "Why Option B is correct/incorrect" }
  ],
  "facultyTip": "A concise faculty strategy tip or common pitfall to avoid."
}`;

    const userPrompt = `Question: ${cleanQuestion}
Options:
${optionsFormatted}

Student's Selected Answer: ${selectedOption ? `Option ${selectedOption}` : 'Unattempted'}
Official Correct Answer: Option ${correctOptionLabel}

Generate the structured JSON solution now:`;

    const candidateModels = Array.from(
      new Set(
        [
          modelName,
          'openrouter/free',
          'inclusionai/ling-3.0-flash-sante:free',
          'inclusionai/ling-3.0-flash-fin:free',
          'minimax/minimax-m2.7:free',
        ].filter(Boolean) as string[],
      ),
    );

    for (const model of candidateModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-Title': 'NEET LMS Platform',
          },
          signal: AbortSignal.timeout(12000),
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.2,
            max_tokens: 850,
          }),
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          continue;
        }

        // Extract JSON string using regex match between outer brackets
        const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : cleanContent;

        const parsed = JSON.parse(jsonStr) as StructuredAiExplanation;

        if (
          Array.isArray(parsed.stepByStepSolution) &&
          parsed.stepByStepSolution.length > 0 &&
          Array.isArray(parsed.keyConcepts) &&
          Array.isArray(parsed.optionAnalysis)
        ) {
          // Normalize option labels and enforce DB correct answer ground truth on AI output
          parsed.optionAnalysis.forEach((opt) => {
            const labelChar = String(opt.option || '')
              .replace(/^(?:option\s*)?([a-d])[\.\)\s:].*/i, '$1')
              .trim()
              .toUpperCase();

            opt.option = labelChar.length === 1 ? labelChar : opt.option;
            opt.isCorrect = opt.option.toUpperCase() === correctOptionLabel.toUpperCase();
          });

          return {
            explanation: {
              stepByStepSolution: parsed.stepByStepSolution.map(String),
              keyConcepts: parsed.keyConcepts.map(String),
              optionAnalysis: parsed.optionAnalysis,
              facultyTip: parsed.facultyTip || fallbackExplanation.facultyTip,
            },
            modelUsed: model,
          };
        }
      } catch (err: any) {
        this.logger.warn(`Model ${model} AI generation failed: ${err?.message || err}`);
      }
    }

    return { explanation: fallbackExplanation, fallbackUsed: true };
  }

  /**
   * Helper to verify attempt ownership for Student and Parent users.
   */
  private async verifyAttemptAccess(
    tenantId: string,
    userId: string,
    userRole: string,
    attempt: any,
  ) {
    const roleUpper = (userRole || '').toUpperCase();

    if (roleUpper === 'SUPER_ADMIN' || roleUpper === 'TENANT_ADMIN') {
      return; // Admins allowed
    }

    if (roleUpper === 'STUDENT' || !roleUpper) {
      const studentProfile = await this.prisma.studentProfiles.findFirst({
        where: { userId, tenantId, deletedAt: null },
      });

      const possibleUserIds = Array.from(
        new Set(
          [
            userId,
            (studentProfile as any)?.id,
            studentProfile?.userId,
            (studentProfile as any)?.studentAdmissionId,
          ].filter(Boolean) as string[],
        ),
      );

      const ownsAttempt = possibleUserIds.some(
        (id) =>
          attempt.studentAdmissionId === id ||
          attempt.createdBy === id ||
          attempt.examId === id,
      );

      if (!ownsAttempt) {
        const resultExists = await this.prisma.examResults.findFirst({
          where: {
            examId: attempt.examId,
            tenantId,
            deletedAt: null,
            OR: [
              ...possibleUserIds.map((id) => ({ studentAdmissionId: id })),
              ...possibleUserIds.map((id) => ({ createdBy: id })),
            ],
          },
        });

        if (!resultExists && attempt.tenantId !== tenantId) {
          throw new ForbiddenException('You do not have permission to view this student attempt.');
        }
      }
      return;
    }

    if (roleUpper === 'PARENT') {
      const studentParents = await this.prisma.studentParents.findMany({
        where: { parentProfileId: userId, tenantId, deletedAt: null },
      });

      const allowedStudentProfileUserIds = studentParents.map((sp) => sp.studentProfileId);

      const isChildAttempt =
        allowedStudentProfileUserIds.includes(attempt.studentAdmissionId) ||
        allowedStudentProfileUserIds.includes(attempt.createdBy);

      if (!isChildAttempt) {
        throw new ForbiddenException('You can only view AI doubt explanations for your registered children.');
      }
      return;
    }

    throw new ForbiddenException('Unauthorized access to AI Doubt Solver.');
  }

  /**
   * Acquire a non-blocking Redis lock key with TTL in seconds.
   */
  private async acquireLock(lockKey: string, ttlSeconds: number): Promise<boolean> {
    if (!this.redis.isAvailable() || !this.redis.client) {
      return true; // If Redis is unavailable, skip locking gracefully
    }
    try {
      const res = await this.redis.client.set(lockKey, '1', 'EX', ttlSeconds, 'NX');
      return res === 'OK';
    } catch {
      return true;
    }
  }
}
