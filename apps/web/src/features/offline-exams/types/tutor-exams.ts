import type { SectionConfigItem } from './admin-exams';

export interface TutorExamItem {
  id: string;
  title: string;
  batchId: string;
  subjectId: string;
  totalMarks: number;
  scheduledStartAt: string;
  scheduledEndAt: string;
  publishStatus: string;
  isClosed: boolean;
  isResultsPublished: boolean;
  isEvaluationLocked: boolean;
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
  sectionConfig: SectionConfigItem[];
  isEvaluationLocked: boolean;
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

export interface TutorSubmissionDetailResponse {
  id: string;
  examId: string;
  examTitle: string;
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
  isResultsPublished: boolean;
  isEvaluationLocked: boolean;
  answerSheetSignedUrl?: string | null;
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
