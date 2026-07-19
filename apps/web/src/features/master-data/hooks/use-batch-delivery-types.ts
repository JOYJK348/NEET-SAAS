import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FilterParams } from '@/types/api';
import { batchDeliveryTypesApi } from '../api/batch-delivery-types.api';
import type { CreateBatchDeliveryTypeInput, UpdateBatchDeliveryTypeInput } from '../types';
import { useAuthStore } from '@/stores/auth-store';

export const deliveryTypeKeys = {
  all: ['master', 'batch-delivery-types'] as const,
  lists: () => [...deliveryTypeKeys.all, 'list'] as const,
  list: (params?: FilterParams) => [...deliveryTypeKeys.lists(), params] as const,
  details: () => [...deliveryTypeKeys.all, 'detail'] as const,
  detail: (id: string) => [...deliveryTypeKeys.details(), id] as const,
};

export function useBatchDeliveryTypes(params?: FilterParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: deliveryTypeKeys.list(params),
    queryFn: () => batchDeliveryTypesApi.getDeliveryTypes(params),
    enabled: isAuthenticated,
  });
}

export function useBatchDeliveryType(id: string) {
  return useQuery({
    queryKey: deliveryTypeKeys.detail(id),
    queryFn: () => batchDeliveryTypesApi.getDeliveryTypeById(id),
    enabled: !!id,
  });
}

export function useCreateBatchDeliveryType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBatchDeliveryTypeInput) =>
      batchDeliveryTypesApi.createDeliveryType(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryTypeKeys.lists() });
    },
  });
}

export function useUpdateBatchDeliveryType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBatchDeliveryTypeInput }) =>
      batchDeliveryTypesApi.updateDeliveryType(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deliveryTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryTypeKeys.detail(variables.id) });
    },
  });
}

export function useDeleteBatchDeliveryType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => batchDeliveryTypesApi.deleteDeliveryType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryTypeKeys.lists() });
    },
  });
}
