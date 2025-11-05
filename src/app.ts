import express, { Express, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import userRoutes from './routes/userRoutes';
import { globalErrorHandler } from './utils/errorHandler';
import { AppError } from './utils/AppError';

const app: Express = express();

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);

app.set('trust proxy', 1);
console.info('trust proxy setting:', app.get('trust proxy'));

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again in an hour!',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Optional custom sanitization middleware
app.use((req: Request, res: Response, next: NextFunction): void => {
  const sanitize = (obj: Record<string, unknown> | undefined): void => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (/^\$/.test(key) || /\./.test(key)) {
        const safeKey = key.replace(/^\$|\./g, '_');
        (obj as Record<string, unknown>)[safeKey] = obj[key];
        delete (obj as Record<string, unknown>)[key];
      }
    }
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
});

app.use('/api/v1/users', userRoutes);

// ✅ FIXED catch-all route
app.all(/.*/, (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
