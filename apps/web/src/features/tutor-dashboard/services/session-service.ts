import { api } from '@/lib/api';
import type { SessionDetailsResponseDto } from '@/features/tutor-dashboard/types/session-details';

/**
 * Fetches detailed session info including attendance.
 * Backend verifies the authenticated tutor owns this session.
 * GET /tutor-dashboard/sessions/:sessionId
 */

export interface BulkAttendanceItem {
  studentAdmissionId: string;
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'EXCUSED';
  lateMinutes?: number;
  remarks?: string;
}

export interface BulkAttendanceRequest {
  records: BulkAttendanceItem[];
}

export interface BulkAttendanceResponse {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors?: string[];
}

export const sessionService = {
  getSessionDetails(sessionId: string): Promise<SessionDetailsResponseDto> {
    return api.get<SessionDetailsResponseDto>(`/tutor-dashboard/sessions/${sessionId}`);
  },

  /**
   * Bulk mark attendance for a session.
   * Backend verifies tutor owns the session and all student admissions belong to the batch.
   * POST /tutor-dashboard/sessions/:sessionId/attendance/bulk
   */
  markAttendance(sessionId: string, data: BulkAttendanceRequest): Promise<BulkAttendanceResponse> {
    return api.post<BulkAttendanceResponse>(
      `/tutor-dashboard/sessions/${sessionId}/attendance/bulk`,
      data,
    );
  },

  joinSession(
    sessionId: string,
  ): Promise<{ sessionId: string; joinUrl: string; provider: string }> {
    return api.post<{ sessionId: string; joinUrl: string; provider: string }>(
      `/tutor-dashboard/sessions/${sessionId}/join`,
      {},
    );
  },
};

export const sessionKeys = {
  all: ['tutor-session'] as const,
  detail: (sessionId: string) => [...sessionKeys.all, 'detail', sessionId] as const,
};
