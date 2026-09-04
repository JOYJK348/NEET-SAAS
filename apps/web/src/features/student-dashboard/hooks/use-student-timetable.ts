import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { studentDashboardApi, studentDashboardKeys } from '../api/student-dashboard.api';
import type {
  StudentTimetableResponseDto,
  JoinSessionResponseDto,
} from '../types/student-dashboard.types';

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
