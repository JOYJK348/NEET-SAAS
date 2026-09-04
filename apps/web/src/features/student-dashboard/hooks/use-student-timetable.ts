import { useQuery, useMutation } from '@tanstack/react-query';
import { studentDashboardApi, studentDashboardKeys } from '../api/student-dashboard.api';
import type {
  StudentTimetableResponseDto,
  JoinSessionResponseDto,
} from '../types/student-dashboard.types';

const STALE_TIME = 5 * 60 * 1000; // 5 min cache for instant 0ms navigation
const GC_TIME = 30 * 60 * 1000;

export interface UseStudentTimetableReturn {
  timetable: StudentTimetableResponseDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStudentTimetable(dateFrom?: string, dateTo?: string): UseStudentTimetableReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: studentDashboardKeys.timetable(dateFrom, dateTo),
    queryFn: () => studentDashboardApi.getTimetable(dateFrom, dateTo),
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

// ─── Join Session (mutation — opens URL on success) ──────────────────────────

export interface UseJoinSessionReturn {
  join: (sessionId: string) => Promise<JoinSessionResponseDto>;
  isJoining: boolean;
  error: Error | null;
}

export function useJoinSession(): UseJoinSessionReturn {
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (sessionId: string) => studentDashboardApi.joinSession(sessionId),
    onSuccess: (data) => {
      // Open meeting URL in new tab
      window.open(data.joinUrl, '_blank', 'noopener,noreferrer');
    },
  });

  return {
    join: mutateAsync,
    isJoining: isPending,
    error: error ?? null,
  };
}
