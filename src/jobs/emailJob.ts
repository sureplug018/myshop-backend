import { Job } from 'bullmq';
import { Email } from '../utils/appEmail';
import logger from '../utils/logger';

export const processEmailJob = async (job: Job) => {
  const { type, user, data, subject } = job.data;

  logger.info(`📨 Processing ${type} email for ${user.email}`);

  const email = new Email(user, data, subject);

  switch (type) {
    case 'welcome':
      await email.sendWelcome();
      break;
    case 'passwordReset':
      await email.sendPasswordReset();
      break;
    case 'confirmEmail':
      await email.sendConfirmEmail();
      break;
    default:
      logger.warn(`⚠️ Unknown email type: ${type}`);
  }

  logger.info(`✅ Email sent to ${user.email}`);
};
