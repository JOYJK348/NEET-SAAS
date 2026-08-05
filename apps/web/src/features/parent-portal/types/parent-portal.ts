export interface LinkedStudent {
  id: string;
  name: string;
  email: string;
  studentCode: string;
  admissionNumber: string;
  courseName: string;
  batchName: string;
  relationship: string;
  isPrimary: boolean;
}

export interface ParentOverviewData {
  studentInfo: {
    id: string;
    name: string;
    admissionNumber: string;
    course: string;
    batch: string;
    centre: string;
    photoUrl?: string | null;
  };
  academicSummary: {
    overallAttendance: string;
    completedExams: number;
    upcomingExamsCount: number;
    averageMarks: string;
    currentRank: number;
  };
  nextExam?: {
    id: string;
    title: string;
    date: string | Date;
    time: string;
    duration: string;
  } | null;
  recentNotifications: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string | Date;
  }>;
}

export interface ParentAcademicsData {
  academicSummary?: {
    overallAttendance: string;
    completedExams: number;
    averageMarks: string;
    currentRank: number;
  };
  enrolledCourses: Array<{
    id: string;
    name: string;
    code?: string;
  }>;
  enrolledBatches: Array<{
    id: string;
    name: string;
    code?: string;
    branchName?: string;
  }>;
  subjects?: Array<{
    subject: string;
    scorePercentage: number;
  }>;
  examHistory: Array<{
    id: string;
    examId: string;
    examTitle: string;
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    rank: number;
    evaluatedAt?: string | Date;
    subjectBreakdown: Array<{
      subject: string;
      obtained: number;
      total: number;
      percentage: number;
    }>;
  }>;
  recentNotifications?: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string | Date;
  }>;
  tutorRemarks: string;
}

export interface CompletedExamItem {
  id: string;
  resultId: string;
  title: string;
  totalScore: number;
  totalPossible: number;
  rank: number;
  percentage: number;
  evaluatedAt?: string | Date;
  tutorNotes?: string;
  subjectBreakdown?: Array<{
    subject: string;
    obtained: number;
    total: number;
    percentage: number;
  }>;
}

export interface ParentExamsData {
  upcoming: Array<{
    id: string;
    title: string;
    startDate: string | Date;
    durationMins?: number;
    status: string;
  }>;
  completed: CompletedExamItem[];
  tutorRemarks?: string;
}

export interface ParentExamResultData {
  examTitle: string;
  date: string | Date;
  totalMarksObtained: number;
  totalMarksPossible: number;
  rank: number;
  centreRank: number;
  percentile: number;
  passStatus: string;
  subjectBreakdown: Array<{
    subject: string;
    obtained: number;
    total: number;
  }>;
  tutorNotes?: string;
}

export interface ParentAttendanceData {
  overallAttendance: string;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  batchBreakdown?: Array<{
    batchId: string;
    batchName: string;
    totalClasses: number;
    presentClasses: number;
    percentage: number;
  }>;
  subjectBreakdown?: Array<{
    subjectId?: string;
    subject: string;
    totalClasses: number;
    presentClasses: number;
    percentage: number;
    status: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION';
  }>;
  monthlyBreakdown: Array<{
    month: string;
    percentage: number;
  }>;
  recentRecords: Array<{
    id: string;
    date: string | Date;
    status: string;
    subject?: string;
    batchId?: string;
    batchName?: string;
    remarks?: string;
  }>;
}

export interface ParentFeesData {
  totalFees: number;
  paidFees: number;
  pendingFees: number;
  dueDate: string;
  transactions: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
    method: string;
  }>;
}

export interface ParentNotificationItem {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string | Date;
}

export interface ParentProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  occupation: string;
  educationLevel: string;
  createdAt: string | Date;
}
