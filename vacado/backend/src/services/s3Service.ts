import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';

const s3 = new S3Client({
  region: env.s3.region,
  endpoint: env.s3.endpoint,
  forcePathStyle: Boolean(env.s3.endpoint), // needed for R2 / MinIO
  credentials: {
    accessKeyId: env.s3.accessKeyId,
    secretAccessKey: env.s3.secretAccessKey,
  },
});

/** Upload a buffer and return its public URL. */
export async function uploadBuffer(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
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
}
