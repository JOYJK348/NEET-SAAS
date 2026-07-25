import { useQuery } from '@tanstack/react-query';
import { coursesService, courseKeys } from '@/features/tutor-dashboard/services/courses-service';
import type { TutorCourseListResponseDto } from '@/features/tutor-dashboard/types/courses';

const STALE_TIME = 0;
const GC_TIME = 5 * 60 * 1000;

export interface UseTutorCoursesReturn {
  courses: TutorCourseListResponseDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTutorCourses(): UseTutorCoursesReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: courseKeys.list(),
    queryFn: () => coursesService.getCourses(),
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
