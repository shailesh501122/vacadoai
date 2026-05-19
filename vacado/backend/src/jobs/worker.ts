import { Worker } from 'bullmq';
import { bullConnection } from '../config/redis';
import { logger } from '../utils/logger';
import { processGenerateShort } from './generateShort';
import type { GenerateShortJob } from './queue';

const worker = new Worker<GenerateShortJob>(
  'generateShort',
  async (job) => processGenerateShort(job.data),
  { connection: bullConnection, concurrency: 3 },
);

worker.on('completed', (job) => logger.info(`Job ${job.id} completed`));
worker.on('failed', (job, err) =>
  logger.error(`Job ${job?.id} failed: ${err.message}`),
);

logger.info('Vacado worker started, listening on "generateShort" queue');

async function shutdown(): Promise<void> {
  logger.info('Worker shutting down…');
  await worker.close();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
