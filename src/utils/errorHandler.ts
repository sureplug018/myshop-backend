import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from './appError';
import logger from './logger'; // ✅ import your logger

interface IError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: string | number;
}

const sendErrorDev = (err: IError, res: Response) => {
  logger.error(err.stack || err.message); // ✅ log error stack in dev
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err: IError, res: Response) => {
  // Operational, trusted errors (AppError)
  if (err.isOperational) {
    logger.warn(`[Operational Error] ${err.message}`); // ✅ log warnings
    res.status(err.statusCode || 500).json({
      status: err.status,
      message: err.message,
    });
  } else {
    logger.error(`[Unhandled Error] ${err.message}\n${err.stack}`); // ✅ log unexpected ones
    res.status(500).json({
      status: 'error',
      message: 'Internal server error!',
    });
  }
};

// Prisma-specific error translator
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError) => {
  switch (error.code) {
    case 'P2002':
      return new AppError(
        'Duplicate field value (unique constraint failed).',
        400
      );
    case 'P2003':
      return new AppError('Foreign key constraint failed.', 400);
    case 'P2025':
      return new AppError('Record not found.', 404);
    default:
      return new AppError('Database error occurred.', 500);
  }
};

// Global error handler
export const globalErrorHandler = (
  err: IError,
  _req: any,
  res: Response,
  _next: any
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error: IError = { ...err, message: err.message };

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      error = handlePrismaError(err);
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
      error = new AppError('Invalid data format sent to the database.', 400);
    }

    sendErrorProd(error, res);
  }
};
