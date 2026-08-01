import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().trim().min(2, 'Role name must be at least 2 characters').max(50),
  description: z.string().trim().max(255).optional(),
  status: z.boolean(),
  permissionIds: z.array(z.string()),
  grantAll: z.boolean().optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2, 'Role name must be at least 2 characters').max(50).optional(),
  description: z.string().trim().max(255).optional(),
  status: z.boolean().optional(),
  permissionIds: z.array(z.string()).optional(),
  grantAll: z.boolean().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
