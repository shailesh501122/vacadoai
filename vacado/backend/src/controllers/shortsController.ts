import { Response, NextFunction } from 'express';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';
import axios from 'axios';
import { z } from 'zod';
import { prisma } from '../config/db';
import { PLANS } from '../config/plans';
import { env } from '../config/env';
import { AuthedRequest } from '../middleware/authMiddleware';
import { httpError, paginate } from '../utils/helpers';
import { enqueueGeneration } from '../jobs/queue';

export const generateSchema = z.object({
  movieTitle: z.string().min(1),
  language: z.string().min(2),
  channelId: z.string().optional(),
  clipStyle: z.enum(['action', 'dialogue', 'plot-twist', 'ending']).default('plot-twist'),
  tone: z.enum(['dramatic', 'casual', 'educational']).default('dramatic'),
  duration: z.coerce.number().int().min(15).max(60).default(60),
  voice: z.enum(['male', 'female', 'clone']).default('male'),
  title: z.string().optional(),
  hashtags: z.string().optional(),
  publishNow: z.boolean().default(false),
  scheduledAt: z.coerce.date().optional(),
});

export async function generate(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as z.infer<typeof generateSchema>;
    const sub = await prisma.subscription.findUnique({
      where: { userId: req.userId! },
    });
    if (!sub) throw httpError(403, 'No subscription');

    if (body.channelId) {
      const ch = await prisma.youtubeChannel.findFirst({
        where: { id: body.channelId, userId: req.userId! },
      });
      if (!ch) throw httpError(404, 'Channel not found');
    }

    const short = await prisma.short.create({
      data: {
        userId: req.userId!,
        channelId: body.channelId ?? null,
        movieTitle: body.movieTitle,
        language: body.language,
        clipStyle: body.clipStyle,
        tone: body.tone,
        duration: body.duration,
        voice: body.voice,
        title: body.title,
        hashtags: body.hashtags,
        status: body.scheduledAt ? 'SCHEDULED' : 'PENDING',
        scheduledAt: body.scheduledAt,
      },
    });

    const priority = sub.plan === 'AGENCY' ? 1 : sub.plan === 'PRO' ? 3 : 5;
    const delayMs = body.scheduledAt
      ? body.scheduledAt.getTime() - Date.now()
      : undefined;
    await enqueueGeneration(
      { shortId: short.id, publishNow: body.publishNow },
      priority,
      delayMs,
    );

    res.status(202).json({ short, queued: true });
  } catch (err) {
    next(err);
  }
}

export async function list(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit, skip } = paginate(req.query);
    const where = {
      userId: req.userId!,
      ...(req.query.status ? { status: req.query.status as never } : {}),
      ...(req.query.language
        ? { language: String(req.query.language) }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.short.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { channel: { select: { channelName: true } } },
      }),
      prisma.short.count({ where }),
    ]);
    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function getOne(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const short = await prisma.short.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: { jobs: true, channel: true },
    });
    if (!short) throw httpError(404, 'Short not found');
    res.json({ short });
  } catch (err) {
    next(err);
  }
}

export async function remove(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const short = await prisma.short.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!short) throw httpError(404, 'Short not found');
    await prisma.short.delete({ where: { id: short.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function publish(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const short = await prisma.short.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!short) throw httpError(404, 'Short not found');
    if (!short.channelId) throw httpError(400, 'Attach a channel first');
    await enqueueGeneration({ shortId: short.id, publishNow: true }, 1);
    res.json({ ok: true, queued: true });
  } catch (err) {
    next(err);
  }
}

export const scheduleSchema = z.object({ scheduledAt: z.coerce.date() });

export async function schedule(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { scheduledAt } = req.body as z.infer<typeof scheduleSchema>;
    const short = await prisma.short.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!short) throw httpError(404, 'Short not found');
    await prisma.short.update({
      where: { id: short.id },
      data: { scheduledAt, status: 'SCHEDULED' },
    });
    await enqueueGeneration(
      { shortId: short.id, publishNow: false },
      3,
      scheduledAt.getTime() - Date.now(),
    );
    res.json({ ok: true, scheduledAt });
  } catch (err) {
    next(err);
  }
}

// Surface plan catalog for the pricing UI.
export function plans(_req: AuthedRequest, res: Response): void {
  res.json({ plans: Object.values(PLANS) });
}

/**
 * Stream a generated Short to the browser as a proper .mp4 download.
 * Works for both the local-media fallback and S3-hosted videos, and sets
 * Content-Disposition so browsers actually save the file (not render it
 * as HTML, which is what was happening when /media wasn't proxied).
 */
export async function download(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const short = await prisma.short.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!short) throw httpError(404, 'Short not found');
    if (!short.videoUrl) throw httpError(409, 'Video is not ready yet');

    const safe = `${short.movieTitle}-${short.language}-${short.id}`
      .replace(/[^A-Za-z0-9._-]+/g, '_')
      .slice(0, 80);
    const filename = `Vacado-${safe}.mp4`;
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    // Local-fallback URLs look like "/media/videos/<id>.mp4".
    if (short.videoUrl.startsWith('/media/')) {
      const relative = short.videoUrl.replace(/^\/media\//, '');
      const filePath = join(env.media.dir, relative);
      const s = await stat(filePath);
      res.setHeader('Content-Length', String(s.size));
      createReadStream(filePath).pipe(res);
      return;
    }

    // Absolute URL (S3/R2 etc) — proxy stream with the same disposition.
    const upstream = await axios.get(short.videoUrl, { responseType: 'stream' });
    const len = upstream.headers['content-length'];
    if (typeof len === 'string' || typeof len === 'number') {
      res.setHeader('Content-Length', String(len));
    }
    upstream.data.pipe(res);
  } catch (err) {
    next(err);
  }
}
