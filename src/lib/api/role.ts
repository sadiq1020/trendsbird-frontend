import apiClient from './client';
import { ApiResponse, Role } from '@/types';
import { CreateRoleInput, UpdateRoleInput } from '@/lib/schemas/role.schema';

export const roleApi = {
  listRoles: (params?: { search?: string; status?: boolean; page?: number; limit?: number }): Promise<ApiResponse<Role[]>> => {
    return apiClient.get('/roles', { params }) as unknown as Promise<ApiResponse<Role[]>>;
  },

  createRole: (data: CreateRoleInput): Promise<ApiResponse<Role>> => {
    return apiClient.post('/roles', data) as unknown as Promise<ApiResponse<Role>>;
  },

  getRole: (id: string): Promise<ApiResponse<Role>> => {
    return apiClient.get(`/roles/${id}`) as unknown as Promise<ApiResponse<Role>>;
  },

  updateRole: (id: string, data: UpdateRoleInput): Promise<ApiResponse<Role>> => {
    return apiClient.patch(`/roles/${id}`, data) as unknown as Promise<ApiResponse<Role>>;
  },

  addPermissions: (id: string, permissionIds: string[]): Promise<ApiResponse<Role>> => {
    return apiClient.post(`/roles/${id}/permissions`, { permissionIds }) as unknown as Promise<ApiResponse<Role>>;
  },

  removePermission: (roleId: string, permissionId: string): Promise<ApiResponse<Role>> => {
    return apiClient.delete(`/roles/${roleId}/permissions/${permissionId}`) as unknown as Promise<ApiResponse<Role>>;
  },

  deleteRole: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/roles/${id}`) as unknown as Promise<ApiResponse<null>>;
  },
};
