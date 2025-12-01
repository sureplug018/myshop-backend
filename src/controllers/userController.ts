import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

import { catchAsync } from '../utils/catchAsync';

const prisma = new PrismaClient();

export const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await prisma.user.findMany();
    res.status(200).json({ status: 'success', data: { users } });
  }
);
