import { useQuery } from '@tanstack/react-query';
import { studentDashboardApi, studentDashboardKeys } from '../api/student-dashboard.api';
import type { StudentAttendanceResponseDto } from '../types/student-dashboard.types';

const STALE_TIME = 2 * 60 * 1000; // 2min
const GC_TIME = 10 * 60 * 1000;

export interface UseStudentAttendanceReturn {
  attendance: StudentAttendanceResponseDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStudentAttendance(): UseStudentAttendanceReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: studentDashboardKeys.attendance(),
    queryFn: () => studentDashboardApi.getAttendance(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
  });

  return {
    attendance: data ?? null,
    isLoading: isPending,
    error: error ?? null,
    refetch,
  };
}
