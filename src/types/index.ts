export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
  error?: {
    code: string;
    details?: any;
  };
}

export interface PermissionAction {
  id: string;
  name: string;
  groupId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description?: string | null;
  permissions: PermissionAction[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  status: boolean;
  userCount?: number;
  permissions?: PermissionAction[];
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  phone?: string | null;
  gender?: string | null;
  active: boolean;
  roleId: string;
  role?: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionResponse {
  user: User;
  role: Role | string;
  permissions: string[];
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
