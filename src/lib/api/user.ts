import apiClient from './client';
import { ApiResponse, User } from '@/types';
import { CreateUserInput, UpdateUserInput } from '@/lib/schemas/user.schema';

export const userApi = {
  listUsers: (params?: { search?: string; roleId?: string; active?: boolean; page?: number; limit?: number }): Promise<ApiResponse<User[]>> => {
    return apiClient.get('/users', { params }) as unknown as Promise<ApiResponse<User[]>>;
  },

  createUser: (data: CreateUserInput): Promise<ApiResponse<User>> => {
    return apiClient.post('/users', data) as unknown as Promise<ApiResponse<User>>;
  },

  getUser: (id: string): Promise<ApiResponse<User>> => {
    return apiClient.get(`/users/${id}`) as unknown as Promise<ApiResponse<User>>;
  },

  updateUser: (id: string, data: UpdateUserInput): Promise<ApiResponse<User>> => {
    return apiClient.patch(`/users/${id}`, data) as unknown as Promise<ApiResponse<User>>;
  },

  deleteUser: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/users/${id}`) as unknown as Promise<ApiResponse<null>>;
  },
};
