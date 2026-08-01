import apiClient from './client';
import { ApiResponse, PermissionGroup } from '@/types';
import {
  CreatePermissionGroupInput,
  UpdatePermissionGroupInput,
  AddActionsInput,
} from '@/lib/schemas/permission.schema';

export const permissionApi = {
  listGroups: (params?: { search?: string; page?: number; limit?: number }): Promise<ApiResponse<PermissionGroup[]>> => {
    return apiClient.get('/permissions/groups', { params }) as unknown as Promise<ApiResponse<PermissionGroup[]>>;
  },

  createGroup: (data: CreatePermissionGroupInput): Promise<ApiResponse<PermissionGroup>> => {
    return apiClient.post('/permissions/groups', data) as unknown as Promise<ApiResponse<PermissionGroup>>;
  },

  getGroup: (id: string): Promise<ApiResponse<PermissionGroup>> => {
    return apiClient.get(`/permissions/groups/${id}`) as unknown as Promise<ApiResponse<PermissionGroup>>;
  },

  updateGroup: (id: string, data: UpdatePermissionGroupInput): Promise<ApiResponse<PermissionGroup>> => {
    return apiClient.patch(`/permissions/groups/${id}`, data) as unknown as Promise<ApiResponse<PermissionGroup>>;
  },

  addActions: (id: string, data: AddActionsInput): Promise<ApiResponse<PermissionGroup>> => {
    return apiClient.post(`/permissions/groups/${id}/actions`, data) as unknown as Promise<ApiResponse<PermissionGroup>>;
  },

  removeAction: (groupId: string, permissionId: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/permissions/groups/${groupId}/actions/${permissionId}`) as unknown as Promise<ApiResponse<null>>;
  },

  deleteGroup: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/permissions/groups/${id}`) as unknown as Promise<ApiResponse<null>>;
  },
};
