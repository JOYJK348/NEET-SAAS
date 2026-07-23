'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Batch,
  BatchListItem,
  BatchStats,
  BatchFilters,
  BatchStatus,
  BatchDeliveryType,
  BatchStudentEnrollment,
  BatchStaffAssignment,
  BatchTimelineEvent,
  CreateBatchInput,
  UpdateBatchInput,
} from '@/features/batches/types/batch';
import type { PaginationMeta } from '@/types/api';
import { batchService, batchServiceKeys } from '@/features/batches/services/batch-service';

const STALE = {
  list: 30 * 1000,
  detail: 60 * 1000,
  stats: 60 * 1000,
  timeline: 30 * 1000,
  reference: 5 * 60 * 1000,
};

const GC = {
  list: 5 * 60 * 1000,
  detail: 30 * 60 * 1000,
  stats: 5 * 60 * 1000,
  timeline: 5 * 60 * 1000,
  reference: 30 * 60 * 1000,
};

export interface UseBatchesReturn {
  batches: BatchListItem[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  filters: BatchFilters;
  setFilters: (filters: BatchFilters) => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setSearch: (search: string) => void;
  setStatus: (status: BatchStatus | 'ALL') => void;
  setCourse: (courseId: string) => void;
  setBranch: (branchId: string) => void;
  clearFilters: () => void;
  refetch: () => void;
}

export function useBatches(options: { autoFetch?: boolean } = {}): UseBatchesReturn {
  const { autoFetch = true } = options;
  const [filters, setFilters] = useState<BatchFilters>({
    page: 1,
    perPage: 10,
    search: '',
    status: 'ALL',
  });

  const { data, isPending, error, refetch } = useQuery({
    queryKey: batchServiceKeys.list(filters),
    queryFn: () => batchService.getBatches(filters),
    staleTime: STALE.list,
    gcTime: GC.list,
    enabled: autoFetch,
  });

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setStatus = useCallback((status: BatchStatus | 'ALL') => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const setCourse = useCallback((courseId: string) => {
    setFilters((prev) => ({ ...prev, courseId, page: 1 }));
  }, []);

  const setBranch = useCallback((branchId: string) => {
    setFilters((prev) => ({ ...prev, branchId, page: 1 }));
  }, []);

  const setPerPage = useCallback((perPage: number) => {
    setFilters((prev) => ({ ...prev, perPage, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ page: 1, perPage: 10, search: '', status: 'ALL' });
  }, []);

  return {
    batches: data?.data ?? [],
    meta: data?.meta ?? null,
    isLoading: isPending,
    error: error?.message ?? null,
    filters,
    setFilters,
    setPage,
    setPerPage,
    setSearch,
    setStatus,
    setCourse,
    setBranch,
    clearFilters,
    refetch,
  };
}

export interface UseBatchStatsReturn {
  stats: BatchStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBatchStats(): UseBatchStatsReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: batchServiceKeys.stats(),
    queryFn: () => batchService.getBatchStats(),
    staleTime: STALE.stats,
    gcTime: GC.stats,
  });

  return {
    stats: data ?? null,
    isLoading: isPending,
    error: error?.message ?? null,
    refetch,
  };
}

export interface UseBatchReturn {
  batch: Batch | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBatch(id: string): UseBatchReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: batchServiceKeys.detail(id),
    queryFn: () => batchService.getBatchById(id),
    staleTime: STALE.detail,
    gcTime: GC.detail,
    enabled: !!id,
  });

  return {
    batch: data ?? null,
    isLoading: isPending,
    error: error?.message ?? null,
    refetch,
  };
}

export interface UseCreateBatchReturn {
  createBatch: (input: CreateBatchInput) => Promise<Batch | null>;
  isCreating: boolean;
  error: string | null;
}

export function useCreateBatch(): UseCreateBatchReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (input: CreateBatchInput) => batchService.createBatch(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.stats() });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create batch');
    },
  });

  const createBatch = useCallback(
    async (input: CreateBatchInput): Promise<Batch | null> => {
      setError(null);
      return await mutateAsync(input);
    },
    [mutateAsync],
  );

  return { createBatch, isCreating: isPending, error };
}

export interface UseUpdateBatchReturn {
  updateBatch: (input: UpdateBatchInput) => Promise<Batch | null>;
  isUpdating: boolean;
  error: string | null;
}

export function useUpdateBatch(): UseUpdateBatchReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (input: UpdateBatchInput) => batchService.updateBatch(input),
    onMutate: async (newBatch) => {
      await queryClient.cancelQueries({ queryKey: batchServiceKeys.lists() });

      const previousBatchesQueries = queryClient.getQueriesData<any>({
        queryKey: batchServiceKeys.lists(),
      });

      queryClient.setQueriesData<any>({ queryKey: batchServiceKeys.lists() }, (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((b: any) =>
            b.id === newBatch.id
              ? {
                  ...b,
                  ...(newBatch.isActive !== undefined ? { isActive: newBatch.isActive } : {}),
                  ...(newBatch.status !== undefined ? { status: newBatch.status } : {}),
                }
              : b,
          ),
        };
      });

      return { previousBatchesQueries };
    },
    onError: (err, _newBatch, context: any) => {
      setError(err instanceof Error ? err.message : 'Failed to update batch');
      if (context?.previousBatchesQueries) {
        context.previousBatchesQueries.forEach(([queryKey, value]: any) => {
          queryClient.setQueryData(queryKey, value);
        });
      }
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.detail(input.id) });
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.timeline(input.id) });
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.stats() });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.lists() });
    },
  });

  const updateBatch = useCallback(
    async (input: UpdateBatchInput): Promise<Batch | null> => {
      try {
        setError(null);
        return await mutateAsync(input);
      } catch {
        return null;
      }
    },
    [mutateAsync],
  );

  return { updateBatch, isUpdating: isPending, error };
}

export interface UseArchiveBatchReturn {
  archiveBatch: (id: string) => Promise<boolean>;
  isArchiving: boolean;
  error: string | null;
}

export function useArchiveBatch(): UseArchiveBatchReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (id: string) => batchService.archiveBatch(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.timeline(id) });
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.stats() });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to archive batch');
    },
  });

  const archiveBatch = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);
        return await mutateAsync(id);
      } catch {
        return false;
      }
    },
    [mutateAsync],
  );

  return { archiveBatch, isArchiving: isPending, error };
}

export interface UseBatchTimelineReturn {
  events: BatchTimelineEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBatchTimeline(batchId: string): UseBatchTimelineReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: batchServiceKeys.timeline(batchId),
    queryFn: () => batchService.getTimelineEvents(batchId),
    staleTime: STALE.timeline,
    gcTime: GC.timeline,
    enabled: !!batchId,
  });

  return {
    events: data ?? [],
    isLoading: isPending,
    error: error?.message ?? null,
    refetch,
  };
}

export interface UseBatchStudentsReturn {
  students: BatchStudentEnrollment[];
  isLoading: boolean;
  error: string | null;
}

export function useBatchStudents(
  batchId: string,
  options?: { enabled?: boolean },
): UseBatchStudentsReturn {
  const { data, isPending, error } = useQuery({
    queryKey: batchServiceKeys.students(batchId),
    queryFn: () => batchService.getBatchStudents(batchId),
    staleTime: STALE.reference,
    gcTime: GC.reference,
    enabled: !!batchId && (options?.enabled ?? true),
  });

  return {
    students: data ?? [],
    isLoading: isPending,
    error: error?.message ?? null,
  };
}

export interface UseBatchStaffAssignmentsReturn {
  assignments: BatchStaffAssignment[];
  isLoading: boolean;
  error: string | null;
}

export function useBatchStaffAssignments(
  batchId: string,
  options?: { enabled?: boolean },
): UseBatchStaffAssignmentsReturn {
  const { data, isPending, error } = useQuery({
    queryKey: batchServiceKeys.staff(batchId),
    queryFn: () => batchService.getBatchStaffAssignments(batchId),
    staleTime: STALE.reference,
    gcTime: GC.reference,
    enabled: !!batchId && (options?.enabled ?? true),
  });

  return {
    assignments: data ?? [],
    isLoading: isPending,
    error: error?.message ?? null,
  };
}

export interface UseDeliveryTypesReturn {
  deliveryTypes: BatchDeliveryType[];
  isLoading: boolean;
  error: string | null;
}

export function useDeliveryTypes(): UseDeliveryTypesReturn {
  const { data, isPending, error } = useQuery({
    queryKey: batchServiceKeys.deliveryTypes(),
    queryFn: () => batchService.getDeliveryTypes(),
    staleTime: STALE.reference,
    gcTime: GC.reference,
  });

  return {
    deliveryTypes: data ?? [],
    isLoading: isPending,
    error: error?.message ?? null,
  };
}

export interface UseCoursesForBatchReturn {
  courses: { id: string; name: string }[];
  isLoading: boolean;
  error: string | null;
}

export function useCoursesForBatch(): UseCoursesForBatchReturn {
  const { data, isPending, error } = useQuery({
    queryKey: batchServiceKeys.courses(),
    queryFn: () => batchService.getCourses(),
    staleTime: STALE.reference,
    gcTime: GC.reference,
  });

  return {
    courses: data ?? [],
    isLoading: isPending,
    error: error?.message ?? null,
  };
}

export interface UseBranchesForBatchReturn {
  branches: { id: string; name: string }[];
  isLoading: boolean;
  error: string | null;
}

export function useBranchesForBatch(): UseBranchesForBatchReturn {
  const { data, isPending, error } = useQuery({
    queryKey: batchServiceKeys.branches(),
    queryFn: () => batchService.getBranches(),
    staleTime: STALE.reference,
    gcTime: GC.reference,
  });

  return {
    branches: data ?? [],
    isLoading: isPending,
    error: error?.message ?? null,
  };
}

export interface UseAcademicYearsForBatchReturn {
  years: { id: string; name: string }[];
  isLoading: boolean;
  error: string | null;
}

export function useAcademicYearsForBatch(): UseAcademicYearsForBatchReturn {
  const { data, isPending, error } = useQuery({
    queryKey: batchServiceKeys.academicYears(),
    queryFn: () => batchService.getAcademicYears(),
    staleTime: STALE.reference,
    gcTime: GC.reference,
  });

  return {
    years: data ?? [],
    isLoading: isPending,
    error: error?.message ?? null,
  };
}

export function usePrefetchBatchDetail() {
  const queryClient = useQueryClient();
  return useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: batchServiceKeys.detail(id),
        queryFn: () => batchService.getBatchById(id),
        staleTime: STALE.detail,
      });
    },
    [queryClient],
  );
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ admissionId, batchId }: { admissionId: string; batchId: string }) =>
      batchService.enrollStudent(admissionId, batchId),
    onSuccess: (_, { batchId }) => {
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.students(batchId) });
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.detail(batchId) });
    },
  });
}

export function useAssignStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      batchId,
      staffProfileId,
      subjectId,
    }: {
      batchId: string;
      staffProfileId: string;
      subjectId: string;
    }) => batchService.assignStaff(batchId, staffProfileId, subjectId),
    onSuccess: (_, { batchId }) => {
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.staff(batchId) });
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.detail(batchId) });
    },
  });
}

export function useUnassignStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, assignmentId }: { batchId: string; assignmentId: string }) =>
      batchService.unassignStaff(batchId, assignmentId),
    onSuccess: (_, { batchId }) => {
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.staff(batchId) });
      queryClient.invalidateQueries({ queryKey: batchServiceKeys.detail(batchId) });
    },
  });
}
