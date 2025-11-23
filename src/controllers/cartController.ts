import { PrismaClient } from '@prisma/client';

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

const prisma = new PrismaClient();

export const getUserCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

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
    const userId = req.user?.id;
    const { productId, quantity } = req.body;

    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: userId! },
      });
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
      include: {
        product: true,
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
    const userId = req.user?.id;
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
    const userId = req.user?.id;
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
