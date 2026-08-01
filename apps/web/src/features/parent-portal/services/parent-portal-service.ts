import { api } from '@/lib/api';
import type {
  LinkedStudent,
  ParentOverviewData,
  ParentAcademicsData,
  ParentExamsData,
  ParentExamResultData,
  ParentAttendanceData,
  ParentFeesData,
  ParentNotificationItem,
  ParentProfileData,
} from '../types/parent-portal';

export const parentPortalService = {
  async getLinkedStudents(): Promise<LinkedStudent[]> {
    const res = await api.get<any>('/parent-dashboard/students');
    return res?.data || res || [];
  },

  async getOverview(studentId: string): Promise<ParentOverviewData> {
    const res = await api.get<any>(`/parent-dashboard/students/${studentId}/overview`);
    return res?.data || res;
  },

  async getAcademics(studentId: string): Promise<ParentAcademicsData> {
    const res = await api.get<any>(`/parent-dashboard/students/${studentId}/academics`);
    return res?.data || res;
  },

  async getExams(studentId: string): Promise<ParentExamsData> {
    const res = await api.get<any>(`/parent-dashboard/students/${studentId}/exams`);
    return res?.data || res;
  },

  async getExamResult(studentId: string, examId: string): Promise<ParentExamResultData> {
    const res = await api.get<any>(
      `/parent-dashboard/students/${studentId}/exams/${examId}/result`,
    );
    return res?.data || res;
  },

  async getAttendance(studentId: string): Promise<ParentAttendanceData> {
    const res = await api.get<any>(`/parent-dashboard/students/${studentId}/attendance`);
    return res?.data || res;
  },

  async getFees(studentId: string): Promise<ParentFeesData> {
    const res = await api.get<any>(`/parent-dashboard/students/${studentId}/fees`);
    return res?.data || res;
  },

  async getNotifications(studentId: string): Promise<ParentNotificationItem[]> {
    const res = await api.get<any>(`/parent-dashboard/students/${studentId}/notifications`);
    return res?.data || res || [];
  },

  async getProfile(): Promise<ParentProfileData> {
    const res = await api.get<any>('/parent-dashboard/profile');
    return res?.data || res;
  },
};
