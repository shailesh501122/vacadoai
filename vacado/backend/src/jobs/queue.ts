import { Queue } from 'bullmq';
import { bullConnection } from '../config/redis';

export interface GenerateShortJob {
  shortId: string;
  publishNow: boolean;
}

export const shortsQueue = new Queue<GenerateShortJob>('generateShort', {
  connection: bullConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

/** Agency plans get higher priority (lower number = sooner). */
export async function enqueueGeneration(
  data: GenerateShortJob,
  priority = 5,
  delayMs?: number,
): Promise<void> {
  await shortsQueue.add('generate', data, {
    priority,
    delay: delayMs && delayMs > 0 ? delayMs : undefined,
  });
}
