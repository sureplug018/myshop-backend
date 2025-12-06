import { Prisma, PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import slugify from 'slugify';

import { AppError } from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';

const prisma = new PrismaClient();

export const getAllProducts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Category filter
    const category = req.query.category as string | undefined;

    // Sorting options
    let orderBy: any = {};

    switch (req.query.sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;

      case 'price_desc':
        orderBy = { price: 'desc' };
        break;

      case 'name_asc':
        orderBy = { name: 'asc' };
        break;

      case 'name_desc':
        orderBy = { name: 'desc' };
        break;

      default:
        orderBy = { createdAt: 'desc' };
    }

    const where: any = {};
    if (category) where.category = { slug: category };

    // Query products
    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    });

    // Total count for pagination meta
    const total = await prisma.product.count({ where });

    res.status(200).json({
      status: 'success',
      results: products.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: {
        products,
      },
    });
  }
);

export const getProductById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const productId = req.params.id;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return next(new AppError('No product found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        product,
      },
    });
  }
);

// export const filterProductsByCategory = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const category = req.params.category;

//     const products = await prisma.product.findMany({
//       where: { category },
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

// export const searchProductsByName = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const nameQuery = req.query.name as string;

//     const products = await prisma.product.findMany({
//       where: {
//         name: {
//           contains: nameQuery,
//           mode: 'insensitive',
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

// export const filterProductsByPriceRange = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const minPrice = parseFloat(req.query.min as string) || 0;
//     const maxPrice =
//       parseFloat(req.query.max as string) || Number.MAX_SAFE_INTEGER;

//     const products = await prisma.product.findMany({
//       where: {
//         price: {
//           gte: minPrice,
//           lte: maxPrice,
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

export const createProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      name,
      description,
      price,
      categoryId,
      productStock,
      coverImage,
      images,
    } = req.body;

    if (!price) {
      return next(new AppError('Price is required', 400));
    }

    // Clean price (remove commas, symbols)
    const cleanPrice = String(price).replace(/[^0-9.]/g, '');

    if (isNaN(Number(cleanPrice))) {
      return next(new AppError('Invalid price format', 400));
    }

    const slug = slugify(name, { lower: true });

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price: new Prisma.Decimal(cleanPrice),
        slug,
        categoryId,
        productStock,
        coverImage,
        images,
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        product: newProduct,
      },
    });
  }
);

export const updateProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const productId = req.params.id;

    if (!productId) return next(new AppError('Product ID is required', 400));

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) return next(new AppError('Product not found', 404));

    const {
      name,
      description,
      price,
      categoryId,
      productStock,
      coverImage,
      images,
    } = req.body;

    const data: any = {};

    const cleanPrice = new Prisma.Decimal(
      String(price).replace(/[^0-9.]/g, '')
    );

    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = cleanPrice;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (productStock !== undefined) data.productStock = productStock;
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (images !== undefined) data.images = images;

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data,
    });

    res.status(200).json({
      status: 'success',
      data: {
        product: updatedProduct,
      },
    });
  }
);

export const deleteProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const productId = req.params.id;

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) return next(new AppError('Product not found', 404));

    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);
