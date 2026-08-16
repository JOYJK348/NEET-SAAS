import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { FilterParams } from '@/types/api';
import { subjectsApi } from '../api/subjects.api';
import type { Subject, CreateSubjectInput, UpdateSubjectInput } from '../types';
import { useAuthStore } from '@/stores/auth-store';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIMES } from '@/lib/staleTimes';

// Backward compatibility alias for legacy call sites
export const subjectKeys = {
  all: ['master', 'subjects'] as const,
  lists: () => [...subjectKeys.all, 'list'] as const,
  list: (params?: FilterParams) => queryKeys.subjects.list(params),
  details: () => [...subjectKeys.all, 'detail'] as const,
  detail: (id: string) => queryKeys.subjects.detail(id),
};

export function useSubjects(params?: FilterParams, options?: { enabled?: boolean }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  const isEnabled = options?.enabled !== undefined ? options.enabled && isAuthenticated : isAuthenticated;

  return useQuery({
    queryKey: queryKeys.subjects.list(params, tenantId),
    queryFn: ({ signal }) => subjectsApi.getSubjects(params, { signal }),
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: keepPreviousData,
    enabled: isEnabled,
  });
}

export function useSubject(id: string) {
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  return useQuery({
    queryKey: queryKeys.subjects.detail(id, tenantId),
    queryFn: ({ signal }) => subjectsApi.getSubjectById(id, { signal }),
    staleTime: STALE_TIMES.MASTERS,
    enabled: !!id,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useMutation({
    mutationFn: (input: CreateSubjectInput) => subjectsApi.createSubject(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.subjects.all(tenantId) });
      const previous = queryClient.getQueriesData({ queryKey: queryKeys.subjects.all(tenantId) });

      const tempSubject: Subject = {
        id: `temp-${Date.now()}`,
        code: input.code || 'SUB',
        name: input.name || '',
        displayName: input.displayName || input.name || '',
        description: input.description,
        subjectType: input.subjectType || 'THEORY',
        displayOrder: input.displayOrder || 1,
        isActive: input.isActive ?? true,
        tenantId: tenantId || 'default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      previous.forEach(([key, oldData]: [any, any]) => {
        if (oldData && oldData.data && Array.isArray(oldData.data)) {
          queryClient.setQueryData(key, {
            ...oldData,
            data: [tempSubject, ...oldData.data],
            meta: oldData.meta ? { ...oldData.meta, total: (oldData.meta.total || 0) + 1 } : oldData.meta,
          });
        } else if (Array.isArray(oldData)) {
          queryClient.setQueryData(key, [tempSubject, ...oldData]);
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
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all(tenantId) });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubjectInput }) =>
      subjectsApi.updateSubject(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.subjects.all(tenantId) });
      const previous = queryClient.getQueriesData({ queryKey: queryKeys.subjects.all(tenantId) });

      previous.forEach(([key, oldData]: [any, any]) => {
        if (oldData && oldData.data && Array.isArray(oldData.data)) {
          queryClient.setQueryData(key, {
            ...oldData,
            data: oldData.data.map((item: Subject) =>
              item.id === id ? { ...item, ...input } : item,
            ),
          });
        } else if (Array.isArray(oldData)) {
          queryClient.setQueryData(
            key,
            oldData.map((item: Subject) => (item.id === id ? { ...item, ...input } : item)),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all(tenantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.detail(variables.id, tenantId) });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useMutation({
    mutationFn: (id: string) => subjectsApi.deleteSubject(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.subjects.all(tenantId) });
      const previous = queryClient.getQueriesData({ queryKey: queryKeys.subjects.all(tenantId) });

      previous.forEach(([key, oldData]: [any, any]) => {
        if (oldData && oldData.data && Array.isArray(oldData.data)) {
          queryClient.setQueryData(key, {
            ...oldData,
            data: oldData.data.filter((item: Subject) => item.id !== id),
            meta: oldData.meta
              ? { ...oldData.meta, total: Math.max(0, (oldData.meta.total || 1) - 1) }
              : oldData.meta,
          });
        } else if (Array.isArray(oldData)) {
          queryClient.setQueryData(
            key,
            oldData.filter((item: Subject) => item.id !== id),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all(tenantId) });
    },
  });
}
