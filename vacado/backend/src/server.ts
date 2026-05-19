import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { disconnectDb } from './config/db';
import { disconnectRedis } from './config/redis';

const app = createApp();
const server = app.listen(env.port, () => {
  logger.info(`Vacado API listening on :${env.port} (${env.nodeEnv})`);
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await disconnectDb();
    await disconnectRedis();
    logger.info('Clean shutdown complete');
    process.exit(0);
  });
  // Force-exit if connections hang.
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) =>
  logger.error(`Unhandled rejection: ${String(reason)}`),
);
