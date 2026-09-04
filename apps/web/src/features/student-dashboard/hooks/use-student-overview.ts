import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentDashboardApi, studentDashboardKeys } from '../api/student-dashboard.api';
import type { StudentOverviewResponseDto } from '../types/student-dashboard.types';

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
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 2000,
    retry: 2,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSync = () => {
      refetch();
    };

    window.addEventListener('schedule-updated', handleSync);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('neet-platform-schedule-sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'SCHEDULE_UPDATED') {
          handleSync();
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('schedule-updated', handleSync);
      if (bc) bc.close();
    };
  }, [refetch]);

  return {
    overview: data ?? null,
    isLoading: isPending,
    error: error ?? null,
    refetch,
  };
}
