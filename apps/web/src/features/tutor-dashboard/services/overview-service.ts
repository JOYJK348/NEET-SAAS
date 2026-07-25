import { api } from '@/lib/api';
import type { TutorOverviewResponseDto } from '@/features/tutor-dashboard/types/overview';

/**
 * Fetches the tutor dashboard overview.
 *
 * Backend resolves the authenticated tutor from the JWT (user.sub → StaffProfile).
 * No userId or staffProfileId is passed from the frontend.
 *
 * GET /tutor-dashboard/overview
 * Returns: TutorOverviewResponseDto
 */
export const overviewService = {
  getOverview(): Promise<TutorOverviewResponseDto> {
    return api.get<TutorOverviewResponseDto>('/tutor-dashboard/overview');
  },
};

export const overviewKeys = {
  all: ['tutor-overview'] as const,
  detail: () => [...overviewKeys.all, 'detail'] as const,
};

