import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { AuthedRequest } from '../middleware/authMiddleware';
import { httpError } from '../utils/helpers';
import { getAuthUrl, exchangeCode } from '../services/youtubeService';

export async function list(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const channels = await prisma.youtubeChannel.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { shorts: true } } },
    });
    res.json({ channels });
  } catch (err) {
    next(err);
  }
}

export async function connect(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: req.userId! },
    });
    const count = await prisma.youtubeChannel.count({
      where: { userId: req.userId! },
    });
    if (sub && count >= sub.channelLimit) {
      throw httpError(
        402,
        `Channel limit reached (${count}/${sub.channelLimit}). Upgrade to add more.`,
      );
    }
    res.json({ url: getAuthUrl(req.userId!) });
  } catch (err) {
    next(err);
  }
}

/** OAuth2 redirect target — `state` carries the userId. */
export async function callback(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const code = String(req.query.code ?? '');
    const userId = String(req.query.state ?? '');
    if (!code || !userId) throw httpError(400, 'Invalid OAuth callback');

    const data = await exchangeCode(code);
    await prisma.youtubeChannel.upsert({
      where: {
        userId_channelId: { userId, channelId: data.channelId },
      },
      create: {
        userId,
        channelId: data.channelId,
        channelName: data.channelName,
        handle: data.handle,
        thumbnailUrl: data.thumbnailUrl,
        subscriberCount: data.subscriberCount,
        accessToken: data.tokens.access_token ?? '',
        refreshToken: data.tokens.refresh_token ?? '',
        tokenExpiry: data.tokens.expiry_date
          ? new Date(data.tokens.expiry_date)
          : null,
      },
      update: {
        channelName: data.channelName,
        subscriberCount: data.subscriberCount,
        accessToken: data.tokens.access_token ?? '',
        ...(data.tokens.refresh_token
          ? { refreshToken: data.tokens.refresh_token }
          : {}),
      },
    });
    res.redirect(`${env.appUrl}/dashboard/channels?connected=1`);
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
    const ch = await prisma.youtubeChannel.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!ch) throw httpError(404, 'Channel not found');
    await prisma.youtubeChannel.delete({ where: { id: ch.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function toggle(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ch = await prisma.youtubeChannel.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!ch) throw httpError(404, 'Channel not found');
    const updated = await prisma.youtubeChannel.update({
      where: { id: ch.id },
      data: { isActive: !ch.isActive },
    });
    res.json({ channel: updated });
  } catch (err) {
    next(err);
  }
}
