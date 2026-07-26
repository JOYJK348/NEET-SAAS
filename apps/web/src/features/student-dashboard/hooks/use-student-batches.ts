import { useQuery } from '@tanstack/react-query';
import { studentDashboardApi, studentDashboardKeys } from '../api/student-dashboard.api';
import type { StudentBatchesResponseDto } from '../types/student-dashboard.types';

const STALE_TIME = 5 * 60 * 1000; // 5min — batch data changes rarely
const GC_TIME = 10 * 60 * 1000;

export interface UseStudentBatchesReturn {
  batches: StudentBatchesResponseDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStudentBatches(): UseStudentBatchesReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: studentDashboardKeys.batches(),
    queryFn: () => studentDashboardApi.getBatches(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
  });

  return {
    batches: data ?? null,
    isLoading: isPending,
    error: error ?? null,
    refetch,
  };
}
