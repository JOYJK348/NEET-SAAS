import { api } from '@/lib/api';
import type { PaginatedResponse, FilterParams } from '@/types/api';
import type {
  BatchDeliveryType,
  CreateBatchDeliveryTypeInput,
  UpdateBatchDeliveryTypeInput,
} from '../types';

export const batchDeliveryTypesApi = {
  async getDeliveryTypes(params?: FilterParams): Promise<PaginatedResponse<BatchDeliveryType>> {
    return api.get<PaginatedResponse<BatchDeliveryType>>('/master/batch-delivery-types', {
      params,
    });
  },

  async getDeliveryTypeById(id: string): Promise<BatchDeliveryType> {
    return api.get<BatchDeliveryType>(`/master/batch-delivery-types/${id}`);
  },

  async createDeliveryType(input: CreateBatchDeliveryTypeInput): Promise<BatchDeliveryType> {
    return api.post<BatchDeliveryType>('/master/batch-delivery-types', input);
  },

  async updateDeliveryType(
    id: string,
    input: UpdateBatchDeliveryTypeInput,
  ): Promise<BatchDeliveryType> {
    const { code, ...updatePayload } = input;
    return api.patch<BatchDeliveryType>(`/master/batch-delivery-types/${id}`, updatePayload);
  },

  async deleteDeliveryType(id: string): Promise<void> {
    return api.delete<void>(`/master/batch-delivery-types/${id}`);
  },
};
