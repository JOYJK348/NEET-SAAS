import { useQuery } from '@tanstack/react-query';
import { batchesService, batchKeys } from '@/features/tutor-dashboard/services/batches-service';
import type {
  TutorBatchListResponseDto,
  TutorBatchStudentsResponseDto,
} from '@/features/tutor-dashboard/types/batches';

const STALE_TIME = 0;
const GC_TIME = 5 * 60 * 1000;

export interface UseTutorBatchesReturn {
  batches: TutorBatchListResponseDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTutorBatches(): UseTutorBatchesReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: batchKeys.list(),
    queryFn: () => batchesService.getBatches(),
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

export interface UseBatchStudentsReturn {
  batchStudents: TutorBatchStudentsResponseDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useBatchStudents(batchId: string | null): UseBatchStudentsReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: batchKeys.detail(batchId ?? '__skip__'),
    queryFn: () => batchesService.getBatchStudents(batchId!),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!batchId,
    retry: 2,
  });

  return {
    batchStudents: data ?? null,
    isLoading: isPending,
    error: error ?? null,
    refetch,
  };
}

