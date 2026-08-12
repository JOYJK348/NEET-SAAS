import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { FilterParams } from '@/types/api';
import { coursesApi } from '../api/courses.api';
import type { CreateCourseInput, UpdateCourseInput } from '../types';
import { useAuthStore } from '@/stores/auth-store';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIMES } from '@/lib/staleTimes';

// Backward compatibility alias for legacy call sites
export const courseKeys = {
  all: ['master', 'courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params?: FilterParams) => queryKeys.courses.list(params),
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => queryKeys.courses.detail(id),
};

export function useCourses(params?: FilterParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useQuery({
    queryKey: queryKeys.courses.list(params, tenantId),
    queryFn: ({ signal }) => coursesApi.getCourses(params, { signal }),
    staleTime: STALE_TIMES.MASTERS,
    placeholderData: keepPreviousData,
    enabled: isAuthenticated,
  });
}

export function useCourse(id: string) {
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  return useQuery({
    queryKey: queryKeys.courses.detail(id, tenantId),
    queryFn: ({ signal }) => coursesApi.getCourseById(id, { signal }),
    staleTime: STALE_TIMES.MASTERS,
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useMutation({
    mutationFn: (input: CreateCourseInput) => coursesApi.createCourse(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all(tenantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.all(tenantId) });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCourseInput }) =>
      coursesApi.updateCourse(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all(tenantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(variables.id, tenantId) });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useMutation({
    mutationFn: (id: string) => coursesApi.deleteCourse(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.courses.all(tenantId) });
      const previous = queryClient.getQueriesData({ queryKey: queryKeys.courses.all(tenantId) });
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all(tenantId) });
    },
  });
}
