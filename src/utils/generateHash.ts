import crypto from 'crypto';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateResetToken = async (userId: string) => {
  const resetToken = crypto.randomBytes(32).toString('hex');

  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  // 4. Persist the hash + expiry in the DB
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: expiresAt,
    },
  });
  return resetToken;
};
