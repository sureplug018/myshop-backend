import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { Response } from 'express';

const prisma = new PrismaClient();

export const generateIdempotencyKey = async (
  action: string,
  userId: string,
  idempotencyKey: string,
  res: Response
): Promise<{ fullKey: string; expiresAt: Date }> => {
  let key = idempotencyKey || randomUUID();
  const fullKey = `${action}-${userId}-${key}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour expiry

  // 1. Check for existing idempotency record
  let idempotency = await prisma.idempotency.findUnique({
    where: { key: fullKey },
  });

  if (idempotency && new Date(idempotency.expiresAt) > now) {
    // ✅ Retry: Return cached result immediately
    const { status, data } = JSON.parse(idempotency.result as string);
    res.status(status).json(data);
    return { fullKey, expiresAt };
  }

  return { fullKey, expiresAt };
};
