export type ExamPublishStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'LOCKED'
  | 'UNDER_REVIEW'
  | 'ADMIN_REVIEW'
  | 'RESULT_PUBLISHED'
  | 'ARCHIVED'
  | 'CANCELLED';

export type DerivedExamState = ExamPublishStatus | 'LIVE';

export interface SectionConfigItem {
  id?: string;
  sectionId?: string;
  name: string;
  maxMarks: number;
}

export interface ExamItem {
  id: string;
  tenantId: string;
  courseId: string;
  batchId: string;
  subjectId: string;
  academicYearId: string;
  title: string;
  description: string;
  examType: string;
  mode: string;
  totalMarks: number;
  passingMarks: number;
  negativeMarkingEnabled: boolean;
  negativeMarkingValue: number;
  durationMinutes: number;
  graceMinutes: number;
  scheduledStartAt: string;
  scheduledEndAt: string;
  examWindowStart: string;
  examWindowEnd: string;
  requireFullDurationWindow: boolean;
  allowLateUpload: boolean;
  allowReplaceUpload: boolean;
  sectionConfig: SectionConfigItem[];
  questionPaperFileId?: string | null;
  answerKeyFileId?: string | null;
  omrTemplateFileId?: string | null;
  publishStatus: ExamPublishStatus;
  isSubmissionLocked: boolean;
  isClosed: boolean;
  closedAt?: string | null;
  evaluationLockedAt?: string | null;
  evaluationLockedBy?: string | null;
  resultsPublishedAt?: string | null;
  resultsPublishedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  questionPaperSignedUrl?: string | null;
  answerKeySignedUrl?: string | null;
}

export interface CreateExamPayload {
  courseId: string;
  batchId: string;
  subjectId: string;
  academicYearId: string;
  title: string;
  description?: string;
  examType: string;
  mode: string;
  totalMarks: number;
  passingMarks: number;
  negativeMarkingEnabled?: boolean;
  negativeMarkingValue?: number;
  durationMinutes: number;
  graceMinutes?: number;
  scheduledStartAt: string;
  scheduledEndAt: string;
  examWindowStart: string;
  examWindowEnd: string;
  requireFullDurationWindow?: boolean;
  allowLateUpload?: boolean;
  allowReplaceUpload?: boolean;
  sectionConfig?: SectionConfigItem[];
  instructions?: string;
}

export interface ReviewSubmissionListItem {
  id: string;
  studentAdmissionId: string;
  studentName: string;
  status: string;
  evaluationStatus: string;
  evaluationApproved: boolean;
  obtainedMarks: number;
  evaluatedByUserId?: string | null;
  evaluatedByName?: string | null;
  evaluatedAt?: string | null;
  rejectionReason?: string | null;
  submittedAt?: string | null;
}

export interface ReviewSummaryResponse {
  examId: string;
  title: string;
  publishStatus: ExamPublishStatus;
  isClosed: boolean;
  evaluationLockedAt?: string | null;
  evaluationLockedBy?: string | null;
  resultsPublishedAt?: string | null;
  stats: {
    totalSubmissions: number;
    submittedCount: number;
    absentCount: number;
    evaluatedCount: number;
    pendingEvaluationCount: number;
    approvedCount: number;
    unapprovedCount: number;
    returnedCount: number;
    averageMarks: number;
    highestMarks: number;
    lowestMarks: number;
  };
  submissions?: ReviewSubmissionListItem[];
}

export interface LiveDashboardResponse {
  examId: string;
  title: string;
  currentExamState: DerivedExamState;
  windowRemainingSeconds: number;
  liveMetrics: {
    totalStudents: number;
    startedCount: number;
    neverStartedCount: number;
    activeCount: number;
    disconnectedCount: number;
    graceRunningCount: number;
    submittedCount: number;
    lateSubmittedCount: number;
    absentCount: number;
    uploadInProgressCount: number;
  };
}

export interface PostPublishAnalyticsResponse {
  examId: string;
  title: string;
  totalMarks: number;
  passingMarks: number;
  isResultsPublished: boolean;
  overallStats: {
    totalEnrolled: number;
    totalSubmissions: number;
    submittedCount: number;
    lateCount: number;
    absentCount: number;
    evaluatedCount: number;
    passCount: number;
    failCount: number;
    attendancePercent: number;
    submissionPercent: number;
    passPercent: number;
    failPercent: number;
    absentPercent: number;
    latePercent: number;
  };
  marksAnalytics: {
    highest: number;
    lowest: number;
    average: number;
    median: number;
  };
}

export interface SectionAnalyticsResponse {
  examId: string;
  title: string;
  sectionAnalytics: Array<{
    sectionName: string;
    maxMarks: number;
    averageMarks: number;
    evaluatedCount: number;
  }>;
}

export interface RankedStudentItem {
  submissionId: string;
  studentAdmissionId: string;
  studentName: string;
  email: string;
  obtainedMarks: number;
  rank?: number | null;
  percentile?: number | null;
}

export interface PublishChecklistResponse {
  canPublish: boolean;
  items: Array<{
    key: string;
    label: string;
    passed: boolean;
  }>;
}
