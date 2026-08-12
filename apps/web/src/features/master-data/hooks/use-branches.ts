import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { FilterParams } from '@/types/api';
import { branchesApi } from '../api/branches.api';
import type { CreateBranchInput, UpdateBranchInput } from '../types';
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
    onSuccess: () => {
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
    onSuccess: (_, variables) => {
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
