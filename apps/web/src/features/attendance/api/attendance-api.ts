import { api } from '@/lib/api';
import type {
  OverviewResponseDto,
  BatchAttendanceDetailDto,
  StudentAttendanceDetailDto,
} from '@/features/attendance/types';

export const attendanceApi = {
  getOverview: () => api.get<OverviewResponseDto>('/attendance/admin/overview'),
  getBatchDetail: (batchId: string) =>
    api.get<BatchAttendanceDetailDto>(`/attendance/admin/batches/${batchId}`),
  getStudentDetail: (studentAdmissionId: string) =>
    api.get<StudentAttendanceDetailDto>(`/attendance/admin/students/${studentAdmissionId}`),
};
