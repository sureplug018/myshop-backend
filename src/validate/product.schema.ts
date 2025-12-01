import { z } from 'zod';

export const getProductByIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid product ID'
      ),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(1).optional(),
    price: z.number().min(0, 'Price must be a positive number'),
    categoryId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid category ID'
      ),
    productStock: z.number().min(0).optional(),
    coverImage: z.url({ error: 'Cover image must be a valid URL' }),
    images: z
      .array(z.url({ error: 'Each image must be a valid URL' }))
      .optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid product ID'
      ),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    price: z.number().min(0).optional(),
    categoryId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid category ID'
      )
      .optional(),
    productStock: z.number().min(0).optional(),
    coverImage: z.url({ error: 'Cover image must be a valid URL' }).optional(),
    images: z
      .array(z.url({ error: 'Each image must be a valid URL' }))
      .optional(),
  }),
});

export const deleteProductSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid product ID'
      ),
  }),
});
