import { api } from '@/lib/api';
import type {
  StartExamResponse,
  StudentExamDetailResponse,
  StudentExamItem,
  StudentResultResponse,
} from '../types/student-exams';

export const studentExamsService = {
  getMyExams(): Promise<StudentExamItem[]> {
    return api.get('/student/exams');
  },

  getExamDetail(id: string): Promise<StudentExamDetailResponse> {
    return api.get(`/student/exams/${id}`);
  },

  startExam(id: string): Promise<StartExamResponse> {
    return api.post(`/student/exams/${id}/start`);
  },

  getQuestionPaperUrl(id: string): Promise<{ questionPaperSignedUrl: string }> {
    return api.get(`/student/exams/${id}/question-paper`);
  },

  heartbeat(id: string): Promise<{ success: boolean; lastSeenAt: string }> {
    return api.patch(`/student/exams/${id}/heartbeat`);
  },

  uploadAnswerSheet(id: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/student/exams/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getResult(id: string): Promise<StudentResultResponse> {
    return api.get(`/student/exams/${id}/result`);
  },
};
