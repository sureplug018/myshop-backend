import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import slugify from 'slugify';

import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

const prisma = new PrismaClient();

export const getAllCategories = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: {
        categories,
      },
    });
  }
);

export const createCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;

    const slug = slugify(name, { lower: true });

    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return next(new AppError('Category with this name already exists', 400));
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        category: newCategory,
      },
    });
  }
);

export const editCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!categoryId) return next(new AppError('Category ID is required', 400));

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) return next(new AppError('Category not found', 404));

    const slug = slugify(name, { lower: true });

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        slug,
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        category: updatedCategory,
      },
    });
  }
);

// export const getProductsByCategory = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { categoryId } = req.params;

//     const products = await prisma.product.findMany({
//       where: { categoryId },
//       include: {
//         category: true,
//         variations: {
//           include: {
//             variationOptions: true,
//           },
//         },
//       },
//     });

//     res.status(200).json({
//       status: 'success',
//       results: products.length,
//       data: {
//         products,
//       },
//     });
//   }
// );

// export const getProductsByCategory = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { categoryId } = req.params;

//     const products = await prisma.product.findMany({
//       where: { categoryId },
//       include: {
//         category: true,
//         variations: {
//           include: {
//             variationOptions: true,
//           },
//         },
//       },
//     });

//     res.status(200).json({
//       status: 'success',
//       results: products.length,
//       data: {
//         products,
//       },
//     });
//   }
// );
