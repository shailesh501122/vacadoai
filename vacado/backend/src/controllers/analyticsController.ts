import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthedRequest } from '../middleware/authMiddleware';

export async function overview(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.userId!;
    const [totalShorts, channels, agg, sub] = await Promise.all([
      prisma.short.count({ where: { userId } }),
      prisma.youtubeChannel.count({ where: { userId, isActive: true } }),
      prisma.short.aggregate({ where: { userId }, _sum: { views: true } }),
      prisma.subscription.findUnique({ where: { userId } }),
    ]);
    const views = agg._sum.views ?? 0;
    // Simple revenue estimate at ~$1.6 RPM.
    const estRevenue = Math.round((views / 1000) * 1.6);
    res.json({
      totalShorts,
      activeChannels: channels,
      totalViews: views,
      estRevenue,
      plan: sub?.plan,
      shortsUsed: sub?.shortsUsed ?? 0,
      shortsLimit: sub?.shortsLimit ?? 0,
    });
  } catch (err) {
    next(err);
  }
}

export async function performance(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const shorts = await prisma.short.findMany({
      where: { userId: req.userId!, createdAt: { gte: since } },
      select: { createdAt: true, views: true },
    });
    const byDay = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      byDay.set(d.toISOString().slice(0, 10), 0);
    }
    for (const s of shorts) {
      const key = s.createdAt.toISOString().slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + s.views);
    }
    res.json({
      series: [...byDay.entries()].map(([date, views]) => ({ date, views })),
    });
  } catch (err) {
    next(err);
  }
}

export async function languages(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const grouped = await prisma.short.groupBy({
      by: ['language'],
      where: { userId: req.userId! },
      _count: { _all: true },
    });
    const total = grouped.reduce((n, g) => n + g._count._all, 0) || 1;
    res.json({
      languages: grouped
        .map((g) => ({
          language: g.language,
          count: g._count._all,
          pct: Math.round((g._count._all / total) * 100),
        }))
        .sort((a, b) => b.count - a.count),
    });
  } catch (err) {
    next(err);
  }
}
