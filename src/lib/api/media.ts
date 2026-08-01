import apiClient from './client';
import { ApiResponse, Media, MediaType } from '@/types';

export const mediaApi = {
  listMedia: (params?: {
    search?: string;
    type?: MediaType;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Media[]>> => {
    return apiClient.get('/media', { params }) as unknown as Promise<ApiResponse<Media[]>>;
  },

  uploadFiles: (
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<ApiResponse<Media | Media[]>> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    return apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    }) as unknown as Promise<ApiResponse<Media | Media[]>>;
  },

  getMedia: (id: string): Promise<ApiResponse<Media>> => {
    return apiClient.get(`/media/${id}`) as unknown as Promise<ApiResponse<Media>>;
  },

  updateMediaMeta: (
    id: string,
    data: { altText?: string; title?: string }
  ): Promise<ApiResponse<Media>> => {
    return apiClient.patch(`/media/${id}`, data) as unknown as Promise<ApiResponse<Media>>;
  },

  deleteMedia: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/media/${id}`) as unknown as Promise<ApiResponse<null>>;
  },
};
