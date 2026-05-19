import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (v === undefined) {
    // Don't crash dev when optional integrations are unset; warn loudly instead.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required env var: ${key}`);
    }
    // eslint-disable-next-line no-console
    console.warn(`[env] ${key} is not set — features depending on it will fail.`);
    return '';
  }
  return v;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT ?? '4000', 10),
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  apiUrl: process.env.API_URL ?? 'http://localhost:4000',

  databaseUrl: required('DATABASE_URL'),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',

  jwtSecret: required('JWT_SECRET', 'dev-insecure-secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirect: process.env.GOOGLE_OAUTH_REDIRECT ?? 'http://localhost:4000/api/channels/callback',
  },

  openaiKey: process.env.OPENAI_API_KEY ?? '',
  elevenLabsKey: process.env.ELEVENLABS_API_KEY ?? '',
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? '',

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    prices: {
      STARTER: process.env.STRIPE_PRICE_STARTER ?? '',
      PRO: process.env.STRIPE_PRICE_PRO ?? '',
      AGENCY: process.env.STRIPE_PRICE_AGENCY ?? '',
    } as Record<string, string>,
  },

  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    region: process.env.AWS_REGION ?? 'us-east-1',
    bucket: process.env.S3_BUCKET ?? 'vacado-media',
    endpoint: process.env.S3_ENDPOINT || undefined,
    publicUrl: process.env.S3_PUBLIC_URL ?? '',
  },

  email: {
    sendgridKey: process.env.SENDGRID_API_KEY ?? '',
    from: process.env.EMAIL_FROM ?? 'Vacado <no-reply@vacado.app>',
  },
};
