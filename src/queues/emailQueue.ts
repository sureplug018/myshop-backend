import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis';

export const emailQueue = new Queue('email-queue', {
  connection: redisConfig,
});
