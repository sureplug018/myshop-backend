import { z } from 'zod';

export const placeOrderSchema = z.object({
  params: z.object({
    cartId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        'Invalid cart ID'
      ),
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
