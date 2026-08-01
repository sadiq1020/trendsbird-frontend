import { create } from 'zustand';
import { Role, User } from '@/types';
import { authApi } from '@/lib/api/auth';

interface SessionState {
  user: User | null;
  role: Role | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;

  setSession: (user: User, role: Role | string, permissions: string[]) => void;
  clearSession: () => void;
  fetchSession: () => Promise<boolean>;
}

const normalizeRole = (roleData: Role | string | undefined | null): Role | null => {
  if (!roleData) return null;
  if (typeof roleData === 'string') {
    return { id: 'session-role', name: roleData, status: true };
  }
  return roleData;
};

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  role: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: true,

  setSession: (user, role, permissions) =>
    set({
      user,
      role: normalizeRole(role),
      permissions,
      isAuthenticated: true,
      isLoading: false,
    }),

  clearSession: () =>
    set({
      user: null,
      role: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
    }),

  fetchSession: async () => {
    set({ isLoading: true });
    try {
      const response = await authApi.getSession();
      if (response.success && response.data) {
        set({
          user: response.data.user,
          role: normalizeRole(response.data.role),
          permissions: response.data.permissions || [],
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
      set({
        user: null,
        role: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    } catch {
      set({
        user: null,
        role: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    }
  },
}));
