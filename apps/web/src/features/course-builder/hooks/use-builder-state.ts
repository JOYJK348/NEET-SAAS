'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { BuilderSelection } from '../types';

export function useBuilderState(courseId: string) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedTopicId = searchParams.get('topicId') || null;

  const selection: BuilderSelection = {
    type: selectedTopicId ? 'topic' : null,
    id: selectedTopicId,
  };

  const selectTopic = useCallback(
    (topicId: string) => {
      const params = new URLSearchParams(searchParams);
      params.set('topicId', topicId);
      router.push(`/tenant-admin/courses/${courseId}/builder?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams, courseId],
  );

  const clearSelection = useCallback(() => {
    router.push(`/tenant-admin/courses/${courseId}/builder`, { scroll: false });
  }, [router, courseId]);

  return {
    selectedTopicId,
    selection,
    selectTopic,
    clearSelection,
  };
}
