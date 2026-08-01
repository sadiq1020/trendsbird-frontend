import apiClient from './client';
import { ApiResponse, Product } from '@/types';
import { CreateProductInput, UpdateProductInput } from '@/lib/schemas/product.schema';

export const productApi = {
  listProducts: (params?: {
    search?: string;
    categoryId?: string;
    brandId?: string;
    active?: boolean;
    featured?: boolean;
    hasVariants?: boolean;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Product[]>> => {
    return apiClient.get('/products', { params }) as unknown as Promise<ApiResponse<Product[]>>;
  },

  createProduct: (data: CreateProductInput): Promise<ApiResponse<Product>> => {
    return apiClient.post('/products', data) as unknown as Promise<ApiResponse<Product>>;
  },

  getProduct: (id: string): Promise<ApiResponse<Product>> => {
    return apiClient.get(`/products/${id}`) as unknown as Promise<ApiResponse<Product>>;
  },

  updateProduct: (id: string, data: UpdateProductInput): Promise<ApiResponse<Product>> => {
    return apiClient.patch(`/products/${id}`, data) as unknown as Promise<ApiResponse<Product>>;
  },

  deleteProduct: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/products/${id}`) as unknown as Promise<ApiResponse<null>>;
  },
};
