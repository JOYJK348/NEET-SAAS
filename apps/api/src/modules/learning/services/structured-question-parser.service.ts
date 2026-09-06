import { Injectable, Logger } from '@nestjs/common';

export interface ParsedOption {
  label: string;
  text: string;
}

export interface ParsedQuestionItem {
  questionNumber: number;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  options: ParsedOption[];
  correctAnswer: string | null;
  marks: number;
  negativeMarks: number;
  explanation: string | null;
  status: 'VALID' | 'WARNING' | 'NEEDS_REVIEW' | 'INVALID';
  validationMessage?: string;
}

export interface ParserResult {
  totalQuestionsFound: number;
  validCount: number;
  needsReviewCount: number;
  invalidCount: number;
  questions: ParsedQuestionItem[];
}

@Injectable()
export class StructuredQuestionParserService {
  private readonly logger = new Logger(StructuredQuestionParserService.name);

  /**
   * Parse extracted raw text into structured normalized questions with strict validation.
   */
  parseText(
    rawText: string,
    defaultMarks = 4,
    defaultNegativeMarks = 1,
    separateAnswerKeyText?: string,
  ): ParserResult {
    const questions: ParsedQuestionItem[] = [];

    // Separate question blocks using pattern matching: "1.", "Q1", "Question 1", etc.
    const blocks = this.splitIntoQuestionBlocks(rawText);

    // Parse standalone answer key block if present in main text or separate text
    const answerKeyMap = this.extractAnswerKeyMap(
      separateAnswerKeyText || rawText,
    );

    let qIndex = 1;
    for (const block of blocks) {
      const item = this.parseSingleBlock(
        block,
        qIndex,
        defaultMarks,
        defaultNegativeMarks,
        answerKeyMap,
      );
      if (item) {
        questions.push(item);
        qIndex++;
      }
    }

    // Normalize and validate all parsed questions
    const normalizedQuestions = questions.map((q) =>
      this.validateAndNormalizeQuestion(q),
    );

    const validCount = normalizedQuestions.filter(
      (q) => q.status === 'VALID',
    ).length;
    const needsReviewCount = normalizedQuestions.filter(
      (q) => q.status === 'NEEDS_REVIEW' || q.status === 'WARNING',
    ).length;
    const invalidCount = normalizedQuestions.filter(
      (q) => q.status === 'INVALID',
    ).length;

    return {
      totalQuestionsFound: normalizedQuestions.length,
      validCount,
      needsReviewCount,
      invalidCount,
      questions: normalizedQuestions,
    };
  }

  private splitIntoQuestionBlocks(text: string): string[] {
    const normalized = text.replace(/\r\n/g, '\n');
    // Split by question number indicators like "1.", "Q1.", "Question 1:"
    const questionRegex = /(?:\n|^)(?:Q(?:uestion)?\s*)?(\d{1,3})[\.\:\)]\s+/gi;

    const matches: { index: number; num: number }[] = [];
    let match: RegExpExecArray | null;

    while ((match = questionRegex.exec(normalized)) !== null) {
      matches.push({ index: match.index, num: parseInt(match[1], 10) });
    }

    if (matches.length === 0) {
      // Fallback split by double newlines if numbers not found
      return normalized
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter((b) => b.length > 10);
    }

    const blocks: string[] = [];
    for (let i = 0; i < matches.length; i++) {
      const startIndex = matches[i].index;
      const endIndex =
        i + 1 < matches.length ? matches[i + 1].index : normalized.length;
      const blockStr = normalized.substring(startIndex, endIndex).trim();
      if (blockStr.length > 5) {
        blocks.push(blockStr);
      }
    }

    return blocks;
  }

  private extractAnswerKeyMap(text: string): Map<number, string> {
    const keyMap = new Map<number, string>();
    const keyRegex =
      /(?:Q|Question)?\s*(\d{1,3})\s*[\.\:\-\=]\s*([A-Ea-e1-4])\b/gi;

    let match: RegExpExecArray | null;
    while ((match = keyRegex.exec(text)) !== null) {
      const qNum = parseInt(match[1], 10);
      let val = match[2].toUpperCase();
      if (val === '1') val = 'A';
      if (val === '2') val = 'B';
      if (val === '3') val = 'C';
      if (val === '4') val = 'D';

      keyMap.set(qNum, val);
    }

    return keyMap;
  }

  private parseSingleBlock(
    block: string,
    fallbackNum: number,
    defaultMarks: number,
    defaultNegativeMarks: number,
    answerKeyMap: Map<number, string>,
  ): ParsedQuestionItem | null {
    if (!block || !block.trim()) return null;

    let workingBlock = block.trim();

    // 1. Extract explanation or inline answer key first
    let explanationText: string | null = null;
    const expMatch = workingBlock.match(/(?:Explanation|Solution):\s*([^\n]+)/i);
    if (expMatch) {
      explanationText = expMatch[1].trim();
      workingBlock = workingBlock.replace(expMatch[0], '').trim();
    }

    let correctAnswer: string | null = null;
    const ansKeyMatch = workingBlock.match(/(?:Correct\s*Answer|Answer\s*Key|Answer|Ans):\s*([A-E1-5])/i);
    if (ansKeyMatch) {
      let rawAns = ansKeyMatch[1].toUpperCase();
      if (rawAns === '1') rawAns = 'A';
      if (rawAns === '2') rawAns = 'B';
      if (rawAns === '3') rawAns = 'C';
      if (rawAns === '4') rawAns = 'D';
      if (rawAns === '5') rawAns = 'E';
      correctAnswer = rawAns;
      workingBlock = workingBlock.replace(ansKeyMatch[0], '').trim();
    }

    // 2. Detect question number
    let qNum = fallbackNum;
    const numMatch = workingBlock.match(/^(?:Q(?:uestion)?\s*)?(\d{1,3})/i);
    if (numMatch) {
      qNum = parseInt(numMatch[1], 10);
    }

    // 3. Extract options (handles both inline options & newline options)
    const optionsMap = new Map<string, string>();
    const optionMatches: { label: string; index: number; fullMatchLength: number }[] = [];

    const optionRegex = /(?:^|\s+|[\n\r])(?:[\(\[]?([A-E1-5])[\.\)\]])\s+/gi;
    let match: RegExpExecArray | null;

    while ((match = optionRegex.exec(workingBlock)) !== null) {
      let label = match[1].toUpperCase();
      if (label === '1') label = 'A';
      if (label === '2') label = 'B';
      if (label === '3') label = 'C';
      if (label === '4') label = 'D';
      if (label === '5') label = 'E';

      // Only record the first occurrence of each unique option label (A, B, C, D, E)
      if (!optionsMap.has(label)) {
        optionsMap.set(label, '');
        optionMatches.push({
          label,
          index: match.index,
          fullMatchLength: match[0].length,
        });
      }
    }

    let questionText = workingBlock;
    if (optionMatches.length > 0) {
      // Sort option matches by position in the block
      optionMatches.sort((a, b) => a.index - b.index);

      // Question text is everything before the first option match
      questionText = workingBlock.substring(0, optionMatches[0].index).trim();

      // Extract text for each option slice
      for (let i = 0; i < optionMatches.length; i++) {
        const current = optionMatches[i];
        const contentStart = current.index + current.fullMatchLength;
        const contentEnd =
          i + 1 < optionMatches.length ? optionMatches[i + 1].index : workingBlock.length;

        let optText = workingBlock.substring(contentStart, contentEnd).trim();
        if (optText.endsWith('*') || optText.startsWith('*')) {
          if (!correctAnswer) correctAnswer = current.label;
          optText = optText.replace(/\*/g, '').trim();
        }

        optionsMap.set(current.label, optText);
      }
    }

    // Clean question text header (e.g. "1. [Biology]" -> "[Biology]")
    questionText = questionText
      .replace(/^(?:Q(?:uestion)?\s*)?\d{1,3}[\.\:\)]\s*/i, '')
      .trim();

    if (!questionText) {
      questionText = block.substring(0, 100).trim();
    }

    // Fallback answer key from global map if not found in block
    if (!correctAnswer) {
      correctAnswer = answerKeyMap.get(qNum) || null;
    }

    // Convert map to sorted options array (A, B, C, D...)
    const options: ParsedOption[] = Array.from(optionsMap.entries())
      .map(([label, text]) => ({ label, text }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return {
      questionNumber: qNum,
      questionText,
      questionType: 'SINGLE_CHOICE',
      options,
      correctAnswer,
      marks: defaultMarks,
      negativeMarks: defaultNegativeMarks,
      explanation: explanationText,
      status: 'VALID',
    };
  }

  private validateAndNormalizeQuestion(
    q: ParsedQuestionItem,
  ): ParsedQuestionItem {
    const updated = { ...q };
    const messages: string[] = [];

    if (!updated.questionText || updated.questionText.length < 5) {
      updated.status = 'INVALID';
      messages.push('Question text is missing or too short.');
    }

    if (updated.options.length < 2) {
      updated.status = 'INVALID';
      messages.push(
        `Insufficient options found (${updated.options.length}). Minimum 2 required.`,
      );
    }

    if (!updated.correctAnswer) {
      if (updated.status !== 'INVALID') {
        updated.status = 'NEEDS_REVIEW';
        messages.push('Missing correct answer key.');
      }
    } else {
      const validLabels = updated.options.map((o) => o.label);
      if (!validLabels.includes(updated.correctAnswer)) {
        if (updated.status !== 'INVALID') {
          updated.status = 'NEEDS_REVIEW';
          messages.push(
            `Correct answer "${updated.correctAnswer}" does not match available option labels (${validLabels.join(', ')}).`,
          );
        }
      }
    }

    if (messages.length > 0) {
      updated.validationMessage = messages.join(' ');
    }

    return updated;
  }
}
