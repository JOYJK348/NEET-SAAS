import { api } from '@/lib/api';
import type { TutorTimetableResponseDto } from '@/features/tutor-dashboard/types/timetable';

/**
 * Fetches the tutor's weekly timetable.
 *
 * Backend resolves the authenticated tutor from the JWT (user.sub → StaffProfile).
 * No staffProfileId is passed from the frontend.
 * Defaults to current week if dateFrom/dateTo not provided.
 *
 * GET /tutor-dashboard/timetable?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
 * Returns: TutorTimetableResponseDto
 */
export const timetableService = {
  getTimetable(dateFrom?: string, dateTo?: string): Promise<TutorTimetableResponseDto> {
    const params: Record<string, string> = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return api.get<TutorTimetableResponseDto>('/tutor-dashboard/timetable', { params });
  },
};

export const timetableKeys = {
  all: ['tutor-timetable'] as const,
  week: (dateFrom?: string, dateTo?: string) =>
    [...timetableKeys.all, 'week', dateFrom ?? 'default', dateTo ?? 'default'] as const,
};

