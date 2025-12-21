import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { generateIdempotencyKey } from '../utils/idempotency';
import { emailQueue } from '../queues';

const prisma = new PrismaClient();

export const placeOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { cartId } = req.params;
    const { addressId } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] as string; // From header

    // Idempotency key handling
    const action = 'orderPlacement';
    const { fullKey, expiresAt, cachedResponse } = await generateIdempotencyKey(
      action,
      userId,
      idempotencyKey
    );

    // 🚀 If cached, return immediately (this prevents duplicate responses)
    if (cachedResponse) {
      return res.status(cachedResponse.status).json(cachedResponse.data);
    }

    const cart = await prisma.cart.findUnique({
      where: { id: cartId, userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return next(new AppError('Cart is empty or not found', 400));
    }

    const address = await prisma.shippingAddress.findUnique({
      where: { id: addressId, userId },
    });

    if (!address) {
      return next(new AppError('Address not found', 404));
    }

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount: cart.items.reduce(
          (sum, item) => sum + Number(item.product.price) * item.quantity,
          0
        ),
        status: 'pending',
        addressId,
      },
      include: { items: true },
    });

    for (const item of cart.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        },
      });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // send email to user and admin for the order placement
    const subject = 'Your Order is Being Processed';
    // const url = { link: `${req.protocol}://${req.get('host')}` };

    const user = req.user!;

    // offloading the process to a queue
    await emailQueue.add(
      'send-new-order-email',
      {
        user: {
          email: user.email,
          firstName: user.firstName,
        },
        type: 'newOrder',
        subject,
        data: order,
      },
      {
        priority: 10,
        attempts: 3,
      }
    );

    const responseData = {
      status: 'success',
      data: { order },
    };

    // 2. Store idempotency record
    await prisma.idempotency.upsert({
      where: { key: fullKey },
      update: {
        result: JSON.stringify({ status: 201, data: responseData }),
        expiresAt,
      },
      create: {
        key: fullKey,
        userId,
        action,
        result: JSON.stringify({ status: 201, data: responseData }),
        expiresAt,
      },
    });

    res.status(201).json(responseData);
  }
);

export const getOrderDetails = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId, userId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        order,
      },
    });
  }
);

export const getUserOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: {
        orders,
      },
    });
  }
);

// export const cancelOrder = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const userId = req.user!.id;
//     const { orderId } = req.params;

//     const order = await prisma.order.findUnique({
//       where: { id: orderId, userId },
//     });

//     if (!order) {
//       return next(new AppError('Order not found', 404));
//     }

//     if (order.status !== 'PENDING') {
//       return next(new AppError('Only pending orders can be cancelled', 400));
//     }

//     const updatedOrder = await prisma.order.update({
//       where: { id: orderId },
//       data: { status: 'CANCELLED' },
//     });

//     res.status(200).json({
//       status: 'success',
//       data: {
//         order: updatedOrder,
//       },
//     });
//   }
// );

export const getAllOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const orders = await prisma.order.findMany({
      include: { items: true, user: true },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: {
        orders,
      },
    });
  }
);

// here you can change order status to SHIPPED, DELIVERED and CANCELED.
export const updateOrderStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    let updatedOrder: any;

    if (order.status === 'pending' && status === 'canceled') {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status },
      });
      // send cancellation email to user and admin
      const subject = 'Your Order Has Been Canceled';
      // const url = { link: `${req.protocol}://${req.get('host')}` };

      const user = req.user!;

      // offloading the process to a queue
      await emailQueue.add(
        'send-pending-order-email',
        {
          user: {
            email: user.email,
            firstName: user.firstName,
          },
          type: 'orderStatus',
          subject,
          data: order,
        },
        {
          priority: 10,
          attempts: 3,
        }
      );
    } else if (order.status === 'shipped' && status === 'delivered') {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status },
      });
      // send delivery email to user
      const subject = 'Your Order Has Been Delivered';
      // const url = { link: `${req.protocol}://${req.get('host')}` };

      const user = req.user!;

      // offloading the process to a queue
      await emailQueue.add(
        'send-delivered-order-email',
        {
          user: {
            email: user.email,
            firstName: user.firstName,
          },
          type: 'orderStatus',
          subject,
          data: order,
        },
        {
          priority: 10,
          attempts: 3,
        }
      );
    } else if (order.status === 'pending' && status === 'shipped') {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status },
      });
      // send shipping email to user
      const subject = 'Your Order Has Been Shipped';
      // const url = { link: `${req.protocol}://${req.get('host')}` };

      const user = req.user!;

      // offloading the process to a queue
      await emailQueue.add(
        'send-shipped-order-email',
        {
          user: {
            email: user.email,
            firstName: user.firstName,
          },
          type: 'orderStatus',
          subject,
          data: order,
        },
        {
          priority: 10,
          attempts: 3,
        }
      );
    } else {
      return next(new AppError('Invalid status transition', 400));
    }

    res.status(200).json({
      status: 'success',
      data: {
        order: updatedOrder,
      },
    });
  }
);
