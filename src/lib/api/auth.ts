import apiClient from './client';
import { ApiResponse, LoginResponse, SessionResponse } from '@/types';
import { LoginInput } from '@/lib/schemas/auth.schema';

export const authApi = {
  login: (data: LoginInput): Promise<ApiResponse<LoginResponse>> => {
    return apiClient.post('/auth/login', data) as unknown as Promise<ApiResponse<LoginResponse>>;
  },

  logout: (): Promise<ApiResponse<null>> => {
    return apiClient.post('/auth/logout') as unknown as Promise<ApiResponse<null>>;
  },

  getSession: (): Promise<ApiResponse<SessionResponse>> => {
    return apiClient.get('/auth/session') as unknown as Promise<ApiResponse<SessionResponse>>;
  },

  refresh: (): Promise<ApiResponse<any>> => {
    return apiClient.post('/auth/refresh') as unknown as Promise<ApiResponse<any>>;
  },
};
