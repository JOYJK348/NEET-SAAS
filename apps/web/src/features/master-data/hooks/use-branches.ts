import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { FilterParams } from '@/types/api';
import { branchesApi } from '../api/branches.api';
import type { Branch, CreateBranchInput, UpdateBranchInput } from '../types';
import { useAuthStore } from '@/stores/auth-store';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIMES } from '@/lib/staleTimes';

// Backward compatibility alias for legacy call sites
export const branchKeys = {
  all: ['master', 'branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  list: (params?: FilterParams) => queryKeys.branches.list(params),
  details: () => [...branchKeys.all, 'detail'] as const,
  detail: (id: string) => queryKeys.branches.detail(id),
};

export function useBranches(params?: FilterParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useQuery({
    queryKey: queryKeys.branches.list(params, tenantId),
    queryFn: ({ signal }) => branchesApi.getBranches(params, { signal }),
    staleTime: STALE_TIMES.MASTERS,
    placeholderData: keepPreviousData,
    enabled: isAuthenticated,
  });
}

export function useBranch(id: string) {
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  return useQuery({
    queryKey: queryKeys.branches.detail(id, tenantId),
    queryFn: ({ signal }) => branchesApi.getBranchById(id, { signal }),
    staleTime: STALE_TIMES.MASTERS,
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useMutation({
    mutationFn: (input: CreateBranchInput) => branchesApi.createBranch(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.branches.all(tenantId) });
      const previous = queryClient.getQueriesData({ queryKey: queryKeys.branches.all(tenantId) });

      const tempBranch: Branch = {
        id: `temp-${Date.now()}`,
        code: input.code || 'BR',
        slug: input.slug || input.code?.toLowerCase() || 'br',
        name: input.name || '',
        displayName: input.displayName || input.name || '',
        email: input.email || '',
        phone: input.phone || '',
        branchType: input.branchType || 'CAMPUS',
        status: input.status || 'ACTIVE',
        timezone: input.timezone || 'Asia/Kolkata',
        tenantId: tenantId || 'default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      previous.forEach(([key, oldData]: [any, any]) => {
        if (oldData && oldData.data && Array.isArray(oldData.data)) {
          queryClient.setQueryData(key, {
            ...oldData,
            data: [tempBranch, ...oldData.data],
            meta: oldData.meta ? { ...oldData.meta, total: (oldData.meta.total || 0) + 1 } : oldData.meta,
          });
        } else if (Array.isArray(oldData)) {
          queryClient.setQueryData(key, [tempBranch, ...oldData]);
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
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all(tenantId) });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBranchInput }) =>
      branchesApi.updateBranch(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.branches.all(tenantId) });
      const previous = queryClient.getQueriesData({ queryKey: queryKeys.branches.all(tenantId) });

      previous.forEach(([key, oldData]: [any, any]) => {
        if (oldData && oldData.data && Array.isArray(oldData.data)) {
          queryClient.setQueryData(key, {
            ...oldData,
            data: oldData.data.map((item: Branch) =>
              item.id === id ? { ...item, ...input } : item,
            ),
          });
        } else if (Array.isArray(oldData)) {
          queryClient.setQueryData(
            key,
            oldData.map((item: Branch) => (item.id === id ? { ...item, ...input } : item)),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all(tenantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.detail(variables.id, tenantId) });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useMutation({
    mutationFn: (id: string) => branchesApi.deleteBranch(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.branches.all(tenantId) });
      const previous = queryClient.getQueriesData({ queryKey: queryKeys.branches.all(tenantId) });

      previous.forEach(([key, oldData]: [any, any]) => {
        if (oldData && oldData.data && Array.isArray(oldData.data)) {
          queryClient.setQueryData(key, {
            ...oldData,
            data: oldData.data.filter((item: Branch) => item.id !== id),
            meta: oldData.meta
              ? { ...oldData.meta, total: Math.max(0, (oldData.meta.total || 1) - 1) }
              : oldData.meta,
          });
        } else if (Array.isArray(oldData)) {
          queryClient.setQueryData(
            key,
            oldData.filter((item: Branch) => item.id !== id),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all(tenantId) });
    },
  });
}
