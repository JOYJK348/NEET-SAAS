'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderChapters, reorderTopics } from '../api/reorder.api';
import type { ReorderItem } from '../api/reorder.api';

export function useReorderChapters() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseSubjectId, items }: { courseSubjectId: string; items: ReorderItem[] }) =>
      reorderChapters(courseSubjectId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master', 'course-subjects'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['master', 'course-subjects'] });
    },
  });
}

export function useReorderTopics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chapterId, items }: { chapterId: string; items: ReorderItem[] }) =>
      reorderTopics(chapterId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master', 'course-subjects'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['master', 'course-subjects'] });
    },
  });
}
