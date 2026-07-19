import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FilterParams } from '@/types/api';
import { coursesApi } from '../api/courses.api';
import type { CreateCourseInput, UpdateCourseInput } from '../types';
import { useAuthStore } from '@/stores/auth-store';

export const courseKeys = {
  all: ['master', 'courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params?: FilterParams) => [...courseKeys.lists(), params] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
};

export function useCourses(params?: FilterParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: () => coursesApi.getCourses(params),
    enabled: isAuthenticated,
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => coursesApi.getCourseById(id),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCourseInput) => coursesApi.createCourse(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCourseInput }) =>
      coursesApi.updateCourse(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(variables.id) });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesApi.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}
