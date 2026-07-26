import { useQuery } from '@tanstack/react-query';
import { studentDashboardApi, studentDashboardKeys } from '../api/student-dashboard.api';
import type { StudentCoursesResponseDto } from '../types/student-dashboard.types';

const STALE_TIME = 10 * 60 * 1000; // 10min — syllabus rarely changes
const GC_TIME = 30 * 60 * 1000;

export interface UseStudentCoursesReturn {
  courses: StudentCoursesResponseDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStudentCourses(): UseStudentCoursesReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: studentDashboardKeys.courses(),
    queryFn: () => studentDashboardApi.getCourses(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
  });

  return {
    courses: data ?? null,
    isLoading: isPending,
    error: error ?? null,
    refetch,
  };
}
