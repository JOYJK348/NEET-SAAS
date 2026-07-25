import { api } from '@/lib/api';
import type {
  TutorBatchListResponseDto,
  TutorBatchStudentsResponseDto,
} from '@/features/tutor-dashboard/types/batches';

/**
 * Fetches the tutor's assigned batches.
 * Backend resolves the authenticated tutor from JWT.
 * GET /tutor-dashboard/batches
 */
export const batchesService = {
  getBatches(): Promise<TutorBatchListResponseDto> {
    return api.get<TutorBatchListResponseDto>('/tutor-dashboard/batches');
  },

  /**
   * Fetches students for a specific batch.
   * Backend verifies the tutor is actually assigned to this batch.
   * GET /tutor-dashboard/batches/:batchId/students
   */
  getBatchStudents(batchId: string): Promise<TutorBatchStudentsResponseDto> {
    return api.get<TutorBatchStudentsResponseDto>(`/tutor-dashboard/batches/${batchId}/students`);
  },
};

export const batchKeys = {
  all: ['tutor-batches'] as const,
  list: () => [...batchKeys.all, 'list'] as const,
  detail: (batchId: string) => [...batchKeys.all, 'detail', batchId] as const,
};

