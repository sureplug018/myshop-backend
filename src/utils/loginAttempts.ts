import Redis from 'ioredis';
import { redisConfig } from '../config/redis';

const redis = new Redis(redisConfig);

const MAX_ATTEMPTS = 4;
const LOCK_TIME = 60 * 60; // 1 hour (seconds)

export async function checkLoginBlock(userId: string) {
  const key = `login:attempts:${userId}`;
  const attempts = await redis.get(key);

  if (attempts && Number(attempts) >= MAX_ATTEMPTS) {
    const ttl = await redis.ttl(key);
    return { blocked: true, ttl };
  }

  return { blocked: false };
}

export async function recordFailedLogin(userId: string) {
  const key = `login:attempts:${userId}`;
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, LOCK_TIME);
  }

  return attempts;
}

export async function resetLoginAttempts(userId: string) {
  await redis.del(`login:attempts:${userId}`);
}
