import apiClient from './client';
import { ApiResponse, Brand } from '@/types';
import { CreateBrandInput, UpdateBrandInput } from '@/lib/schemas/brand.schema';

export const brandApi = {
  listBrands: (params?: {
    search?: string;
    status?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Brand[]>> => {
    return apiClient.get('/brands', { params }) as unknown as Promise<ApiResponse<Brand[]>>;
  },

  createBrand: (data: CreateBrandInput): Promise<ApiResponse<Brand>> => {
    return apiClient.post('/brands', data) as unknown as Promise<ApiResponse<Brand>>;
  },

  getBrand: (id: string): Promise<ApiResponse<Brand>> => {
    return apiClient.get(`/brands/${id}`) as unknown as Promise<ApiResponse<Brand>>;
  },

  updateBrand: (id: string, data: UpdateBrandInput): Promise<ApiResponse<Brand>> => {
    return apiClient.patch(`/brands/${id}`, data) as unknown as Promise<ApiResponse<Brand>>;
  },

  deleteBrand: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/brands/${id}`) as unknown as Promise<ApiResponse<null>>;
  },
};
