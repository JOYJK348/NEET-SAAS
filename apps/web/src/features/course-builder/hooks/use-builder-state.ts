'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { BuilderSelection } from '../types';

export function useBuilderState(_courseId?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedTopicId = searchParams.get('topicId') || null;
  const selectedChapterId = searchParams.get('chapterId') || null;
  const selectedTopicItemId = searchParams.get('itemId') || null;

  const selection: BuilderSelection = {
    type: selectedTopicItemId
      ? 'topic-item'
      : selectedChapterId
        ? 'chapter'
        : selectedTopicId
          ? 'topic'
          : null,
    id: selectedTopicItemId || selectedChapterId || selectedTopicId || null,
  };

  const updateParams = useCallback(
    (params: Record<string, string | null>) => {
      const sp = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(params)) {
        if (value === null) sp.delete(key);
        else sp.set(key, value);
      }
      const qs = sp.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, searchParams, pathname],
  );

  const selectTopic = useCallback(
    (topicId: string) => {
      updateParams({ topicId, chapterId: null, itemId: null });
    },
    [updateParams],
  );

  const selectChapter = useCallback(
    (chapterId: string) => {
      updateParams({ chapterId, topicId: null, itemId: null });
    },
    [updateParams],
  );

  const selectTopicItem = useCallback(
    (itemId: string) => {
      updateParams({ itemId, topicId: null, chapterId: null });
    },
    [updateParams],
  );

  const selectEntity = useCallback(
    (type: 'topic' | 'chapter' | 'topic-item', id: string) => {
      if (type === 'topic') selectTopic(id);
      else if (type === 'chapter') selectChapter(id);
      else if (type === 'topic-item') selectTopicItem(id);
    },
    [selectTopic, selectChapter, selectTopicItem],
  );

  const clearSelection = useCallback(() => {
    updateParams({ topicId: null, chapterId: null, itemId: null });
  }, [updateParams]);

  return {
    selectedTopicId,
    selectedChapterId,
    selectedTopicItemId,
    selection,
    selectTopic,
    selectChapter,
    selectTopicItem,
    selectEntity,
    clearSelection,
  };
}
