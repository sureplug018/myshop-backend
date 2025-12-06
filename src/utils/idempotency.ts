import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateIdempotencyKey = async (
  action: string,
  userId: string,
  idempotencyKey?: string
): Promise<{
  fullKey: string;
  expiresAt: Date;
  cachedResponse?: { status: number; data: any };
}> => {
  const key = idempotencyKey || randomUUID();
  const fullKey = `${action}-${userId}-${key}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

  const existing = await prisma.idempotency.findUnique({
    where: { key: fullKey },
  });

  if (existing && new Date(existing.expiresAt) > now) {
    const parsed = JSON.parse(existing.result as string);
    return {
      fullKey,
      expiresAt,
      cachedResponse: {
        status: parsed.status,
        data: parsed.data,
      },
    };
  }

  return { fullKey, expiresAt };
};
