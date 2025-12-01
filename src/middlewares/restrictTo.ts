// middleware/restrictTo.ts
import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

export const restrictTo = (...allowedRoles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('You are not authenticated', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  });
};
