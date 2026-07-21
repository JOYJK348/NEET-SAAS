'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Admission,
  AdmissionListItem,
  AdmissionStats,
  AdmissionFilters,
  AdmissionStatus,
  AdmissionStudent,
  AdmissionCourse,
  AdmissionBranch,
  AdmissionBatch,
  CreateAdmissionInput,
  UpdateAdmissionStatusInput,
  TimelineEvent,
} from '@/features/admissions/types/admission';
import type { PaginationMeta } from '@/types/api';
import {
  admissionService,
  admissionServiceKeys,
} from '@/features/admissions/services/admission-service';

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

export interface UseAdmissionsOptions {
  autoFetch?: boolean;
  initialFilters?: Partial<AdmissionFilters>;
}

export interface UseAdmissionsReturn {
  admissions: AdmissionListItem[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  filters: AdmissionFilters;
  setFilters: (filters: AdmissionFilters) => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setStatus: (status: AdmissionStatus | 'ALL') => void;
  setCourse: (courseId: string) => void;
  setBranch: (branchId: string) => void;
  clearFilters: () => void;
  refetch: () => void;
}

export function useAdmissions(options: UseAdmissionsOptions = {}): UseAdmissionsReturn {
  const { autoFetch = true, initialFilters } = options;
  const [filters, setFilters] = useState<AdmissionFilters>({
    page: 1,
    perPage: 10,
    search: '',
    status: 'ALL',
    ...initialFilters,
  });

  const { data, isPending, error, refetch } = useQuery({
    queryKey: admissionServiceKeys.list(filters),
    queryFn: () => admissionService.getAdmissions(filters),
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

  const setStatus = useCallback((status: AdmissionStatus | 'ALL') => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const setCourse = useCallback((courseId: string) => {
    setFilters((prev) => ({ ...prev, courseId, page: 1 }));
  }, []);

  const setBranch = useCallback((branchId: string) => {
    setFilters((prev) => ({ ...prev, branchId, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ page: 1, perPage: 10, search: '', status: 'ALL' });
  }, []);

  return {
    admissions: data?.data ?? [],
    meta: data?.meta ?? null,
    isLoading: isPending,
    error: error?.message ?? null,
    filters,
    setFilters,
    setPage,
    setSearch,
    setStatus,
    setCourse,
    setBranch,
    clearFilters,
    refetch,
  };
}

export interface UseAdmissionStatsReturn {
  stats: AdmissionStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAdmissionStats(): UseAdmissionStatsReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: admissionServiceKeys.stats(),
    queryFn: () => admissionService.getAdmissionStats(),
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

export interface UseAdmissionReturn {
  admission: Admission | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAdmission(id: string): UseAdmissionReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: admissionServiceKeys.detail(id),
    queryFn: () => admissionService.getAdmissionById(id),
    staleTime: STALE.detail,
    gcTime: GC.detail,
    enabled: !!id,
  });

  return {
    admission: data ?? null,
    isLoading: isPending,
    error: error?.message ?? null,
    refetch,
  };
}

export interface UseCreateAdmissionReturn {
  createAdmission: (input: CreateAdmissionInput) => Promise<Admission>;
  isCreating: boolean;
  error: string | null;
}

export function useCreateAdmission(): UseCreateAdmissionReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (input: CreateAdmissionInput) => admissionService.createAdmission(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: admissionServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: admissionServiceKeys.stats() });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create admission');
    },
  });

  const createAdmission = useCallback(
    async (input: CreateAdmissionInput): Promise<Admission> => {
      setError(null);
      return await mutateAsync(input);
    },
    [mutateAsync],
  );

  return { createAdmission, isCreating: isPending, error };
}

export interface UseUpdateAdmissionStatusReturn {
  updateStatus: (input: UpdateAdmissionStatusInput) => Promise<Admission | null>;
  isUpdating: boolean;
  error: string | null;
}

export function useUpdateAdmissionStatus(): UseUpdateAdmissionStatusReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (input: UpdateAdmissionStatusInput) =>
      admissionService.updateAdmissionStatus(input),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: admissionServiceKeys.detail(input.id) });
      queryClient.invalidateQueries({ queryKey: admissionServiceKeys.timeline(input.id) });
      queryClient.invalidateQueries({ queryKey: admissionServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: admissionServiceKeys.stats() });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to update admission status');
    },
  });

  const updateStatus = useCallback(
    async (input: UpdateAdmissionStatusInput): Promise<Admission | null> => {
      try {
        setError(null);
        return await mutateAsync(input);
      } catch {
        return null;
      }
    },
    [mutateAsync],
  );

  return { updateStatus, isUpdating: isPending, error };
}

export interface UseUpdateAdmissionBatchReturn {
  updateBatch: (input: { id: string; batchId: string }) => Promise<Admission | null>;
  isUpdating: boolean;
  error: string | null;
}

export function useUpdateAdmissionBatch(): UseUpdateAdmissionBatchReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (input: { id: string; batchId: string }) =>
      admissionService.updateAdmissionBatch(input),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: admissionServiceKeys.detail(input.id) });
      queryClient.invalidateQueries({ queryKey: admissionServiceKeys.timeline(input.id) });
      queryClient.invalidateQueries({ queryKey: admissionServiceKeys.lists() });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to update admission batch');
    },
  });

  const updateBatch = useCallback(
    async (input: { id: string; batchId: string }): Promise<Admission | null> => {
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

export interface UseTimelineReturn {
  events: TimelineEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAdmissionTimeline(admissionId: string): UseTimelineReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: admissionServiceKeys.timeline(admissionId),
    queryFn: () => admissionService.getTimelineEvents(admissionId),
    staleTime: STALE.timeline,
    gcTime: GC.timeline,
    enabled: !!admissionId,
  });

  return {
    events: data ?? [],
    isLoading: isPending,
    error: error?.message ?? null,
    refetch,
  };
}

export interface UseStudentsForAdmissionReturn {
  students: AdmissionStudent[];
  isLoading: boolean;
  error: string | null;
}

export function useStudentsForAdmission(): UseStudentsForAdmissionReturn {
  const { data, isPending, error } = useQuery({
    queryKey: admissionServiceKeys.students(),
    queryFn: () => admissionService.getStudents(),
    staleTime: STALE.reference,
    gcTime: GC.reference,
  });

  return {
    students: data ?? [],
    isLoading: isPending,
    error: error?.message ?? null,
  };
}

export interface UseCoursesForAdmissionReturn {
  courses: AdmissionCourse[];
  isLoading: boolean;
  error: string | null;
}

export function useCoursesForAdmission(): UseCoursesForAdmissionReturn {
  const { data, isPending, error } = useQuery({
    queryKey: admissionServiceKeys.courses(),
    queryFn: () => admissionService.getCourses(),
    staleTime: STALE.reference,
    gcTime: GC.reference,
  });

  return {
    courses: data ?? [],
    isLoading: isPending,
    error: error?.message ?? null,
  };
}

export interface UseBranchesForAdmissionReturn {
  branches: AdmissionBranch[];
  isLoading: boolean;
  error: string | null;
}

export function useBranchesForAdmission(): UseBranchesForAdmissionReturn {
  const { data, isPending, error } = useQuery({
    queryKey: admissionServiceKeys.branches(),
    queryFn: () => admissionService.getBranches(),
    staleTime: STALE.reference,
    gcTime: GC.reference,
  });

  return {
    branches: data ?? [],
    isLoading: isPending,
    error: error?.message ?? null,
  };
}

export interface UseBatchesForAdmissionReturn {
  batches: AdmissionBatch[];
  isLoading: boolean;
  error: string | null;
}

export function useBatchesForAdmission(
  courseId?: string,
  branchId?: string,
): UseBatchesForAdmissionReturn {
  const { data, isPending, error } = useQuery({
    queryKey: [...admissionServiceKeys.batches(courseId), branchId || 'all'],
    queryFn: () => admissionService.getBatches(courseId, branchId),
    staleTime: STALE.reference,
    gcTime: GC.reference,
  });

  return {
    batches: data ?? [],
    isLoading: isPending,
    error: error?.message ?? null,
  };
}

export interface UseAcademicYearsForAdmissionReturn {
  years: { id: string; name: string }[];
  isLoading: boolean;
  error: string | null;
}

export function useAcademicYearsForAdmission(): UseAcademicYearsForAdmissionReturn {
  const { data, isPending, error } = useQuery({
    queryKey: admissionServiceKeys.academicYears(),
    queryFn: () => admissionService.getAcademicYears(),
    staleTime: STALE.reference,
    gcTime: GC.reference,
  });

  return {
    years: data ?? [],
    isLoading: isPending,
    error: error?.message ?? null,
  };
}

export function usePrefetchAdmissionDetail() {
  const queryClient = useQueryClient();
  return useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: admissionServiceKeys.detail(id),
        queryFn: () => admissionService.getAdmissionById(id),
        staleTime: STALE.detail,
      });
    },
    [queryClient],
  );
}
