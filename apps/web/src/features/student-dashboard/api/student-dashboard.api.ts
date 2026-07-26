import { api } from '@/lib/api';
import type {
  StudentOverviewResponseDto,
  StudentTimetableResponseDto,
  JoinSessionResponseDto,
  StudentBatchesResponseDto,
  StudentAttendanceResponseDto,
  StudentCoursesResponseDto,
} from '@/features/student-dashboard/types/student-dashboard.types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const studentDashboardKeys = {
  all: ['student-dashboard'] as const,
  overview: () => [...studentDashboardKeys.all, 'overview'] as const,
  timetable: (dateFrom?: string, dateTo?: string) =>
    [...studentDashboardKeys.all, 'timetable', dateFrom, dateTo] as const,
  batches: () => [...studentDashboardKeys.all, 'batches'] as const,
  attendance: () => [...studentDashboardKeys.all, 'attendance'] as const,
  courses: () => [...studentDashboardKeys.all, 'courses'] as const,
  joinSession: (sessionId: string) => [...studentDashboardKeys.all, 'join', sessionId] as const,
};

// ─── API Service ──────────────────────────────────────────────────────────────

export const studentDashboardApi = {
  getOverview(): Promise<StudentOverviewResponseDto> {
    return api.get<StudentOverviewResponseDto>('/student-dashboard/overview');
  },

  getTimetable(dateFrom?: string, dateTo?: string): Promise<StudentTimetableResponseDto> {
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    const qs = params.toString();
    return api.get<StudentTimetableResponseDto>(
      `/student-dashboard/timetable${qs ? `?${qs}` : ''}`,
    );
  },

  joinSession(sessionId: string): Promise<JoinSessionResponseDto> {
    return api.get<JoinSessionResponseDto>(`/student-dashboard/sessions/${sessionId}/join`);
  },

  getBatches(): Promise<StudentBatchesResponseDto> {
    return api.get<StudentBatchesResponseDto>('/student-dashboard/batches');
  },

  getAttendance(): Promise<StudentAttendanceResponseDto> {
    return api.get<StudentAttendanceResponseDto>('/student-dashboard/attendance');
  },

  getCourses(): Promise<StudentCoursesResponseDto> {
    return api.get<StudentCoursesResponseDto>('/student-dashboard/courses');
  },
};
