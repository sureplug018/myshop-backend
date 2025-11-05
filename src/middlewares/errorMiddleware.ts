import { Request, Response, NextFunction } from 'express';
import { globalErrorHandler } from '../utils/errorHandler';

export const handleGlobalError = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  globalErrorHandler(err, req, res, next);
};
