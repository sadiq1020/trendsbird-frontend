import { z } from 'zod';

export const mediaAttachmentInputSchema = z.object({
  mediaId: z.string().uuid('Invalid media ID'),
  isThumbnail: z.boolean().optional().default(false),
  isGallery: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const variantInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    sku: z.string().trim().min(1, 'Variant SKU is required'),
    price: z.coerce.number().min(0, 'Price cannot be negative'),
    salePrice: z.coerce.number().min(0, 'Sale price cannot be negative').nullable().optional(),
    stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
    lowStockThreshold: z.coerce.number().int().min(0).optional(),
    weight: z.coerce.number().min(0).optional(),
    active: z.boolean().optional().default(true),
    attributeValueIds: z
      .array(z.string().uuid('Invalid attribute value ID'))
      .min(1, 'Variant must have at least one attribute value'),
    media: z.array(mediaAttachmentInputSchema).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.salePrice !== undefined && data.salePrice !== null) {
        return data.salePrice <= data.price;
      }
      return true;
    },
    {
      message: 'Sale price cannot exceed regular price',
      path: ['salePrice'],
    }
  );

export const baseProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(200),
  slug: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  longDescription: z.string().trim().optional(),
  brandId: z.string().uuid('Invalid brand ID').nullable().optional(),
  categoryIds: z.array(z.string().uuid('Invalid category ID')).optional().default([]),
  media: z.array(mediaAttachmentInputSchema).optional().default([]),
  weight: z.coerce.number().min(0).optional(),
  active: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export const simpleProductCreateSchema = baseProductSchema.extend({
  hasVariants: z.literal(false),
  sku: z.string().trim().min(1, 'SKU is required for products without variants'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  salePrice: z.coerce.number().min(0, 'Sale price cannot be negative').nullable().optional(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
});

export const variableProductCreateSchema = baseProductSchema.extend({
  hasVariants: z.literal(true),
  variants: z
    .array(variantInputSchema)
    .min(1, 'A variable product must contain at least one variant'),
});

export const createProductSchema = z
  .discriminatedUnion('hasVariants', [simpleProductCreateSchema, variableProductCreateSchema])
  .refine(
    (data) => {
      if (!data.hasVariants && data.salePrice !== undefined && data.salePrice !== null) {
        return data.salePrice <= data.price;
      }
      return true;
    },
    {
      message: 'Sale price cannot exceed regular price',
      path: ['salePrice'],
    }
  );

export const updateProductSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  slug: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  longDescription: z.string().trim().optional(),
  brandId: z.string().uuid().nullable().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  media: z.array(mediaAttachmentInputSchema).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  sku: z.string().trim().optional(),
  price: z.coerce.number().min(0).optional(),
  salePrice: z.coerce.number().min(0).nullable().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  variants: z.array(variantInputSchema).optional(),
});

export type MediaAttachmentInput = z.infer<typeof mediaAttachmentInputSchema>;
export type VariantInput = z.infer<typeof variantInputSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
