import apiClient from './client';
import { ApiResponse, Category, CategoryTreeNode } from '@/types';
import { CreateCategoryInput, UpdateCategoryInput } from '@/lib/schemas/category.schema';

export const categoryApi = {
  listCategories: (params?: {
    search?: string;
    active?: boolean;
    parentId?: string | null;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Category[]>> => {
    return apiClient.get('/categories', { params }) as unknown as Promise<ApiResponse<Category[]>>;
  },

  getCategoryTree: (): Promise<ApiResponse<CategoryTreeNode[]>> => {
    return apiClient.get('/categories/tree') as unknown as Promise<ApiResponse<CategoryTreeNode[]>>;
  },

  createCategory: (data: CreateCategoryInput): Promise<ApiResponse<Category>> => {
    return apiClient.post('/categories', data) as unknown as Promise<ApiResponse<Category>>;
  },

  getCategory: (id: string): Promise<ApiResponse<Category>> => {
    return apiClient.get(`/categories/${id}`) as unknown as Promise<ApiResponse<Category>>;
  },

  updateCategory: (id: string, data: UpdateCategoryInput): Promise<ApiResponse<Category>> => {
    return apiClient.patch(`/categories/${id}`, data) as unknown as Promise<ApiResponse<Category>>;
  },

  deleteCategory: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/categories/${id}`) as unknown as Promise<ApiResponse<null>>;
  },
};
