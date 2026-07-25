import { useQuery } from '@tanstack/react-query';
import { overviewService, overviewKeys } from '@/features/tutor-dashboard/services/overview-service';
import type { TutorOverviewResponseDto } from '@/features/tutor-dashboard/types/overview';

const STALE_TIME = 0;
const GC_TIME = 5 * 60 * 1000;

export interface UseTutorOverviewReturn {
  overview: TutorOverviewResponseDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTutorOverview(): UseTutorOverviewReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: overviewKeys.detail(),
    queryFn: () => overviewService.getOverview(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
  });

  return {
    overview: data ?? null,
    isLoading: isPending,
    error: error ?? null,
    refetch,
  };
}

