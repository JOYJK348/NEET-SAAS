import { api } from '@/lib/api';
import type {
  TopicItem,
  CreateTopicItemPayload,
  UpdateTopicItemPayload,
  ReorderPayload,
} from '../types';

export function getTopicItems(topicId: string): Promise<TopicItem[]> {
  return api.get(`/learning/topic-items?topicId=${topicId}`);
}

export function getTopicItem(id: string): Promise<TopicItem> {
  return api.get(`/learning/topic-items/${id}`);
}

export function createTopicItem(payload: CreateTopicItemPayload): Promise<TopicItem> {
  return api.post('/learning/topic-items', payload);
}

export function updateTopicItem(id: string, payload: UpdateTopicItemPayload): Promise<TopicItem> {
  return api.patch(`/learning/topic-items/${id}`, payload);
}

export function deleteTopicItem(id: string): Promise<void> {
  return api.delete(`/learning/topic-items/${id}`);
}

export function reorderTopicItems(topicId: string, payload: ReorderPayload): Promise<void> {
  return api.post('/learning/topic-items/reorder', {
    topicId,
    items: payload.items,
  });
}
