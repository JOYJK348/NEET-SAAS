export type StudentExamStatus =
  'UPCOMING' | 'LIVE' | 'SUBMITTED' | 'LATE' | 'ABSENT' | 'UNDER_EVALUATION' | 'RESULT_PUBLISHED';

export interface StudentSubmissionFileItem {
  id: string;
  fileUploadId: string;
  fileType: 'CURRENT' | 'OLD' | 'REPLACED';
  uploadedAt: string;
}

export interface StudentTimelineItem {
  id: string;
  event: string;
  metadata?: any;
  createdAt: string;
}

export interface StudentExamItem {
  id: string;
  title: string;
  description?: string;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  graceMinutes: number;
  examWindowStart: string;
  examWindowEnd: string;
  studentExamStatus: string;
  canStart: boolean;
  remainingSeconds: number;
  isSubmissionLocked: boolean;
  submission?: {
    id: string;
    status: string;
    startedAt?: string | null;
    submittedAt?: string | null;
    obtainedMarks?: number;
  } | null;
}

export interface StudentExamDetailResponse extends StudentExamItem {
  questionPaperSignedUrl?: string | null;
  answerSheetSignedUrl?: string | null;
  allowReplaceUpload: boolean;
  allowLateUpload: boolean;
  submission?: {
    id: string;
    status: string;
    startedAt?: string | null;
    calculatedEndAt?: string | null;
    graceEndAt?: string | null;
    submittedAt?: string | null;
    obtainedMarks?: number;
    answerSheetFileId?: string | null;
    submissionFiles?: StudentSubmissionFileItem[];
    timeline?: StudentTimelineItem[];
  } | null;
}

export interface StartExamResponse {
  submissionId: string;
  startedAt: string;
  calculatedEndAt: string;
  graceEndAt: string;
}

export interface StudentResultResponse {
  examId: string;
  examTitle: string;
  totalMarks: number;
  passingMarks: number;
  obtainedMarks: number;
  rank?: number | null;
  percentile?: number | null;
  status: string;
  evaluationStatus: string;
  tutorNotes?: string | null;
  marksBreakdown?: Array<{
    sectionId?: string;
    sectionName?: string;
    obtainedMarks: number;
    maxMarks?: number;
  }> | null;
  submittedAt?: string | null;
  evaluatedAt?: string | null;
  isPassed: boolean;
}
