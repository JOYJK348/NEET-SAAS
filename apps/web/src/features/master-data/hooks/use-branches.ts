import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FilterParams } from '@/types/api';
import { branchesApi } from '../api/branches.api';
import type { CreateBranchInput, UpdateBranchInput } from '../types';
import { useAuthStore } from '@/stores/auth-store';

export const branchKeys = {
  all: ['master', 'branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  list: (params?: FilterParams) => [...branchKeys.lists(), params] as const,
  details: () => [...branchKeys.all, 'detail'] as const,
  detail: (id: string) => [...branchKeys.details(), id] as const,
};

export function useBranches(params?: FilterParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: branchKeys.list(params),
    queryFn: () => branchesApi.getBranches(params),
    enabled: isAuthenticated,
  });
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: branchKeys.detail(id),
    queryFn: () => branchesApi.getBranchById(id),
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBranchInput) => branchesApi.createBranch(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBranchInput }) =>
      branchesApi.updateBranch(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      queryClient.invalidateQueries({ queryKey: branchKeys.detail(variables.id) });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => branchesApi.deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
    },
  });
}
