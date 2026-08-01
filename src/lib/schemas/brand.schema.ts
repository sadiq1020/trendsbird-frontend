import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().trim().min(1, 'Brand name is required').max(100),
  slug: z.string().trim().optional(),
  logo: z.string().trim().optional(),
  description: z.string().trim().max(255).optional(),
  status: z.boolean().default(true),
});

export const updateBrandSchema = z.object({
  name: z.string().trim().min(1, 'Brand name is required').max(100).optional(),
  slug: z.string().trim().optional(),
  logo: z.string().trim().optional(),
  description: z.string().trim().max(255).optional(),
  status: z.boolean().optional(),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
