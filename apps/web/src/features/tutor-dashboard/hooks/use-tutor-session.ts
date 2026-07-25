import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService, sessionKeys } from '@/features/tutor-dashboard/services/session-service';
import type { SessionDetailsResponseDto } from '@/features/tutor-dashboard/types/session-details';
import type { BulkAttendanceRequest, BulkAttendanceResponse } from '@/features/tutor-dashboard/services/session-service';

const STALE_TIME = 15 * 1000; // 15 seconds — session data changes frequently with attendance marking
const GC_TIME = 5 * 60 * 1000;

export interface UseTutorSessionReturn {
  sessionDetails: SessionDetailsResponseDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  markAttendance: (data: BulkAttendanceRequest) => Promise<BulkAttendanceResponse>;
  isMarking: boolean;
  markError: Error | null;
  markResult: BulkAttendanceResponse | null;
}

export function useTutorSession(sessionId: string | null): UseTutorSessionReturn {
  const queryClient = useQueryClient();

  const { data, isPending, error, refetch } = useQuery({
    queryKey: sessionKeys.detail(sessionId ?? '__skip__'),
    queryFn: () => sessionService.getSessionDetails(sessionId!),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!sessionId,
    retry: 2,
  });

  const {
    mutateAsync,
    isPending: isMarking,
    error: markError,
    data: markResult,
  } = useMutation({
    mutationFn: (payload: BulkAttendanceRequest) =>
      sessionService.markAttendance(sessionId!, payload),
    onSuccess: () => {
      // Invalidate both session details and overview caches
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId!) });
      queryClient.invalidateQueries({ queryKey: ['tutor-overview'] });
    },
  });

  const markAttendanceFn = (payload: BulkAttendanceRequest): Promise<BulkAttendanceResponse> => {
    return mutateAsync(payload);
  };

  return {
    sessionDetails: data ?? null,
    isLoading: isPending,
    error: error ?? null,
    refetch,
    markAttendance: markAttendanceFn,
    isMarking,
    markError: markError ?? null,
    markResult: markResult ?? null,
  };
}

