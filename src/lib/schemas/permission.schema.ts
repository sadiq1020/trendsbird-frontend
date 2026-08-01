import { z } from 'zod';

export const STANDARD_ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'watch',
  'upload',
  'write',
  'approve',
  'status',
] as const;

export const createPermissionGroupSchema = z.object({
  name: z.string().trim().min(2, 'Group name must be at least 2 characters').max(50),
  description: z.string().trim().max(255).optional(),
  actions: z.array(z.string()),
  customActions: z.array(z.string()),
});

export const updatePermissionGroupSchema = z.object({
  name: z.string().trim().min(2, 'Group name must be at least 2 characters').max(50).optional(),
  description: z.string().trim().max(255).optional(),
});

export const addActionsSchema = z.object({
  actions: z.array(z.string()),
  customActions: z.array(z.string()),
});

export type CreatePermissionGroupInput = z.infer<typeof createPermissionGroupSchema>;
export type UpdatePermissionGroupInput = z.infer<typeof updatePermissionGroupSchema>;
export type AddActionsInput = z.infer<typeof addActionsSchema>;
