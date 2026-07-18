import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Student,
  StudentListItem,
  StudentStats,
  StudentFilters,
  StudentStatus,
  CreateStudentInput,
  UpdateStudentInput,
  TimelineEvent,
} from '@/features/students/types/student';
import type { PaginatedResponse } from '@/types/api';
import { studentService, studentServiceKeys } from '@/features/students/services/student-service';

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

export interface UseStudentsOptions {
  initialFilters?: StudentFilters;
  autoFetch?: boolean;
}

export interface UseStudentsReturn {
  students: StudentListItem[];
  meta: PaginatedResponse<StudentListItem>['meta'] | null;
  filters: StudentFilters;
  isLoading: boolean;
  error: Error | null;
  setFilters: (filters: StudentFilters | ((prev: StudentFilters) => StudentFilters)) => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setStatus: (status: StudentStatus | 'ALL') => void;
  setBatch: (batchId: string) => void;
  setCourse: (courseId: string) => void;
  setGender: (gender: 'MALE' | 'FEMALE' | 'OTHER' | 'ALL') => void;
  setDateRange: (from: string | undefined, to: string | undefined) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  clearFilters: () => void;
  refetch: () => void;
}

export function useStudents(options: UseStudentsOptions = {}): UseStudentsReturn {
  const { initialFilters = {}, autoFetch = true } = options;
  const [filters, setFiltersState] = useState<StudentFilters>({
    page: 1,
    perPage: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    status: 'ALL',
    ...initialFilters,
  });

  const { data, isPending, error, refetch } = useQuery({
    queryKey: studentServiceKeys.list(filters),
    queryFn: () => studentService.getStudents(filters),
    staleTime: STALE.list,
    gcTime: GC.list,
    enabled: autoFetch,
  });

  const setFilters = useCallback(
    (newFilters: StudentFilters | ((prev: StudentFilters) => StudentFilters)) => {
      setFiltersState((prev) => {
        const next = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
        return { ...next, page: 1 };
      });
    },
    [],
  );

  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setFiltersState((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setStatus = useCallback((status: StudentStatus | 'ALL') => {
    setFiltersState((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const setBatch = useCallback((batchId: string) => {
    setFiltersState((prev) => ({ ...prev, batchId: batchId || undefined, page: 1 }));
  }, []);

  const setCourse = useCallback((courseId: string) => {
    setFiltersState((prev) => ({ ...prev, courseId: courseId || undefined, page: 1 }));
  }, []);

  const setGender = useCallback((gender: 'MALE' | 'FEMALE' | 'OTHER' | 'ALL') => {
    setFiltersState((prev) => ({
      ...prev,
      gender: gender === 'ALL' ? undefined : gender,
      page: 1,
    }));
  }, []);

  const setDateRange = useCallback((from: string | undefined, to: string | undefined) => {
    setFiltersState((prev) => ({ ...prev, dateFrom: from, dateTo: to, page: 1 }));
  }, []);

  const setSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFiltersState((prev) => ({ ...prev, sortBy, sortOrder }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({
      page: 1,
      perPage: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      status: 'ALL',
    });
  }, []);

  return {
    students: data?.data ?? [],
    meta: data?.meta ?? null,
    filters,
    isLoading: isPending,
    error: error ?? null,
    setFilters,
    setPage,
    setSearch,
    setStatus,
    setBatch,
    setCourse,
    setGender,
    setDateRange,
    setSort,
    clearFilters,
    refetch,
  };
}

export interface UseStudentStatsReturn {
  stats: StudentStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStudentStats(): UseStudentStatsReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: studentServiceKeys.stats(),
    queryFn: () => studentService.getStudentStats(),
    staleTime: STALE.stats,
    gcTime: GC.stats,
  });

  return {
    stats: data ?? null,
    isLoading: isPending,
    error: error ?? null,
    refetch,
  };
}

export interface UseStudentReturn {
  student: Student | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStudent(id: string | null): UseStudentReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: studentServiceKeys.detail(id ?? '__skip__'),
    queryFn: () => studentService.getStudentById(id!),
    staleTime: STALE.detail,
    gcTime: GC.detail,
    enabled: !!id,
  });

  return {
    student: data ?? null,
    isLoading: isPending,
    error: error ?? null,
    refetch,
  };
}

export interface UseCreateStudentReturn {
  createStudent: (input: CreateStudentInput) => Promise<Student | null>;
  isCreating: boolean;
  error: Error | null;
}

export function useCreateStudent(): UseCreateStudentReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (input: CreateStudentInput) => studentService.createStudent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentServiceKeys.stats() });
    },
    onError: (err) => {
      setError(err instanceof Error ? err : new Error('Failed to create student'));
    },
  });

  const createStudent = useCallback(
    async (input: CreateStudentInput): Promise<Student | null> => {
      try {
        setError(null);
        return await mutateAsync(input);
      } catch {
        return null;
      }
    },
    [mutateAsync],
  );

  return { createStudent, isCreating: isPending, error };
}

export interface UseUpdateStudentReturn {
  updateStudent: (input: UpdateStudentInput) => Promise<Student | null>;
  isUpdating: boolean;
  error: Error | null;
}

export function useUpdateStudent(): UseUpdateStudentReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (input: UpdateStudentInput) => studentService.updateStudent(input),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: studentServiceKeys.detail(input.id) });
      queryClient.invalidateQueries({ queryKey: studentServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentServiceKeys.stats() });
    },
    onError: (err) => {
      setError(err instanceof Error ? err : new Error('Failed to update student'));
    },
  });

  const updateStudent = useCallback(
    async (input: UpdateStudentInput): Promise<Student | null> => {
      try {
        setError(null);
        return await mutateAsync(input);
      } catch {
        return null;
      }
    },
    [mutateAsync],
  );

  return { updateStudent, isUpdating: isPending, error };
}

export interface UseDeleteStudentReturn {
  deleteStudent: (id: string) => Promise<boolean>;
  isDeleting: boolean;
  error: Error | null;
}

export function useDeleteStudent(): UseDeleteStudentReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (id: string) => studentService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentServiceKeys.stats() });
    },
    onError: (err) => {
      setError(err instanceof Error ? err : new Error('Failed to delete student'));
    },
  });

  const deleteStudent = useCallback(
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

  return { deleteStudent, isDeleting: isPending, error };
}

export interface UseArchiveStudentReturn {
  archiveStudent: (id: string) => Promise<boolean>;
  isArchiving: boolean;
  error: Error | null;
}

export function useArchiveStudent(): UseArchiveStudentReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (id: string) => studentService.archiveStudent(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: studentServiceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: studentServiceKeys.timeline(id) });
      queryClient.invalidateQueries({ queryKey: studentServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentServiceKeys.stats() });
    },
    onError: (err) => {
      setError(err instanceof Error ? err : new Error('Failed to archive student'));
    },
  });

  const archiveStudent = useCallback(
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

  return { archiveStudent, isArchiving: isPending, error };
}

export interface UseStudentTimelineReturn {
  events: TimelineEvent[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStudentTimeline(studentId: string | null): UseStudentTimelineReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: studentServiceKeys.timeline(studentId ?? '__skip__'),
    queryFn: () => studentService.getTimelineEvents(studentId!),
    staleTime: STALE.timeline,
    gcTime: GC.timeline,
    enabled: !!studentId,
  });

  return {
    events: data ?? [],
    isLoading: isPending,
    error: error ?? null,
    refetch,
  };
}

export interface UseBulkUpdateStatusReturn {
  bulkUpdateStatus: (
    ids: string[],
    status: StudentStatus,
  ) => Promise<{ success: number; failed: number }>;
  isUpdating: boolean;
  error: Error | null;
}

export function useBulkUpdateStatus(): UseBulkUpdateStatusReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: StudentStatus }) =>
      studentService.bulkUpdateStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentServiceKeys.stats() });
    },
    onError: (err) => {
      setError(err instanceof Error ? err : new Error('Failed to bulk update status'));
    },
  });

  const bulkUpdateStatus = useCallback(
    async (ids: string[], status: StudentStatus) => {
      try {
        setError(null);
        return await mutateAsync({ ids, status });
      } catch {
        return { success: 0, failed: ids.length };
      }
    },
    [mutateAsync],
  );

  return { bulkUpdateStatus, isUpdating: isPending, error };
}

export interface UseBatchesReturn {
  batches: { id: string; name: string }[];
  isLoading: boolean;
  error: Error | null;
}

export function useBatches(): UseBatchesReturn {
  const { data, isPending, error } = useQuery({
    queryKey: studentServiceKeys.batches(),
    queryFn: () => studentService.getBatches(),
    staleTime: STALE.reference,
    gcTime: GC.reference,
  });

  return {
    batches: data ?? [],
    isLoading: isPending,
    error: error ?? null,
  };
}

export interface UseCoursesReturn {
  courses: { id: string; name: string }[];
  isLoading: boolean;
  error: Error | null;
}

export function useCourses(): UseCoursesReturn {
  const { data, isPending, error } = useQuery({
    queryKey: studentServiceKeys.courses(),
    queryFn: () => studentService.getCourses(),
    staleTime: STALE.reference,
    gcTime: GC.reference,
  });

  return {
    courses: data ?? [],
    isLoading: isPending,
    error: error ?? null,
  };
}

export function usePrefetchStudentDetail() {
  const queryClient = useQueryClient();
  return useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: studentServiceKeys.detail(id),
        queryFn: () => studentService.getStudentById(id),
        staleTime: STALE.detail,
      });
    },
    [queryClient],
  );
}

export { studentServiceKeys };
