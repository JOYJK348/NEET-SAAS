import { api } from '@/lib/api';
import type { PaginatedResponse, FilterParams } from '@/types/api';
import type { Topic, CreateTopicInput, UpdateTopicInput } from '../types';

export const topicsApi = {
  async getTopics(
    params?: FilterParams & { chapterId?: string },
  ): Promise<PaginatedResponse<Topic>> {
    return api.get<PaginatedResponse<Topic>>('/master/topics', { params });
  },

  async getTopicById(id: string): Promise<Topic> {
    return api.get<Topic>(`/master/topics/${id}`);
  },

  async createTopic(input: CreateTopicInput): Promise<Topic> {
    return api.post<Topic>('/master/topics', input);
  },

  async updateTopic(id: string, input: UpdateTopicInput): Promise<Topic> {
    const { code, ...updatePayload } = input;
    return api.patch<Topic>(`/master/topics/${id}`, updatePayload);
  },

  async deleteTopic(id: string): Promise<void> {
    return api.delete<void>(`/master/topics/${id}`);
  },
};
