import { z } from 'zod';

export const attributeTypeEnum = z.enum([
  'DROPDOWN',
  'RADIO',
  'CHECKBOX',
  'COLOR_SWATCH',
  'IMAGE_SWATCH',
]);

export const attributeValueItemSchema = z.object({
  value: z.string().trim().min(1, 'Attribute value cannot be empty').max(100),
  slug: z.string().trim().optional(),
  referenceValue: z.string().trim().optional(),
});

export const createAttributeSchema = z.object({
  name: z.string().trim().min(1, 'Attribute name is required').max(100),
  slug: z.string().trim().optional(),
  type: attributeTypeEnum,
  values: z.array(attributeValueItemSchema).optional().default([]),
});

export const updateAttributeSchema = z.object({
  name: z.string().trim().min(1, 'Attribute name is required').max(100).optional(),
  slug: z.string().trim().optional(),
  type: attributeTypeEnum.optional(),
});

export const addAttributeValuesSchema = z.object({
  values: z.array(attributeValueItemSchema).min(1, 'Provide at least one attribute value to add'),
});

export const updateAttributeValueSchema = z.object({
  value: z.string().trim().min(1, 'Attribute value cannot be empty').max(100).optional(),
  slug: z.string().trim().optional(),
  referenceValue: z.string().trim().optional(),
});

export type AttributeValueItemInput = z.infer<typeof attributeValueItemSchema>;
export type CreateAttributeInput = z.infer<typeof createAttributeSchema>;
export type UpdateAttributeInput = z.infer<typeof updateAttributeSchema>;
export type AddAttributeValuesInput = z.infer<typeof addAttributeValuesSchema>;
export type UpdateAttributeValueInput = z.infer<typeof updateAttributeValueSchema>;
