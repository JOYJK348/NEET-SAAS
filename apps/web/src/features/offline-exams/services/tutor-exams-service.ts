import { api } from '@/lib/api';
import type {
  EvaluateSubmissionPayload,
  TutorExamItem,
  TutorSubmissionDetailResponse,
  TutorSubmissionsBucketsResponse,
} from '../types/tutor-exams';

export const tutorExamsService = {
  getMyAssignedExams(): Promise<TutorExamItem[]> {
    return api.get('/tutor/exams');
  },

  getExamSubmissionsBuckets(examId: string): Promise<TutorSubmissionsBucketsResponse> {
    return api.get(`/tutor/exams/${examId}/submissions`);
  },

  getSubmissionDetail(
    examId: string,
    submissionId: string,
  ): Promise<TutorSubmissionDetailResponse> {
    return api.get(`/tutor/exams/${examId}/submissions/${submissionId}`);
  },

  evaluateSubmission(
    examId: string,
    submissionId: string,
    data: EvaluateSubmissionPayload,
  ): Promise<any> {
    return api.post(`/tutor/exams/${examId}/submissions/${submissionId}/evaluate`, data);
  },
};
