import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

const prisma = new PrismaClient();

export const getAllShippingAddresses = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const addresses = await prisma.shippingAddress.findMany({
      skip,
      take: limit,
    });

    // Total count for pagination meta
    const total = await prisma.shippingAddress.count();
    res.status(200).json({
      status: 'success',
      results: addresses.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: {
        shippingAddresses: addresses,
      },
    });
  }
);

export const createShippingAddress = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    const { address, city, state, zipCode, country } = req.body;

    const existingAddress = await prisma.shippingAddress.findUnique({
      where: { userId: userId! },
    });

    if (existingAddress)
      return next(new AppError('User already has a shipping address', 400));

    const newAddress = await prisma.shippingAddress.create({
      data: {
        userId: userId!,
        address,
        city,
        state,
        zipCode,
        country,
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        shippingAddress: newAddress,
      },
    });
  }
);

export const getUserShippingAddress = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    const addresses = await prisma.shippingAddress.findUnique({
      where: { userId: userId! },
    });

    if (!addresses) {
      return next(
        new AppError('No shipping addresses found for this user', 404)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        shippingAddresses: addresses,
      },
    });
  }
);

export const deleteShippingAddress = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const addressId = req.params.id;

    const address = await prisma.shippingAddress.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      return next(
        new AppError(
          'No shipping address found with that ID for this user',
          404
        )
      );
    }

    await prisma.shippingAddress.delete({
      where: { id: addressId },
    });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);

export const updateShippingAddress = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const addressId = req.params.id;
    const { address, city, state, zipCode, country } = req.body;

    const existingAddress = await prisma.shippingAddress.findUnique({
      where: { id: addressId },
    });

    if (!existingAddress || existingAddress.userId !== userId) {
      return next(
        new AppError(
          'No shipping address found with that ID for this user',
          404
        )
      );
    }

    const data: any = {};

    if (address) data.address = address;
    if (city) data.city = city;
    if (state) data.state = state;
    if (zipCode) data.zipCode = zipCode;
    if (country) data.country = country;

    const updatedAddress = await prisma.shippingAddress.update({
      where: { id: addressId },
      data,
    });

    res.status(200).json({
      status: 'success',
      data: {
        shippingAddress: updatedAddress,
      },
    });
  }
);
