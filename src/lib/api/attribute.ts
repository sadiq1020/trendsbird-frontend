import apiClient from './client';
import { ApiResponse, Attribute, AttributeType, AttributeValue } from '@/types';
import {
  CreateAttributeInput,
  UpdateAttributeInput,
  AttributeValueItemInput,
  UpdateAttributeValueInput,
} from '@/lib/schemas/attribute.schema';

export const attributeApi = {
  listAttributes: (params?: {
    search?: string;
    type?: AttributeType;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Attribute[]>> => {
    return apiClient.get('/attributes', { params }) as unknown as Promise<ApiResponse<Attribute[]>>;
  },

  createAttribute: (data: CreateAttributeInput): Promise<ApiResponse<Attribute>> => {
    return apiClient.post('/attributes', data) as unknown as Promise<ApiResponse<Attribute>>;
  },

  getAttribute: (id: string): Promise<ApiResponse<Attribute>> => {
    return apiClient.get(`/attributes/${id}`) as unknown as Promise<ApiResponse<Attribute>>;
  },

  updateAttribute: (id: string, data: UpdateAttributeInput): Promise<ApiResponse<Attribute>> => {
    return apiClient.patch(`/attributes/${id}`, data) as unknown as Promise<ApiResponse<Attribute>>;
  },

  addValues: (
    attributeId: string,
    values: AttributeValueItemInput[]
  ): Promise<ApiResponse<Attribute>> => {
    return apiClient.post(`/attributes/${attributeId}/values`, { values }) as unknown as Promise<ApiResponse<Attribute>>;
  },

  updateValue: (
    attributeId: string,
    valueId: string,
    data: UpdateAttributeValueInput
  ): Promise<ApiResponse<AttributeValue>> => {
    return apiClient.patch(`/attributes/${attributeId}/values/${valueId}`, data) as unknown as Promise<ApiResponse<AttributeValue>>;
  },

  deleteValue: (attributeId: string, valueId: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/attributes/${attributeId}/values/${valueId}`) as unknown as Promise<ApiResponse<null>>;
  },

  deleteAttribute: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/attributes/${id}`) as unknown as Promise<ApiResponse<null>>;
  },
};
