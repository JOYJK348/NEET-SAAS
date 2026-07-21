import { api } from '@/lib/api';

export interface ReorderItem {
  id: string;
  displayOrder: number;
}

export async function reorderChapters(
  courseSubjectId: string,
  items: ReorderItem[],
): Promise<void> {
  await api.post('/master/chapters/reorder', {
    courseSubjectId,
    items,
  });
}

export async function reorderTopics(chapterId: string, items: ReorderItem[]): Promise<void> {
  await api.post('/master/topics/reorder', {
    chapterId,
    items,
  });
}
