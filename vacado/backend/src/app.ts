import express from 'express';
import { mkdirSync } from 'fs';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFound } from './middleware/errorHandler';
import { webhook } from './controllers/subscriptionsController';
import routes from './routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.isProd ? env.appUrl : true,
      credentials: true,
    }),
  );

  // Stripe webhook needs the raw body — register BEFORE express.json().
  app.post(
    '/api/subscriptions/webhook',
    express.raw({ type: 'application/json' }),
    webhook,
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  // Serve generated media (used when S3 is not configured).
  mkdirSync(env.media.dir, { recursive: true });
  app.use(
    '/media',
    express.static(env.media.dir, {
      maxAge: '7d',
      setHeaders: (res) => res.set('Access-Control-Allow-Origin', '*'),
    }),
  );

  app.use('/api', generalLimiter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
  });

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
