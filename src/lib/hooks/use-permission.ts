import { useSessionStore } from '@/lib/stores/session-store';

export function checkPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  if (!requiredPermission) return true;
  if (!userPermissions || userPermissions.length === 0) return false;

  if (userPermissions.includes('*:*') || userPermissions.includes('*')) {
    return true;
  }

  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  const [module] = requiredPermission.split(':');
  if (module && userPermissions.includes(`${module}:*`)) {
    return true;
  }

  return false;
}

interface UsePermissionOptions {
  requireAll?: boolean;
}

export function usePermission(
  permission: string | string[],
  options?: UsePermissionOptions
): boolean {
  const permissions = useSessionStore((state) => state.permissions);
  const requireAll = options?.requireAll ?? false;

  if (!permission) return true;

  if (Array.isArray(permission)) {
    if (permission.length === 0) return true;
    if (requireAll) {
      return permission.every((p) => checkPermission(permissions, p));
    }
    return permission.some((p) => checkPermission(permissions, p));
  }

  return checkPermission(permissions, permission);
}
