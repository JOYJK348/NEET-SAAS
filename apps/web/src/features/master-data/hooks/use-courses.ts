import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { FilterParams } from '@/types/api';
import { coursesApi } from '../api/courses.api';
import type { Course, CreateCourseInput, UpdateCourseInput } from '../types';
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
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.courses.all(tenantId) });
      const previous = queryClient.getQueriesData({ queryKey: queryKeys.courses.all(tenantId) });

      const tempCourse: Course = {
        id: `temp-${Date.now()}`,
        code: input.code || 'NEW',
        name: input.name || '',
        displayName: input.displayName || input.name || '',
        description: input.description,
        courseType: input.courseType || 'REGULAR',
        durationMonths: input.durationMonths || 12,
        displayOrder: input.displayOrder || 1,
        isActive: input.isActive ?? true,
        startDate: input.startDate,
        endDate: input.endDate,
        tenantId: tenantId || 'default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      previous.forEach(([key, oldData]: [any, any]) => {
        if (oldData && oldData.data && Array.isArray(oldData.data)) {
          queryClient.setQueryData(key, {
            ...oldData,
            data: [tempCourse, ...oldData.data],
            meta: oldData.meta ? { ...oldData.meta, total: (oldData.meta.total || 0) + 1 } : oldData.meta,
          });
        } else if (Array.isArray(oldData)) {
          queryClient.setQueryData(key, [tempCourse, ...oldData]);
        }
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
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
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.courses.all(tenantId) });
      const previous = queryClient.getQueriesData({ queryKey: queryKeys.courses.all(tenantId) });

      previous.forEach(([key, oldData]: [any, any]) => {
        if (oldData && oldData.data && Array.isArray(oldData.data)) {
          queryClient.setQueryData(key, {
            ...oldData,
            data: oldData.data.map((item: Course) =>
              item.id === id ? { ...item, ...input } : item,
            ),
          });
        } else if (Array.isArray(oldData)) {
          queryClient.setQueryData(
            key,
            oldData.map((item: Course) => (item.id === id ? { ...item, ...input } : item)),
          );
        }
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: (_, __, variables) => {
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

      previous.forEach(([key, oldData]: [any, any]) => {
        if (oldData && oldData.data && Array.isArray(oldData.data)) {
          queryClient.setQueryData(key, {
            ...oldData,
            data: oldData.data.filter((item: Course) => item.id !== id),
            meta: oldData.meta
              ? { ...oldData.meta, total: Math.max(0, (oldData.meta.total || 1) - 1) }
              : oldData.meta,
          });
        } else if (Array.isArray(oldData)) {
          queryClient.setQueryData(
            key,
            oldData.filter((item: Course) => item.id !== id),
          );
        }
      });

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
