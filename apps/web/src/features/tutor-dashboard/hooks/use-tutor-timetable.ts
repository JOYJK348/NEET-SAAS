import { useQuery } from '@tanstack/react-query';
import { timetableService, timetableKeys } from '@/features/tutor-dashboard/services/timetable-service';
import type { TutorTimetableResponseDto } from '@/features/tutor-dashboard/types/timetable';

const STALE_TIME = 0;
const GC_TIME = 5 * 60 * 1000;

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
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
  });

  return {
    timetable: data ?? null,
    isLoading: isPending,
    error: error ?? null,
    refetch,
  };
}

