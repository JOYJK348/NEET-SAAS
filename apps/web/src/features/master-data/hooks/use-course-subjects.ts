import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseSubjectsApi } from '../api/course-subjects.api';
export { courseSubjectsApi };
import type { CreateCourseSubjectInput } from '../types';

export const courseSubjectKeys = {
  all: ['master', 'course-subjects'] as const,
  byCourse: (courseId: string) => [...courseSubjectKeys.all, 'by-course', courseId] as const,
};

export function useCourseSubjects(courseId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: courseSubjectKeys.byCourse(courseId),
    queryFn: () => courseSubjectsApi.getCourseSubjects(courseId),
    enabled: !!courseId && options?.enabled !== false,
  });
}

export function useAssignSubject(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCourseSubjectInput) => courseSubjectsApi.assignSubject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseSubjectKeys.byCourse(courseId) });
    },
  });
}

export function useUnassignSubject(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseSubjectsApi.unassignSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseSubjectKeys.byCourse(courseId) });
    },
  });
}
