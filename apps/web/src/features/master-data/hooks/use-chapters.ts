import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FilterParams } from '@/types/api';
import { chaptersApi } from '../api/chapters.api';
export { chaptersApi };
import type { CreateChapterInput, UpdateChapterInput } from '../types';

export const chapterKeys = {
  all: ['master', 'chapters'] as const,
  lists: () => [...chapterKeys.all, 'list'] as const,
  list: (params?: FilterParams & { courseSubjectId?: string }) =>
    [...chapterKeys.lists(), params] as const,
  details: () => [...chapterKeys.all, 'detail'] as const,
  detail: (id: string) => [...chapterKeys.details(), id] as const,
};

export function useChapters(params?: FilterParams & { courseSubjectId?: string }) {
  return useQuery({
    queryKey: chapterKeys.list(params),
    queryFn: () => chaptersApi.getChapters(params),
    enabled: !!params?.courseSubjectId,
  });
}

export function useChapter(id: string) {
  return useQuery({
    queryKey: chapterKeys.detail(id),
    queryFn: () => chaptersApi.getChapterById(id),
    enabled: !!id,
  });
}

export function useCreateChapter(courseSubjectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChapterInput) => chaptersApi.createChapter(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.list({ courseSubjectId }) });
    },
  });
}

export function useUpdateChapter(courseSubjectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateChapterInput }) =>
      chaptersApi.updateChapter(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.list({ courseSubjectId }) });
      queryClient.invalidateQueries({ queryKey: chapterKeys.detail(variables.id) });
    },
  });
}

export function useDeleteChapter(courseSubjectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chaptersApi.deleteChapter(id),
    onSuccess: () => {
      if (courseSubjectId) {
        queryClient.invalidateQueries({ queryKey: chapterKeys.list({ courseSubjectId }) });
      }
      queryClient.invalidateQueries({ queryKey: ['master', 'course-subjects'] });
    },
  });
}
