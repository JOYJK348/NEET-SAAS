import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { timetableService, timetableKeys } from '@/features/tutor-dashboard/services/timetable-service';
import type { TutorTimetableResponseDto } from '@/features/tutor-dashboard/types/timetable';

export interface UseTutorTimetableReturn {
  timetable: TutorTimetableResponseDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTutorTimetable(
  dateFrom?: string,
  dateTo?: string,
): UseTutorTimetableReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: timetableKeys.week(dateFrom, dateTo),
    queryFn: () => timetableService.getTimetable(dateFrom, dateTo),
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
    timetable: data ?? null,
    isLoading: isPending,
    error: error ?? null,
    refetch,
  };
}

