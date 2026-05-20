import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { httpError } from '../utils/helpers';
import { AuthedRequest } from './authMiddleware';

/** Gate routes to users whose `isAdmin` flag is set. */
export async function requireAdmin(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { isAdmin: true },
    });
    if (!user?.isAdmin) throw httpError(403, 'Admin only');
    next();
  } catch (err) {
    next(err);
  }
}
