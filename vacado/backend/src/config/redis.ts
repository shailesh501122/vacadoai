import IORedis from 'ioredis';
import { env } from './env';

// BullMQ requires maxRetriesPerRequest = null on its connection.
export const bullConnection = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null,
});

// Separate connection for app-level caching / sessions.
export const cache = new IORedis(env.redisUrl);

export async function disconnectRedis(): Promise<void> {
  await bullConnection.quit().catch(() => undefined);
  await cache.quit().catch(() => undefined);
}
