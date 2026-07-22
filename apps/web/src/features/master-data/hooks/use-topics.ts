import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FilterParams } from '@/types/api';
import { topicsApi } from '../api/topics.api';
export { topicsApi };
import type { CreateTopicInput, UpdateTopicInput } from '../types';

export const topicKeys = {
  all: ['master', 'topics'] as const,
  lists: () => [...topicKeys.all, 'list'] as const,
  list: (params?: FilterParams & { chapterId?: string }) => [...topicKeys.lists(), params] as const,
  details: () => [...topicKeys.all, 'detail'] as const,
  detail: (id: string) => [...topicKeys.details(), id] as const,
};

export function useTopics(params?: FilterParams & { chapterId?: string }) {
  return useQuery({
    queryKey: topicKeys.list(params),
    queryFn: () => topicsApi.getTopics(params),
    enabled: !!params?.chapterId,
  });
}

export function useTopic(id: string) {
  return useQuery({
    queryKey: topicKeys.detail(id),
    queryFn: () => topicsApi.getTopicById(id),
    enabled: !!id,
  });
}

export function useCreateTopic(chapterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTopicInput) => topicsApi.createTopic(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topicKeys.list({ chapterId }) });
    },
  });
}

export function useUpdateTopic(chapterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTopicInput }) =>
      topicsApi.updateTopic(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.list({ chapterId }) });
      queryClient.invalidateQueries({ queryKey: topicKeys.detail(variables.id) });
    },
  });
}

export function useDeleteTopic(chapterId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => topicsApi.deleteTopic(id),
    onSuccess: () => {
      if (chapterId) {
        queryClient.invalidateQueries({ queryKey: topicKeys.list({ chapterId }) });
      }
      queryClient.invalidateQueries({ queryKey: ['master', 'course-subjects'] });
    },
  });
}
