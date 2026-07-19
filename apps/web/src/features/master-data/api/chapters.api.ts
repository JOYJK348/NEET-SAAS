import { api } from '@/lib/api';
import type { PaginatedResponse, FilterParams } from '@/types/api';
import type { Chapter, CreateChapterInput, UpdateChapterInput } from '../types';

export const chaptersApi = {
  async getChapters(
    params?: FilterParams & { courseSubjectId?: string },
  ): Promise<PaginatedResponse<Chapter>> {
    return api.get<PaginatedResponse<Chapter>>('/master/chapters', { params });
  },

  async getChapterById(id: string): Promise<Chapter> {
    return api.get<Chapter>(`/master/chapters/${id}`);
  },

  async createChapter(input: CreateChapterInput): Promise<Chapter> {
    return api.post<Chapter>('/master/chapters', input);
  },

  async updateChapter(id: string, input: UpdateChapterInput): Promise<Chapter> {
    const { code, ...updatePayload } = input;
    return api.patch<Chapter>(`/master/chapters/${id}`, updatePayload);
  },

  async deleteChapter(id: string): Promise<void> {
    return api.delete<void>(`/master/chapters/${id}`);
  },
};
