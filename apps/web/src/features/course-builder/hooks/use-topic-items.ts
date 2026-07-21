'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTopicItems,
  createTopicItem,
  updateTopicItem,
  deleteTopicItem,
  reorderTopicItems,
} from '../api/topic-items.api';
import type { CreateTopicItemPayload, UpdateTopicItemPayload, ReorderPayload } from '../types';

export function useTopicItems(topicId: string | null) {
  return useQuery({
    queryKey: ['topic-items', topicId],
    queryFn: () => getTopicItems(topicId!),
    enabled: !!topicId,
  });
}

export function useCreateTopicItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTopicItemPayload) => createTopicItem(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['topic-items', data.topicId],
      });
    },
  });
}

export function useUpdateTopicItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTopicItemPayload }) =>
      updateTopicItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-items'] });
    },
  });
}

export function useDeleteTopicItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTopicItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-items'] });
    },
  });
}

export function useReorderTopicItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, payload }: { topicId: string; payload: ReorderPayload }) =>
      reorderTopicItems(topicId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-items'] });
    },
  });
}
