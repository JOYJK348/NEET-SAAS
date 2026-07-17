import { useState, useCallback, useEffect } from 'react';
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

/**
 * Custom hooks for student management
 *
 * These hooks provide a clean API for components to interact with student data.
 * They are designed to be easily replaceable with React Query hooks when
 * integrating with a real API.
 */

// ============================================
// Student List Hook
// ============================================

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
  refetch: () => Promise<void>;
}

export function useStudents(options: UseStudentsOptions = {}): UseStudentsReturn {
  const { initialFilters = {}, autoFetch = true } = options;

  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<StudentListItem>['meta'] | null>(null);
  const [filters, setFiltersState] = useState<StudentFilters>({
    page: 1,
    perPage: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await studentService.getStudents(filters);
      setStudents(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch students'));
      setStudents([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchStudents();
    }
  }, [fetchStudents, autoFetch]);

  const setFilters = useCallback(
    (newFilters: StudentFilters | ((prev: StudentFilters) => StudentFilters)) => {
      setFiltersState((prev) => {
        const next = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
        return { ...next, page: 1 }; // Reset to first page on filter change
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
    });
  }, []);

  const refetch = useCallback(async () => {
    await fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    meta,
    filters,
    isLoading,
    error,
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

// ============================================
// Student Stats Hook
// ============================================

export interface UseStudentStatsReturn {
  stats: StudentStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useStudentStats(): UseStudentStatsReturn {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await studentService.getStudentStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

// ============================================
// Single Student Hook
// ============================================

export interface UseStudentReturn {
  student: Student | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useStudent(id: string | null): UseStudentReturn {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudent = useCallback(async () => {
    if (!id) {
      setStudent(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await studentService.getStudentById(id);
      setStudent(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch student'));
      setStudent(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  return {
    student,
    isLoading,
    error,
    refetch: fetchStudent,
  };
}

// ============================================
// Mutation Hooks (for create, update, delete)
// ============================================

export interface UseCreateStudentReturn {
  createStudent: (input: CreateStudentInput) => Promise<Student | null>;
  isCreating: boolean;
  error: Error | null;
}

export function useCreateStudent(): UseCreateStudentReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createStudent = useCallback(async (input: CreateStudentInput): Promise<Student | null> => {
    setIsCreating(true);
    setError(null);
    try {
      const student = await studentService.createStudent(input);
      return student;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create student'));
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return { createStudent, isCreating, error };
}

export interface UseUpdateStudentReturn {
  updateStudent: (input: UpdateStudentInput) => Promise<Student | null>;
  isUpdating: boolean;
  error: Error | null;
}

export function useUpdateStudent(): UseUpdateStudentReturn {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateStudent = useCallback(async (input: UpdateStudentInput): Promise<Student | null> => {
    setIsUpdating(true);
    setError(null);
    try {
      const student = await studentService.updateStudent(input);
      return student;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update student'));
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return { updateStudent, isUpdating, error };
}

export interface UseDeleteStudentReturn {
  deleteStudent: (id: string) => Promise<boolean>;
  isDeleting: boolean;
  error: Error | null;
}

export function useDeleteStudent(): UseDeleteStudentReturn {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteStudent = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);
    try {
      const success = await studentService.deleteStudent(id);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete student'));
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { deleteStudent, isDeleting, error };
}

// ============================================
// Archive Student Hook
// ============================================

export interface UseArchiveStudentReturn {
  archiveStudent: (id: string) => Promise<boolean>;
  isArchiving: boolean;
  error: Error | null;
}

export function useArchiveStudent(): UseArchiveStudentReturn {
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const archiveStudent = useCallback(async (id: string): Promise<boolean> => {
    setIsArchiving(true);
    setError(null);
    try {
      const success = await studentService.archiveStudent(id);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to archive student'));
      return false;
    } finally {
      setIsArchiving(false);
    }
  }, []);

  return { archiveStudent, isArchiving, error };
}

// ============================================
// Timeline Events Hook
// ============================================

export interface UseStudentTimelineReturn {
  events: TimelineEvent[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useStudentTimeline(studentId: string | null): UseStudentTimelineReturn {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!studentId) {
      setEvents([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await studentService.getTimelineEvents(studentId);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch timeline'));
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return { events, isLoading, error, refetch: fetchTimeline };
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const bulkUpdateStatus = useCallback(async (ids: string[], status: StudentStatus) => {
    setIsUpdating(true);
    setError(null);
    try {
      const result = await studentService.bulkUpdateStatus(ids, status);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update status'));
      return { success: 0, failed: ids.length };
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return { bulkUpdateStatus, isUpdating, error };
}

// ============================================
// Batches & Courses Hooks (for filters)
// ============================================

export interface UseBatchesReturn {
  batches: { id: string; name: string }[];
  isLoading: boolean;
  error: Error | null;
}

export function useBatches(): UseBatchesReturn {
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    studentService
      .getBatches()
      .then((data) => {
        if (mounted) setBatches(data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err : new Error('Failed to fetch batches'));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { batches, isLoading, error };
}

export interface UseCoursesReturn {
  courses: { id: string; name: string }[];
  isLoading: boolean;
  error: Error | null;
}

export function useCourses(): UseCoursesReturn {
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    studentService
      .getCourses()
      .then((data) => {
        if (mounted) setCourses(data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err : new Error('Failed to fetch courses'));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { courses, isLoading, error };
}

// ============================================
// React Query Keys Export (for future integration)
// ============================================

export { studentServiceKeys };
