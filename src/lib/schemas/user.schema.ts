import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  roleId: z.string().min(1, 'Role selection is required'),
  phone: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  avatar: z.string().trim().optional(),
  active: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50).optional(),
  email: z.string().trim().email('Invalid email address').optional(),
  password: z.string().optional().refine((val) => !val || val.length >= 6, {
    message: 'Password must be at least 6 characters',
  }),
  roleId: z.string().optional(),
  phone: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  avatar: z.string().trim().optional(),
  active: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
