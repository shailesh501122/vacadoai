import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthedRequest } from '../middleware/authMiddleware';
import { generateApiKey, httpError } from '../utils/helpers';

export async function list(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.userId! },
      select: { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ keys });
  } catch (err) {
    next(err);
  }
}

export const createKeySchema = z.object({ name: z.string().min(1).max(50) });

export async function create(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name } = req.body as z.infer<typeof createKeySchema>;
    const { key, hash, prefix } = generateApiKey();
    const record = await prisma.apiKey.create({
      data: { userId: req.userId!, name, keyHash: hash, prefix },
    });
    // Full key returned exactly once.
    res.status(201).json({ id: record.id, name, key });
  } catch (err) {
    next(err);
  }
}

export async function revoke(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const k = await prisma.apiKey.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!k) throw httpError(404, 'Key not found');
    await prisma.apiKey.delete({ where: { id: k.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
