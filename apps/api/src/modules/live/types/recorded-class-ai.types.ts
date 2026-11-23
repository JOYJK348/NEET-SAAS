/**
 * Type definitions for NEET SaaS Recorded Class AI Analyzer (Phase 2).
 * Covers structured video transcription, curriculum grounding, and
 * NEET-oriented intelligent study notes.
 */

export interface LectureOverview {
  title: string;
  language: string;
  durationSeconds: number;
  overview: string;
  learningObjectives: string[];
}

export interface TranscriptSegment {
  startSeconds: number;
  endSeconds: number;
  timestampLabel: string; // e.g. "00:00 - 02:30"
  speaker?: string;
  text: string;
  topicReference?: string | null;
}

export interface DefinitionItem {
  term: string;
  definition: string;
  explanation?: string;
  relatedTopic?: string;
  timestamp?: string;
}

export interface FormulaItem {
  name: string;
  expression: string;
  variableExplanations: string;
  siUnits?: string;
  conditions?: string;
  relatedTopic?: string;
  timestamp?: string;
}

export interface ConceptItem {
  title: string;
  category:
    | 'HIGH_YIELD'
    | 'FREQUENTLY_CONFUSED'
    | 'DIFFERENCE'
    | 'PROCESS'
    | 'EXCEPTION'
    | 'PRINCIPLE';
  explanation: string;
  neetRelevance: string;
}

export interface WorkedExample {
  problem: string;
  stepByStepExplanation: string[];
  finalResult?: string;
  relatedConcept?: string;
  timestamp?: string;
}

export interface NeetExamPoint {
  point: string;
  relevance: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  potentialQuestionAngle?: string;
}

export interface TopicNote {
  title: string;
  startSeconds: number;
  endSeconds: number;
  timestampLabel: string;
  explanation: string;
  subtopics: string[];
  definitions: DefinitionItem[];
  concepts: ConceptItem[];
  formulas: FormulaItem[];
  examples: WorkedExample[];
  neetExamPoints: NeetExamPoint[];
  confidence: number; // 0 - 1
}

export interface LectureConclusion {
  summary: string;
  revisionChecklist: string[];
  homework: string[];
}

export interface QualityAssessment {
  completenessScore: number; // 0 - 100
  uncertainSections: string[];
  warnings: string[];
}

export interface RecordedClassStudyNotes {
  lecture: LectureOverview;
  transcript: {
    segments: TranscriptSegment[];
  };
  topics: TopicNote[];
  definitions: DefinitionItem[];
  formulaCheatSheet: FormulaItem[];
  importantConcepts: ConceptItem[];
  workedExamples: WorkedExample[];
  neetExamPoints: NeetExamPoint[];
  lectureConclusion: LectureConclusion;
  quality: QualityAssessment;
  metadata: {
    provider: string;
    model: string;
    analyzedAt: string;
    courseName?: string | null;
    subjectName?: string | null;
    chapterName?: string | null;
    topicName?: string | null;
    batchName?: string | null;
    tutorName?: string | null;
  };
}

/**
 * Validates raw JSON output from Gemini against RecordedClassStudyNotes schema.
 */
export function validateRecordedClassStudyNotes(raw: any): {
  valid: boolean;
  errors: string[];
  data?: RecordedClassStudyNotes;
} {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Response must be a non-null JSON object'] };
  }

  // Lecture overview validation
  if (!raw.lecture || typeof raw.lecture !== 'object') {
    errors.push('Missing or invalid "lecture" object');
  } else {
    if (!raw.lecture.title || typeof raw.lecture.title !== 'string') {
      errors.push('Missing "lecture.title" string');
    }
    if (!raw.lecture.overview || typeof raw.lecture.overview !== 'string') {
      errors.push('Missing "lecture.overview" string');
    }
  }

  // Topics validation
  if (!Array.isArray(raw.topics) || raw.topics.length === 0) {
    errors.push('"topics" must be a non-empty array of topic notes');
  } else {
    for (let i = 0; i < raw.topics.length; i++) {
      const t = raw.topics[i];
      if (!t.title || typeof t.title !== 'string') {
        errors.push(`Topic at index ${i} is missing a title`);
      }
      if (typeof t.startSeconds !== 'number' || typeof t.endSeconds !== 'number') {
        errors.push(`Topic "${t.title || i}" has invalid start/end timestamps`);
      }
    }
  }

  // Transcript validation
  if (!raw.transcript || !Array.isArray(raw.transcript.segments)) {
    errors.push('"transcript.segments" must be an array');
  }

  // Collections validation (defaults to empty arrays if omitted)
  const normalized: RecordedClassStudyNotes = {
    lecture: {
      title: String(raw.lecture?.title || 'NEET Lecture'),
      language: String(raw.lecture?.language || 'English'),
      durationSeconds: Number(raw.lecture?.durationSeconds) || 0,
      overview: String(raw.lecture?.overview || ''),
      learningObjectives: Array.isArray(raw.lecture?.learningObjectives)
        ? raw.lecture.learningObjectives.map(String)
        : [],
    },
    transcript: {
      segments: Array.isArray(raw.transcript?.segments)
        ? raw.transcript.segments.map((s: any) => ({
            startSeconds: Number(s.startSeconds) || 0,
            endSeconds: Number(s.endSeconds) || 0,
            timestampLabel: String(s.timestampLabel || `${s.startSeconds ?? 0}s`),
            speaker: s.speaker ? String(s.speaker) : undefined,
            text: String(s.text || ''),
            topicReference: s.topicReference ? String(s.topicReference) : null,
          }))
        : [],
    },
    topics: Array.isArray(raw.topics)
      ? raw.topics.map((t: any) => ({
          title: String(t.title || 'Untitled Topic'),
          startSeconds: Number(t.startSeconds) || 0,
          endSeconds: Number(t.endSeconds) || 0,
          timestampLabel: String(t.timestampLabel || `${t.startSeconds ?? 0}s`),
          explanation: String(t.explanation || ''),
          subtopics: Array.isArray(t.subtopics) ? t.subtopics.map(String) : [],
          definitions: Array.isArray(t.definitions) ? t.definitions : [],
          concepts: Array.isArray(t.concepts) ? t.concepts : [],
          formulas: Array.isArray(t.formulas) ? t.formulas : [],
          examples: Array.isArray(t.examples) ? t.examples : [],
          neetExamPoints: Array.isArray(t.neetExamPoints) ? t.neetExamPoints : [],
          confidence: typeof t.confidence === 'number' ? Math.max(0, Math.min(1, t.confidence)) : 0.9,
        }))
      : [],
    definitions: Array.isArray(raw.definitions) ? raw.definitions : [],
    formulaCheatSheet: Array.isArray(raw.formulaCheatSheet) ? raw.formulaCheatSheet : [],
    importantConcepts: Array.isArray(raw.importantConcepts) ? raw.importantConcepts : [],
    workedExamples: Array.isArray(raw.workedExamples) ? raw.workedExamples : [],
    neetExamPoints: Array.isArray(raw.neetExamPoints) ? raw.neetExamPoints : [],
    lectureConclusion: {
      summary: String(raw.lectureConclusion?.summary || ''),
      revisionChecklist: Array.isArray(raw.lectureConclusion?.revisionChecklist)
        ? raw.lectureConclusion.revisionChecklist.map(String)
        : [],
      homework: Array.isArray(raw.lectureConclusion?.homework)
        ? raw.lectureConclusion.homework.map(String)
        : [],
    },
    quality: {
      completenessScore: Number(raw.quality?.completenessScore) || 90,
      uncertainSections: Array.isArray(raw.quality?.uncertainSections)
        ? raw.quality.uncertainSections.map(String)
        : [],
      warnings: Array.isArray(raw.quality?.warnings)
        ? raw.quality.warnings.map(String)
        : [],
    },
    metadata: {
      provider: String(raw.metadata?.provider || 'GEMINI'),
      model: String(raw.metadata?.model || 'gemini-2.5-flash'),
      analyzedAt: raw.metadata?.analyzedAt || new Date().toISOString(),
      courseName: raw.metadata?.courseName ?? null,
      subjectName: raw.metadata?.subjectName ?? null,
      chapterName: raw.metadata?.chapterName ?? null,
      topicName: raw.metadata?.topicName ?? null,
      batchName: raw.metadata?.batchName ?? null,
      tutorName: raw.metadata?.tutorName ?? null,
    },
  };

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? normalized : undefined,
  };
}

// ─── Phase 3 Content Review, Approval & Publishing Types ───────────────────

export type ContentLifecycleState =
  | 'AI_GENERATED'
  | 'DRAFT'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'UNPUBLISHED';

export interface ContentVersionSnapshot {
  version: number;
  state: ContentLifecycleState;
  notes: RecordedClassStudyNotes;
  createdAt: string;
  createdBy: string;
  changeSummary?: string | null;
}

export interface ContentLifecycleMetadata {
  state: ContentLifecycleState;
  currentVersion: number;
  approvedVersion?: number | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  publishedVersion?: number | null;
  publishedAt?: string | null;
  publishedBy?: string | null;
  unpublishedAt?: string | null;
  unpublishedBy?: string | null;
  topicItemId?: string | null;
}

export interface ContentAuditLogEntry {
  action:
    | 'AI_GENERATED'
    | 'DRAFT_SAVED'
    | 'CONTENT_APPROVED'
    | 'CONTENT_PUBLISHED'
    | 'CONTENT_UNPUBLISHED';
  actorId: string;
  actorRole: string;
  timestamp: string;
  version: number;
  details?: string | null;
}


