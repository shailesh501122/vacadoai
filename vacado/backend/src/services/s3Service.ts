import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { env, hasS3 } from '../config/env';
import { logger } from '../utils/logger';

const s3 = hasS3()
  ? new S3Client({
      region: env.s3.region,
      endpoint: env.s3.endpoint,
      forcePathStyle: Boolean(env.s3.endpoint),
      credentials: {
        accessKeyId: env.s3.accessKeyId,
        secretAccessKey: env.s3.secretAccessKey,
      },
    })
  : null;

/**
 * Upload a buffer and return a public URL.
 * - S3/R2 when configured.
 * - Otherwise written to the local media volume and served by the API at
 *   /media/<key> (Nginx proxies /media to the backend), so generation works
 *   end-to-end with zero cloud configuration.
 */
export async function uploadBuffer(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  if (s3) {
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: env.s3.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      const base =
        env.s3.publicUrl ||
        (env.s3.endpoint
          ? `${env.s3.endpoint}/${env.s3.bucket}`
          : `https://${env.s3.bucket}.s3.${env.s3.region}.amazonaws.com`);
      return `${base}/${key}`;
    } catch (err) {
      logger.warn(`S3 upload failed for ${key}, falling back to local storage: ${String(err)}`);
    }
  }

  // Local fallback.
  const filePath = join(env.media.dir, key);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, body);
  logger.info(`Stored media locally: ${filePath}`);
  return env.media.publicBase
    ? `${env.media.publicBase.replace(/\/$/, '')}/${key}`
    : `/media/${key}`;
}
