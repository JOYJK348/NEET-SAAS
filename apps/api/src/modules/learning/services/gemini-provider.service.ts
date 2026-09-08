import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import type { StructuredAiExplanation } from './ai-doubt.service';

export interface ChatMessageContext {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface QuestionContext {
  questionText: string;
  options: Array<{ label: string; text: string; isCorrect: boolean }>;
  correctOptionLabel: string;
  selectedOption: string | null;
  subject?: string;
  chapter?: string;
  staticExplanationText?: string | null;
}

@Injectable()
export class GeminiProviderService {
  private readonly logger = new Logger(GeminiProviderService.name);

  constructor(private readonly configService: ConfigService) {}

  private getApiKey(): string {
    let key =
      this.configService.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY ||
      '';

    if (!key) {
      // Direct disk fallback so hot-reloading never misses a newly added .env key
      try {
        const rootEnvPath = path.resolve(process.cwd(), '.env');
        const altEnvPath = path.resolve(process.cwd(), '../../.env');
        const targetPath = fs.existsSync(rootEnvPath) ? rootEnvPath : fs.existsSync(altEnvPath) ? altEnvPath : null;

        if (targetPath) {
          const envContent = fs.readFileSync(targetPath, 'utf8');
          const match = envContent.match(/^GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/m);
          if (match && match[1]) {
            key = match[1].trim();
            process.env.GEMINI_API_KEY = key;
          }
        }
      } catch {
        // Ignore file read error
      }
    }

    return key;
  }

  private getModelName(): string {
    let model =
      this.configService.get<string>('GEMINI_MODEL') ||
      process.env.GEMINI_MODEL ||
      '';

    if (!model) {
      try {
        const rootEnvPath = path.resolve(process.cwd(), '.env');
        const altEnvPath = path.resolve(process.cwd(), '../../.env');
        const targetPath = fs.existsSync(rootEnvPath) ? rootEnvPath : fs.existsSync(altEnvPath) ? altEnvPath : null;

        if (targetPath) {
          const envContent = fs.readFileSync(targetPath, 'utf8');
          const match = envContent.match(/^GEMINI_MODEL=["']?([^"'\r\n]+)["']?/m);
          if (match && match[1]) {
            model = match[1].trim();
            process.env.GEMINI_MODEL = model;
          }
        }
      } catch {
        // Ignore
      }
    }

    return model || 'gemini-3.6-flash';
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs = 25000): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Model call timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timer);
    });
  }

  /**
   * Generates structured initial explanation via Gemini API.
   */
  async generateExplanation(
    context: QuestionContext,
  ): Promise<{ explanation: StructuredAiExplanation; modelUsed?: string; fallbackUsed?: boolean }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      this.logger.warn('AI_RESPONSE_SOURCE=FALLBACK (GEMINI_API_KEY not set)');
      return { explanation: this.buildLocalStructuredFallback(context), fallbackUsed: true };
    }

    const primaryModel = this.getModelName();
    const candidateModels = Array.from(
      new Set([primaryModel, 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest']),
    );

    const cleanQuestion = context.questionText
      .replace(/^(?:Q\.?\s*)?\d+[\.\)]\s*/i, '')
      .replace(/^\[.*?\]\s*/, '')
      .trim();

    const optionsFormatted = context.options
      .map((o) => `Option ${o.label}: ${o.text}`)
      .join('\n');

    const systemPrompt = `You are an expert NEET/JEE Entrance Examination Master Faculty (Physics, Chemistry, Biology).
CRITICAL RULE: The OFFICIAL CORRECT ANSWER is provided as Option ${context.correctOptionLabel}. DO NOT alter, dispute, or recalculate the official correct answer. Your role is strictly to explain WHY Option ${context.correctOptionLabel} is correct and why other options are incorrect.

FORMATTING RULES:
1. STRICT EMOJI BAN: DO NOT use any emojis anywhere in your output.
2. Use clean, professional, academic formatting with markdown and LaTeX math ($...$ or $$...$$).

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

    const userPrompt = `Subject/Topic: ${context.subject || 'NEET Syllabus'} / ${context.chapter || 'Core Chapter'}
Question: ${cleanQuestion}
Options:
${optionsFormatted}

Student's Selected Answer: ${context.selectedOption ? `Option ${context.selectedOption}` : 'Unattempted'}
Official Correct Answer: Option ${context.correctOptionLabel}
${context.staticExplanationText ? `NCERT Textbook Hint: ${context.staticExplanationText}` : ''}

Generate the structured JSON solution now:`;

    const ai = new GoogleGenAI({ apiKey });

    for (const model of candidateModels) {
      try {
        this.logger.log(`AI_PROVIDER=gemini Action=generateExplanation Model=${model}`);
        const response = await this.withTimeout(
          ai.models.generateContent({
            model,
            contents: `${systemPrompt}\n\n${userPrompt}`,
          }),
          25000,
        );

        const content = response.text;
        if (!content) continue;

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
          parsed.optionAnalysis.forEach((opt) => {
            const labelChar = String(opt.option || '')
              .replace(/^(?:option\s*)?([a-d])[\.\)\s:].*/i, '$1')
              .trim()
              .toUpperCase();

            opt.option = labelChar.length === 1 ? labelChar : opt.option;
            opt.isCorrect = opt.option.toUpperCase() === context.correctOptionLabel.toUpperCase();
          });

          this.logger.log(`AI_RESPONSE_SOURCE=GEMINI Model=${model}`);
          return {
            explanation: {
              stepByStepSolution: parsed.stepByStepSolution.map(String),
              keyConcepts: parsed.keyConcepts.map(String),
              optionAnalysis: parsed.optionAnalysis,
              facultyTip: parsed.facultyTip || 'Read NEET questions carefully to avoid negative marking.',
            },
            modelUsed: model,
          };
        }
      } catch (err: any) {
        this.logger.warn(`Gemini model ${model} explanation attempt failed: ${err?.message || err}`);
      }
    }

    this.logger.warn('AI_RESPONSE_SOURCE=FALLBACK (Gemini generation exhausted)');
    return { explanation: this.buildLocalStructuredFallback(context), fallbackUsed: true };
  }

  /**
   * Generates conversational follow-up chat response via Gemini API.
   */
  async generateChatFollowup(
    context: QuestionContext,
    userMessage: string,
    history: ChatMessageContext[] = [],
  ): Promise<{ reply: string; modelUsed?: string; fallbackUsed?: boolean }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      this.logger.warn('AI_RESPONSE_SOURCE=FALLBACK (GEMINI_API_KEY not set)');
      return { reply: this.buildNaturalLocalFallback(context, userMessage), fallbackUsed: true };
    }

    const primaryModel = this.getModelName();
    const candidateModels = Array.from(
      new Set([primaryModel, 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest']),
    );

    const boundedHistory = Array.isArray(history) ? history.slice(-6) : [];

    const systemPrompt = `You are an expert NEET/JEE AI Master Tutor (Physics, Chemistry, Biology) having a natural, friendly, one-to-one academic conversation with a student.

QUESTION CONTEXT:
Question: ${context.questionText}
Options: ${context.options.map((o) => `Option ${o.label}: ${o.text}`).join(' | ')}
Official Correct Answer: Option ${context.correctOptionLabel} (AUTHORITATIVE GROUND TRUTH - DO NOT ALTER OR CONTRADICT THIS)
Student's Selected Answer: ${context.selectedOption || 'Unattempted'}
${context.staticExplanationText ? `Textbook Hint: ${context.staticExplanationText}` : ''}

CORE TUTORING INSTRUCTIONS:
1. BEHAVIOR & INTENT DETECTION:
   - Treat every student message as a genuine, conversational academic doubt.
   - DO NOT repeat the full problem solution or start every answer with "Option X is correct" or "Step 1/Step 2/Step 3".
   - Understand what the student is specifically asking (e.g. asking for a simpler explanation, challenging why another option is wrong, asking for a formula, requesting an example, or saying "puriyala" / "puriyaala").
   - Answer THAT specific doubt directly. Build on previous conversation messages naturally.

2. ADAPTIVE DEPTH & SIMPLIFICATION:
   - If student says "puriyala" / "puriyaala" / "not understanding", DO NOT repeat previous wording. Explain the concept from a completely new angle using a simple real-life analogy.
   - If student says "short ah explain", keep it concise and direct.
   - If student asks "Why not Option X?", address Option X specifically. Do not analyze all 4 options unless asked.
   - If student asks for a formula, provide the formula, define variables, and explain units clearly.

3. LANGUAGE & STYLE:
   - Match student's language and tone naturally (Tanglish, Tamil, English, Hinglish).
   - Use friendly, clear, student-focused academic tutoring language like ChatGPT or Gemini.
   - DO NOT use artificial robotic template phrases.
   - STRICT EMOJI BAN: Do not use any emojis in your response. Keep formatting clean with standard markdown and LaTeX math ($...$ or $$...$$).

4. GROUND TRUTH RULE:
   - Option ${context.correctOptionLabel} is the verified official correct answer. Never tell the student an incorrect option is correct. Explain the scientific reasoning clearly while preserving ground truth.`;

    const historyFormatted = boundedHistory
      .map((h) => `${h.role === 'assistant' ? 'Tutor' : 'Student'}: ${h.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}

RECENT CONVERSATION HISTORY:
${historyFormatted || '(No prior follow-up messages yet)'}

Student Current Question: ${userMessage.trim()}
Tutor Response:`;

    const ai = new GoogleGenAI({ apiKey });

    for (const model of candidateModels) {
      try {
        this.logger.log(`AI_PROVIDER=gemini Action=generateChatFollowup Model=${model}`);
        const response = await this.withTimeout(
          ai.models.generateContent({
            model,
            contents: fullPrompt,
          }),
          25000,
        );

        let replyText = response.text;
        if (replyText) {
          replyText = replyText
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(
              /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu,
              '',
            )
            .trim();

          if (replyText.length > 0) {
            this.logger.log(`AI_RESPONSE_SOURCE=GEMINI Model=${model}`);
            return { reply: replyText, modelUsed: model };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Gemini model ${model} chat follow-up failed: ${err?.message || err}`);
      }
    }

    this.logger.warn('AI_RESPONSE_SOURCE=FALLBACK (Gemini chat models exhausted)');
    return { reply: this.buildNaturalLocalFallback(context, userMessage), fallbackUsed: true };
  }

  /**
   * Natural, context-aware local fallback for chat doubts handling spelling variations & natural tutor responses.
   */
  private buildNaturalLocalFallback(context: QuestionContext, userMessage: string): string {
    const msgLower = userMessage.toLowerCase().trim();
    const qLower = context.questionText.toLowerCase();

    // 1. "coulomb" / "coloumb" query
    if (/c[ou]{1,2}l[ou]{1,2}mb/i.test(msgLower)) {
      return `Coulomb (symbol: C) is the standard SI unit of electric charge.

Think of electric charge like water in a bucket: 1 Coulomb is a fixed quantity of electric charge containing approximately $6.24 \\times 10^{18}$ electrons ($6.25 \\text{ billion billion electrons}$).

Key formula connecting charge ($Q$), current ($I$), and time ($t$):
$$Q = I \\cdot t \\implies 1 \\text{ Coulomb} = 1 \\text{ Ampere} \\times 1 \\text{ second}$$

In Coulomb's Law, force between two charges is:
$$F = k \\frac{|q_1 q_2|}{r^2}$$`;
    }

    // 2. "ampere" / "amper" query
    if (/amp[e|a]?r/i.test(msgLower)) {
      return `Ampere (symbol: A) is the base SI unit of electric current.

While Coulomb measures the total quantity of charge (like volume of water in a tank), Ampere measures how fast charge flows through a wire per second ($1 \\text{ A} = 1 \\text{ C/s}$).

$$I = \\frac{Q}{t}$$`;
    }

    // 3. Difference between coulomb & ampere
    if (
      /diff|rendu|vs|compare/i.test(msgLower) &&
      (/c[ou]{1,2}l[ou]{1,2}mb/i.test(msgLower) || /amp/i.test(msgLower) || qLower.includes('coulomb') || qLower.includes('ampere'))
    ) {
      return `Here is the key difference between Coulomb and Ampere:

• **Coulomb (C)**: Total quantity of electric charge ($Q$). Think of it like liters of water stored in a tank.
• **Ampere (A)**: Rate of electric current flow ($I = Q/t$). Think of it like liters per second flowing out of a pipe.

Relationship:
$$1 \\text{ Ampere} = \\frac{1 \\text{ Coulomb}}{1 \\text{ second}}$$`;
    }

    // 4. Formula request
    if (/formu|formula|equation/i.test(msgLower)) {
      if (qLower.includes('lens') || qLower.includes('optics') || qLower.includes('refraction')) {
        return `Here are the essential optics formulas:

1. **Thin Lens Formula**: $\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}$
2. **Magnification**: $m = \\frac{v}{u} = \\frac{h_i}{h_o}$
3. **Power of Lens**: $P = \\frac{1}{f \\text{ (in meters)}}$`;
      }

      return `Here are the key formulas for electric charge and current:

1. **Charge & Current**: $Q = I \\cdot t$ or $I = \\frac{Q}{t}$
2. **Quantization of Charge**: $Q = n \\cdot e$ (where $e = 1.6 \\times 10^{-19} \\text{ C}$)
3. **Combined Current Formula**: $I = \\frac{n \\cdot e}{t}$`;
    }

    // 5. "puriyala" / "puriyaala" / "purila" / "not understand"
    if (/pur[i|ya]{1,3}l[a|i]|not understand|explain again|clearly/i.test(msgLower)) {
      const correctOptObj = context.options.find((o) => o.label.toUpperCase() === context.correctOptionLabel.toUpperCase());
      const correctText = correctOptObj ? correctOptObj.text : `Option ${context.correctOptionLabel}`;

      return `No problem! Let me explain this in simple terms:

In this problem: "${context.questionText.substring(0, 100)}..."

Option ${context.correctOptionLabel} (${correctText}) is correct because electric charge ($Q$) is measured in Coulombs ($\text{C}$), whereas current flow speed ($I$) is measured in Amperes ($\text{A}$).

Think of Coulombs as the amount of electricity, and Amperes as the flow speed. Which specific point can I clarify further for you?`;
    }

    // 6. Natural tutor response for any other doubt
    const correctOptObj = context.options.find((o) => o.label.toUpperCase() === context.correctOptionLabel.toUpperCase());
    const correctText = correctOptObj ? correctOptObj.text : `Option ${context.correctOptionLabel}`;

    return `Let me help you with your doubt on "${userMessage.trim()}":

For this question, Option ${context.correctOptionLabel} (${correctText}) is the correct choice.

If you would like me to explain any specific concept, option comparison, or formula, tell me what you'd like to explore next!`;
  }

  /**
   * Local structured fallback when initial explanation fails.
   */
  private buildLocalStructuredFallback(context: QuestionContext): StructuredAiExplanation {
    const cleanQ = context.questionText.replace(/^\[.*?\]\s*/, '').trim();
    const correctOptObj = context.options.find((o) => o.label.toUpperCase() === context.correctOptionLabel.toUpperCase());
    const correctOptText = correctOptObj ? correctOptObj.text : `Option ${context.correctOptionLabel}`;

    return {
      stepByStepSolution: [
        `Problem Analysis: "${cleanQ.substring(0, 120)}..."`,
        `NCERT Curriculum Principle: Analyze the core scientific law or rule governing this topic.`,
        `Ground Truth Verification: Option ${context.correctOptionLabel} (${correctOptText}) is confirmed as the official correct answer.`,
      ],
      keyConcepts: ['NCERT Core Standard', 'NEET Syllabus Principle'],
      optionAnalysis: context.options.map((o) => ({
        option: o.label,
        isCorrect: o.label.toUpperCase() === context.correctOptionLabel.toUpperCase(),
        explanation:
          o.label.toUpperCase() === context.correctOptionLabel.toUpperCase()
            ? `Option ${o.label} (${o.text}) is the official correct choice.`
            : `Option ${o.label} (${o.text}) is incorrect according to official NTA criteria.`,
      })),
      facultyTip: 'Always read NEET questions carefully to identify key terms and avoid negative marking (-1 mark).',
    };
  }
}
