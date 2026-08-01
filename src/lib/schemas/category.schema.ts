import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(100),
  slug: z.string().trim().optional(),
  description: z.string().trim().max(255).optional(),
  parentId: z.string().uuid('Invalid parent category ID').nullable().optional(),
  image: z.string().trim().optional(),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(100).optional(),
  slug: z.string().trim().optional(),
  description: z.string().trim().max(255).optional(),
  parentId: z.string().uuid('Invalid parent category ID').nullable().optional(),
  image: z.string().trim().optional(),
  active: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
