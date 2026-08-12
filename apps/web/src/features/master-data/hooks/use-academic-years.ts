import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { FilterParams } from '@/types/api';
import { academicYearsApi } from '../api/academic-years.api';
import type { AcademicYear, CreateAcademicYearInput, UpdateAcademicYearInput } from '../types';
import { useAuthStore } from '@/stores/auth-store';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIMES } from '@/lib/staleTimes';

// Backward compatibility alias for legacy call sites
export const academicYearKeys = {
  all: ['master', 'academic-years'] as const,
  lists: () => [...academicYearKeys.all, 'list'] as const,
  list: (params?: FilterParams) => queryKeys.academicYears.list(params),
  details: () => [...academicYearKeys.all, 'detail'] as const,
  detail: (id: string) => [...academicYearKeys.academicYears.all(), 'detail', id] as const,
};

export function useAcademicYears(params?: FilterParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useQuery({
    queryKey: queryKeys.academicYears.list(params, tenantId),
    queryFn: ({ signal }) => academicYearsApi.getAcademicYears(params, { signal }),
    staleTime: STALE_TIMES.MASTERS,
    placeholderData: keepPreviousData,
    enabled: isAuthenticated,
  });
}

export function useAcademicYear(id: string) {
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  return useQuery({
    queryKey: ['tenant', tenantId ?? 'default', 'master', 'academic-years', 'detail', id],
    queryFn: ({ signal }) => academicYearsApi.getAcademicYearById(id, { signal }),
    staleTime: STALE_TIMES.MASTERS,
    enabled: !!id,
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useMutation({
    mutationFn: (input: CreateAcademicYearInput) => academicYearsApi.createAcademicYear(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.academicYears.all(tenantId) });
    },
  });
}

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAcademicYearInput }) =>
      academicYearsApi.updateAcademicYear(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.academicYears.all(tenantId) });
      const previous = queryClient.getQueriesData({ queryKey: queryKeys.academicYears.all(tenantId) });

      // Optimistically update list queries in cache
      previous.forEach(([key, oldData]: [any, any]) => {
        if (oldData && oldData.data && Array.isArray(oldData.data)) {
          queryClient.setQueryData(key, {
            ...oldData,
            data: oldData.data.map((item: AcademicYear) =>
              item.id === id
                ? {
                    ...item,
                    ...input,
                    ...(input.isCurrent ? { isCurrent: true } : {}),
                  }
                : input.isCurrent
                ? { ...item, isCurrent: false }
                : item,
            ),
          });
        }
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.academicYears.all(tenantId) });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['tenant', tenantId ?? 'default', 'master', 'academic-years', 'detail', variables.id] });
      }
    },
  });
}

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useMutation({
    mutationFn: (id: string) => academicYearsApi.deleteAcademicYear(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.academicYears.all(tenantId) });
      const previous = queryClient.getQueriesData({ queryKey: queryKeys.academicYears.all(tenantId) });

      // Optimistically remove deleted row from cache
      previous.forEach(([key, oldData]: [any, any]) => {
        if (oldData && oldData.data && Array.isArray(oldData.data)) {
          queryClient.setQueryData(key, {
            ...oldData,
            data: oldData.data.filter((item: AcademicYear) => item.id !== id),
          });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.academicYears.all(tenantId) });
    },
  });
}
