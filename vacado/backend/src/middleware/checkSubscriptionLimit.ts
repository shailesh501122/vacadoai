import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { httpError } from '../utils/helpers';
import { AuthedRequest } from './authMiddleware';

/**
 * Rejects a generation request when the user has hit their monthly quota.
 * shortsLimit === -1 means unlimited (Agency).
 */
export async function checkSubscriptionLimit(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: req.userId! },
    });
    if (!sub) throw httpError(403, 'No active subscription');
    if (sub.status !== 'ACTIVE' && sub.status !== 'TRIALING') {
      throw httpError(402, 'Subscription is not active. Please update billing.');
    }
    if (sub.shortsLimit !== -1 && sub.shortsUsed >= sub.shortsLimit) {
      throw httpError(
        402,
        `Monthly limit reached (${sub.shortsUsed}/${sub.shortsLimit}). Upgrade your plan to generate more.`,
      );
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireApiAccess(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
): void {
  prisma.subscription
    .findUnique({ where: { userId: req.userId! } })
    .then((sub) => {
      if (!sub?.apiAccess) {
        return next(httpError(403, 'API access requires a Pro or Agency plan'));
      }
      next();
    })
    .catch(next);
}
