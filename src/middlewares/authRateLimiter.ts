import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import crypto from 'crypto';
import { Request } from 'express';
import { redisConfig } from '../config/redis';

const redisClient = createClient({
  url: `redis://${redisConfig.password ? `:${redisConfig.password}@` : ''}${
    redisConfig.host
  }:${redisConfig.port}`,
});
redisClient.connect().catch(console.error);

function generateKey(req: Request): string {
  const ip =
    (Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for']?.split(',')[0]) ||
    req.socket.remoteAddress ||
    'unknown-ip';
  const userId = req.body?.email || req.body?.username || req.user?.id;
  const device =
    req.headers['x-device-id'] || req.headers['user-agent'] || 'unknown-device';
  const rawKey = userId ? `${ip}|${userId}|${device}` : ip;
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) =>
    req.body?.email || req.body?.username || req.user?.id ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try again later.' },
  keyGenerator: generateKey,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
});
