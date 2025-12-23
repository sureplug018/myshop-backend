import express, { Express, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { globalErrorHandler } from './utils/errorHandler';
import { AppError } from './utils/appError';
import { authLimiter } from './middlewares/authRateLimiter';

import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import cartRoutes from './routes/cartRoutes';
import shippingRoutes from './routes/shippingRoutes';
import orderRoutes from './routes/orderRoutes';

const app: Express = express();

// Development logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);

// Trust proxy (for rate limiting behind proxies like Nginx)
app.set('trust proxy', 1);
console.info('trust proxy setting:', app.get('trust proxy'));

// Rate limiting
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again in an hour!',
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// === DATA SANITIZATION MIDDLEWARE (FIXED) ===
const blockedKeys = /^(?:\$\$|__proto__|prototype|constructor|\$)/;
const dotRegex = /\./g;

function deepSanitize(obj: any): any {
  if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(deepSanitize);

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    let safeKey = key;

    // Block dangerous keys
    if (blockedKeys.test(key)) {
      safeKey = key.replace(blockedKeys, '_');
    }

    // Replace dots in keys
    if (dotRegex.test(safeKey)) {
      safeKey = safeKey.replace(dotRegex, '_');
    }

    sanitized[safeKey] = deepSanitize(value);
  }
  return sanitized;
}

// FIXED: Mutate in place instead of reassigning req.query, req.body, req.params
app.use((req: Request, _res: Response, next: NextFunction) => {
  const targets: Array<'body' | 'query' | 'params'> = [
    'body',
    'query',
    'params',
  ];

  targets.forEach((prop) => {
    const data = (req as any)[prop];
    if (data && typeof data === 'object' && !(data instanceof Date)) {
      const sanitized = deepSanitize(data);

      // Clear original keys to avoid leftovers
      Object.keys(data).forEach((k) => delete (data as any)[k]);

      // Replace with sanitized version
      Object.assign(data, sanitized);
    }
  });

  next();
});

// === ROUTES ===
app.use('/api/v1/users', authLimiter, userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/carts', cartRoutes);
app.use('/api/v1/shippings', shippingRoutes);
app.use('/api/v1/orders', orderRoutes);

// === 404 CATCH-ALL ===
app.all(/.*/, (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// === GLOBAL ERROR HANDLER ===
app.use(globalErrorHandler);

export default app;
