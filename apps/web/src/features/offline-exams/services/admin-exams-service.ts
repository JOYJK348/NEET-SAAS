import { api } from '@/lib/api';
import type {
  CreateExamPayload,
  ExamItem,
  LiveDashboardResponse,
  PostPublishAnalyticsResponse,
  PublishChecklistResponse,
  RankedStudentItem,
  ReviewSummaryResponse,
  SectionAnalyticsResponse,
} from '../types/admin-exams';

export const adminExamsService = {
  getExams(params?: Record<string, any>): Promise<{ data: ExamItem[]; meta: any }> {
    return api.get('/admin/exams', { params });
  },

  getExamById(id: string): Promise<ExamItem> {
    return api.get(`/admin/exams/${id}`);
  },

  createExam(data: CreateExamPayload): Promise<ExamItem> {
    return api.post('/admin/exams', data);
  },

  updateExam(id: string, data: Partial<CreateExamPayload>): Promise<ExamItem> {
    return api.patch(`/admin/exams/${id}`, data);
  },

  uploadQuestionPaper(id: string, file: File): Promise<{ message: string; exam: ExamItem }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/exams/${id}/question-paper`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadAnswerKey(id: string, file: File): Promise<{ message: string; exam: ExamItem }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/exams/${id}/answer-key`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  publishExam(id: string): Promise<ExamItem> {
    return api.post(`/admin/exams/${id}/publish`);
  },

  closeExam(id: string): Promise<{ success: boolean; closed: boolean }> {
    return api.post(`/admin/exams/${id}/close`);
  },

  lockSubmissions(id: string): Promise<{ success: boolean }> {
    return api.post(`/admin/exams/${id}/lock-submissions`);
  },

  getExamStats(id: string): Promise<any> {
    return api.get(`/admin/exams/${id}/stats`);
  },

  getReviewSummary(id: string): Promise<ReviewSummaryResponse> {
    return api.get(`/admin/exams/${id}/review`);
  },

  approveSubmission(id: string, submissionId: string): Promise<any> {
    return api.post(`/admin/exams/${id}/submissions/${submissionId}/approve`);
  },

  rejectSubmission(id: string, submissionId: string, reason: string): Promise<any> {
    return api.post(`/admin/exams/${id}/submissions/${submissionId}/reject`, { reason });
  },

  approveAll(id: string): Promise<{ approvedCount: number; exam: ExamItem }> {
    return api.post(`/admin/exams/${id}/submissions/approve-all`);
  },

  getPublishChecklist(id: string): Promise<PublishChecklistResponse> {
    return api.get(`/admin/exams/${id}/publish-checklist`);
  },

  publishResults(id: string): Promise<ExamItem> {
    return api.post(`/admin/exams/${id}/publish-results`);
  },

  getLiveDashboard(id: string): Promise<LiveDashboardResponse> {
    return api.get(`/admin/exams/${id}/live-dashboard`);
  },

  getPostPublishAnalytics(id: string): Promise<PostPublishAnalyticsResponse> {
    return api.get(`/admin/exams/${id}/analytics`);
  },

  getSectionAnalytics(id: string): Promise<SectionAnalyticsResponse> {
    return api.get(`/admin/exams/${id}/section-analytics`);
  },

  getTopStudents(id: string, limit: number = 10): Promise<RankedStudentItem[]> {
    return api.get(`/admin/exams/${id}/top-students`, { params: { limit } });
  },

  getBottomStudents(id: string, limit: number = 10): Promise<RankedStudentItem[]> {
    return api.get(`/admin/exams/${id}/bottom-students`, { params: { limit } });
  },
};
