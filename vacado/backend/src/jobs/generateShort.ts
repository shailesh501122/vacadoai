import { prisma } from '../config/db';
import { logger } from '../utils/logger';
import { generateScript, generateThumbnail, generateMetadata } from '../services/aiService';
import { synthesizeVoiceover } from '../services/voiceoverService';
import { fetchSourceClip, fetchClipFromUrl, composeVideo } from '../services/videoService';
import { uploadBuffer } from '../services/s3Service';
import { sendEmail, emails } from '../services/emailService';
import type { GenerateShortJob } from './queue';

/**
 * Full generation pipeline:
 * script → voiceover → clip → compose → thumbnail → upload to S3
 * → optional YouTube publish → bookkeeping.
 */
export async function processGenerateShort(data: GenerateShortJob): Promise<void> {
  const { shortId, publishNow } = data;
  const short = await prisma.short.findUnique({
    where: { id: shortId },
    include: { user: true, channel: true },
  });
  if (!short) throw new Error(`Short ${shortId} not found`);

  await prisma.short.update({
    where: { id: shortId },
    data: { status: 'PROCESSING' },
  });
  await prisma.job.create({
    data: { shortId, type: 'GENERATE_SHORT', status: 'RUNNING' },
  });

  try {
    // 1. Script
    const script = await generateScript({
      movieTitle: short.movieTitle,
      language: short.language,
      clipStyle: short.clipStyle ?? undefined,
      tone: short.tone ?? undefined,
      duration: short.duration,
    });

    // 2. Voiceover → S3
    const voBuffer = await synthesizeVoiceover(
      script,
      short.voice ?? 'male',
      short.duration,
    );
    const voiceoverUrl = await uploadBuffer(
      `voiceovers/${shortId}.mp3`,
      voBuffer,
      'audio/mpeg',
    );

    // 3. Source clip — user upload if provided, otherwise placeholder fallback
    const clip = short.sourceClipUrl
      ? await fetchClipFromUrl(short.sourceClipUrl).catch((e) => {
          logger.warn(`Source clip fetch failed (${short.sourceClipUrl}): ${e}`);
          return Buffer.alloc(0);
        })
      : await fetchSourceClip(short.movieTitle);

    // 4. Compose final video
    const video = await composeVideo({
      clip,
      voiceover: voBuffer,
      subtitleText: script,
      duration: short.duration,
    });
    const videoUrl = await uploadBuffer(
      `videos/${shortId}.mp4`,
      video,
      'video/mp4',
    );

    // 5. Thumbnail + metadata
    const meta =
      short.title && short.hashtags
        ? { title: short.title, hashtags: short.hashtags }
        : await generateMetadata(short.movieTitle, short.language);
    const thumbBuffer = await generateThumbnail(
      short.movieTitle,
      meta.title.split('—')[0]?.trim() ?? meta.title,
    );
    const thumbnailUrl = await uploadBuffer(
      `thumbnails/${shortId}.png`,
      thumbBuffer,
      'image/png',
    );

    await prisma.short.update({
      where: { id: shortId },
      data: { scriptText: script, voiceoverUrl, videoUrl, thumbnailUrl, ...meta },
    });

    // 6. Mark as completed (ready for download)
    await prisma.short.update({
      where: { id: shortId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
    
    await sendEmail(
      short.user.email,
      'Your Short is ready 🎬',
      emails.shortPublished(meta.title, videoUrl),
    ).catch(() => undefined);

    // 7. Bookkeeping — count one used Short
    await prisma.subscription.update({
      where: { userId: short.userId },
      data: { shortsUsed: { increment: 1 } },
    });
    await prisma.job.updateMany({
      where: { shortId, type: 'GENERATE_SHORT', status: 'RUNNING' },
      data: { status: 'COMPLETED' },
    });
    logger.info(`Short ${shortId} generated successfully`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Short ${shortId} failed: ${message}`);
    await prisma.short.update({
      where: { id: shortId },
      data: { status: 'FAILED' },
    });
    await prisma.job.updateMany({
      where: { shortId, type: 'GENERATE_SHORT', status: 'RUNNING' },
      data: { status: 'FAILED', errorLog: message, attempts: { increment: 1 } },
    });
    await sendEmail(
      short.user.email,
      'Short generation failed',
      emails.shortFailed(short.movieTitle),
    ).catch(() => undefined);
    throw err; // let BullMQ retry per attempts policy
  }
}
