import type { SectionConfigItem } from './admin-exams';

export interface TutorExamItem {
  id: string;
  title: string;
  batchId: string;
  subjectId: string;
  totalMarks: number;
  mode?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  publishStatus: string;
  isClosed: boolean;
  isResultsPublished: boolean;
  isEvaluationLocked: boolean;
  answerKeyFileId?: string | null;
  answerKeySignedUrl?: string | null;
  pendingEvaluations: number;
  completedEvaluations: number;
  returnedEvaluations: number;
}

export interface TutorSubmissionListItem {
  id: string;
  studentAdmissionId: string;
  studentName: string;
  status: string;
  evaluationStatus: string;
  evaluationApproved: boolean;
  evaluationVersion: number;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  obtainedMarks: number;
  isResultsPublished: boolean;
}

export interface TutorSubmissionsBucketsResponse {
  examId: string;
  title: string;
  mode?: string;
  sectionConfig: SectionConfigItem[];
  isEvaluationLocked: boolean;
  answerKeyFileId?: string | null;
  answerKeySignedUrl?: string | null;
  totalCount: number;
  todaysPending: TutorSubmissionListItem[];
  overdue: TutorSubmissionListItem[];
  completed: TutorSubmissionListItem[];
  returned: TutorSubmissionListItem[];
  absent: TutorSubmissionListItem[];
}

export interface EvaluationAuditHistoryItem {
  id: string;
  editedByUserId: string;
  editedAt: string;
  oldMarks: number;
  newMarks: number;
  oldBreakdown?: any;
  newBreakdown?: any;
  reason?: string | null;
}

export interface SectionMarksBreakdownInput {
  sectionId?: string;
  sectionName: string;
  obtainedMarks: number;
  maxMarks: number;
}

export interface CbtQuestionBreakdownItem {
  questionIndex: number;
  questionId: string;
  questionText: string;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
  marksAwarded: number;
  marks: number;
  negativeMarks: number;
  options?: { label: string; text: string; isCorrect: boolean }[];
  explanation?: { solutionText?: string; shortExplanation?: string } | null;
}

export interface CbtSubmissionStats {
  correct: number;
  wrong: number;
  skipped: number;
  percentage: number;
  passFail: boolean;
  grade?: string;
}

export interface TutorSubmissionDetailResponse {
  id: string;
  examId: string;
  examTitle: string;
  examMode?: string;
  totalMarks: number;
  passingMarks: number;
  sectionConfig: SectionConfigItem[];
  studentAdmissionId: string;
  studentName: string;
  studentEmail: string;
  status: string;
  evaluationStatus: string;
  evaluationApproved: boolean;
  evaluationVersion: number;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  evaluationStartedAt?: string | null;
  evaluationCompletedAt?: string | null;
  obtainedMarks: number;
  marksBreakdown?: SectionMarksBreakdownInput[] | null;
  tutorNotes?: string | null;
  cbtStats?: CbtSubmissionStats | null;
  cbtBreakdown?: CbtQuestionBreakdownItem[] | null;
  isResultsPublished: boolean;
  isEvaluationLocked: boolean;
  answerSheetSignedUrl?: string | null;
  answerKeySignedUrl?: string | null;
  history: EvaluationAuditHistoryItem[];
  timeline: Array<{
    id: string;
    event: string;
    createdAt: string;
    metadata?: any;
  }>;
}

export interface EvaluateSubmissionPayload {
  obtainedMarks: number;
  marksBreakdown?: SectionMarksBreakdownInput[];
  tutorNotes?: string;
  reason?: string;
}
