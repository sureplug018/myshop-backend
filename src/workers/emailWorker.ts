import { Worker } from 'bullmq';
import { redisConfig } from '../config/redis';

import { processEmailJob } from '../jobs/emailJob';
import logger from '../utils/logger';

// import env to load it before the worker starts
import '../config/env';

export const emailWorker = new Worker('email-queue', processEmailJob, {
  connection: redisConfig,
});

emailWorker.on('completed', (job) => {
  logger.info(`🎉 Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`💥 Job ${job?.id} failed:`, err);
});
