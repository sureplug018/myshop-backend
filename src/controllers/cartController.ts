import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';
import { generateIdempotencyKey } from '../utils/idempotency';

const prisma = new PrismaClient();

export const getUserCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        cart,
      },
    });
  }
);

export const addItemToCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { productId, quantity } = req.body;

    const idempotencyKey = req.headers['idempotency-key'] as string;

    // Idempotency key handling
    const action = 'addToCart';
    const { fullKey, expiresAt } = await generateIdempotencyKey(
      action,
      userId,
      idempotencyKey,
      res
    );

    // 2. Ensure cart exists (idempotent via upsert)
    let cart = await prisma.cart.upsert({
      where: { userId },
      update: {}, // No-op if exists
      create: { userId },
    });

    // 3. Upsert cartItem (increments quantity if exists → inherent idempotency)
    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId: cart.id, productId }, // ✅ Composite unique index (add to schema.prisma if missing)
      },
      update: {
        quantity: { increment: quantity }, // ✅ Add to existing qty on retry
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
      },
      include: { product: true },
    });

    // 4. Build response
    const responseData = {
      status: 'success',
      data: { cartItem },
    };

    // 5. Store idempotency record (delete old if exists)
    await prisma.idempotency.upsert({
      where: { key: fullKey },
      update: {
        result: JSON.stringify({ status: 201, data: responseData }),
        expiresAt,
      },
      create: {
        key: fullKey,
        userId,
        action: 'addToCart',
        result: JSON.stringify({ status: 201, data: responseData }),
        expiresAt,
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        cartItem,
      },
    });
  }
);

export const removeItemFromCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { itemId } = req.params;

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      return next(new AppError('Cart item not found', 404));
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);

export const updateCartItemQuantity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      return next(new AppError('Cart item not found', 404));
    }

    const updatedCartItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        cartItem: updatedCartItem,
      },
    });
  }
);
