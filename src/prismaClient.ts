// 1
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// 2
const prisma = new PrismaClient().$extends(withAccelerate());

export default prisma;
