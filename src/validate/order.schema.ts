import { z } from 'zod';
import { he } from 'zod/v4/locales';

export const placeOrderSchema = z.object({
  params: z.object({
    cartId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid cart ID'
      ),
  }),
  body: z.object({
    addressId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid address ID'
      ),
  }),
  headers: z.object({
    'idempotency-key': z.uuid('Invalid idempotency key').optional(),
  }),
});

export const getOrderDetailsSchema = z.object({
  params: z.object({
    orderId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid order ID'
      ),
  }),
});

export const cancelOrderSchema = z.object({
  params: z.object({
    orderId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid order ID'
      ),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    orderId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid order ID'
      ),
  }),
  body: z.object({
    status: z.enum(['pending', 'shipped', 'delivered', 'canceled'], {
      message: 'Invalid order status',
    }),
  }),
});
