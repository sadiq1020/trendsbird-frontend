import apiClient from './client';
import { ApiResponse, LoginResponse, SessionResponse } from '@/types';
import { LoginInput } from '@/lib/schemas/auth.schema';

export const authApi = {
  login: (data: LoginInput): Promise<ApiResponse<LoginResponse>> => {
    return apiClient.post('/auth/login', data) as unknown as Promise<ApiResponse<LoginResponse>>;
  },

  logout: (): Promise<ApiResponse<null>> => {
    if (typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('trendsbird_refresh_token');
      localStorage.removeItem('trendsbird_access_token');
      localStorage.removeItem('trendsbird_refresh_token');
      return apiClient.post('/auth/logout', { refreshToken }) as unknown as Promise<ApiResponse<null>>;
    }
    return apiClient.post('/auth/logout') as unknown as Promise<ApiResponse<null>>;
  },

  getSession: (): Promise<ApiResponse<SessionResponse>> => {
    return apiClient.get('/auth/session') as unknown as Promise<ApiResponse<SessionResponse>>;
  },

  refresh: (): Promise<ApiResponse<any>> => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('trendsbird_refresh_token') : null;
    return apiClient.post('/auth/refresh', refreshToken ? { refreshToken } : {}) as unknown as Promise<ApiResponse<any>>;
  },
};
