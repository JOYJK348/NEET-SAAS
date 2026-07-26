import { useQuery } from '@tanstack/react-query';
import { studentDashboardApi, studentDashboardKeys } from '../api/student-dashboard.api';
import type { StudentOverviewResponseDto } from '../types/student-dashboard.types';

const STALE_TIME = 30 * 1000; // 30s — live status changes frequently
const GC_TIME = 5 * 60 * 1000;

export interface UseStudentOverviewReturn {
  overview: StudentOverviewResponseDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStudentOverview(): UseStudentOverviewReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: studentDashboardKeys.overview(),
    queryFn: () => studentDashboardApi.getOverview(),
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
