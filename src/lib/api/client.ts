import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Authorization Bearer token header if available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('trendsbird_access_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let refreshPromise: Promise<any> | null = null;

apiClient.interceptors.response.use(
  (response) => {
    // If login or refresh response returned tokens in JSON payload, save them to localStorage
    const data = response.data?.data;
    if (data?.accessToken) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('trendsbird_access_token', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('trendsbird_refresh_token', data.refreshToken);
        }
      }
    }
    return response.data;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        const storedRefreshToken =
          typeof window !== 'undefined'
            ? localStorage.getItem('trendsbird_refresh_token')
            : null;

        refreshPromise = apiClient
          .post('/auth/refresh', storedRefreshToken ? { refreshToken: storedRefreshToken } : {})
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        const refreshRes: any = await refreshPromise;
        const newAccessToken = refreshRes?.data?.accessToken;
        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('trendsbird_access_token');
          localStorage.removeItem('trendsbird_refresh_token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    const apiError = error.response?.data;
    if (apiError) {
      return Promise.reject(apiError);
    }

    return Promise.reject({
      success: false,
      message: error.message || 'An unexpected network error occurred',
      error: { code: 'NETWORK_ERROR' },
    });
  }
);

export default apiClient;
