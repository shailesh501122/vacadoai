import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { PLANS } from '../config/plans';
import { AuthedRequest } from '../middleware/authMiddleware';
import { httpError } from '../utils/helpers';
import {
  createCheckoutSession,
  createPortalSession,
  handleWebhookEvent,
} from '../services/stripeService';

export async function mySubscription(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: req.userId! },
    });
    if (!sub) throw httpError(404, 'No subscription');
    res.json({ subscription: sub, plan: PLANS[sub.plan], catalog: Object.values(PLANS) });
  } catch (err) {
    next(err);
  }
}

export const checkoutSchema = z.object({
  plan: z.enum(['STARTER', 'PRO', 'AGENCY']),
});

export async function checkout(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { plan } = req.body as z.infer<typeof checkoutSchema>;
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw httpError(404, 'User not found');
    const url = await createCheckoutSession(user.id, user.email, plan);
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

export async function portal(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const url = await createPortalSession(req.userId!);
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

/** Stripe webhook — needs the raw body (mounted with express.raw). */
export async function webhook(
  req: Request,
  res: Response,
): Promise<void> {
  const sig = req.headers['stripe-signature'] as string;
  try {
    await handleWebhookEvent(req.body as Buffer, sig);
    res.json({ received: true });
  } catch (err) {
    res
      .status(400)
      .send(`Webhook error: ${err instanceof Error ? err.message : 'invalid'}`);
  }
}
