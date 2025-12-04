import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    productId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid product ID'
      ),
    quantity: z.preprocess(
      (val) => Number(val),
      z.number().min(1, 'Quantity must be at least 1')
    ),
    idempotencyKey: z.uuid('Invalid idempotency key').optional(),
  }),
});
