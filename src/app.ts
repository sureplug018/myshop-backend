import express, { Express, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import cors from 'cors';
import morgan from 'morgan';

const app: Express = express();

// 1️⃣ Use morgan only in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 2️⃣ Security headers
app.use(helmet());

// 3️⃣ CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);

app.set('trust proxy', 1);
console.info('trust proxy setting:', app.get('trust proxy'));

// 4️⃣ Rate limiter
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many requests from this IP, please try again in an hour!',
  },
  handler: (req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please slow down.',
    });
  },
});

app.use('/api', limiter);

// 5️⃣ Body parser & cookie parser
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 6️⃣ Data sanitization against NoSQL injection
app.use(mongoSanitize());

// 7️⃣ Extra sanitization for unsafe keys
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

  sanitize(req.body as Record<string, unknown>);
  sanitize(req.query as Record<string, unknown>);
  sanitize(req.params as Record<string, unknown>);

  next();
});

// 8️⃣ Handle unknown routes
app.all(/.*/, (req: Request, res: Response): void => {
  res.status(404).json({
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

export default app;
