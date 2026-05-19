import { Plan } from '@prisma/client';
import { stripe } from '../config/stripe';
import { env } from '../config/env';
import { prisma } from '../config/db';
import { PLANS, planFromPriceId } from '../config/plans';
import { logger } from '../utils/logger';

export async function createCheckoutSession(
  userId: string,
  email: string,
  plan: Plan,
): Promise<string> {
  const priceId = env.stripe.prices[plan];
  if (!priceId) throw new Error(`No Stripe price configured for ${plan}`);

  let sub = await prisma.subscription.findUnique({ where: { userId } });
  let customerId = sub?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });
    customerId = customer.id;
    await prisma.subscription.update({
      where: { userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.appUrl}/dashboard/subscription?status=success`,
    cancel_url: `${env.appUrl}/dashboard/subscription?status=cancel`,
    subscription_data: { metadata: { userId } },
  });
  return session.url!;
}

export async function createPortalSession(userId: string): Promise<string> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeCustomerId) throw new Error('No Stripe customer');
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${env.appUrl}/dashboard/subscription`,
  });
  return session.url;
}

/** Apply plan limits to a user's subscription row. */
async function applyPlan(
  userId: string,
  plan: Plan,
  data: Partial<{
    status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
    currentPeriodEnd: Date;
    stripeSubId: string;
    stripePriceId: string;
  }>,
): Promise<void> {
  const def = PLANS[plan];
  await prisma.subscription.update({
    where: { userId },
    data: {
      plan,
      shortsLimit: def.shortsLimit,
      channelLimit: def.channelLimit,
      languageLimit: def.languageLimit,
      apiAccess: def.apiAccess,
      ...data,
    },
  });
}

export async function handleWebhookEvent(
  payload: Buffer,
  signature: string,
): Promise<void> {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    env.stripe.webhookSecret,
  );

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const s = event.data.object as import('stripe').Stripe.Subscription;
      const userId = s.metadata.userId;
      if (!userId) break;
      const priceId = s.items.data[0]?.price.id ?? '';
      await applyPlan(userId, planFromPriceId(priceId, env.stripe.prices), {
        status: s.status === 'active' || s.status === 'trialing' ? 'ACTIVE' : 'PAST_DUE',
        currentPeriodEnd: new Date(s.current_period_end * 1000),
        stripeSubId: s.id,
        stripePriceId: priceId,
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const s = event.data.object as import('stripe').Stripe.Subscription;
      const userId = s.metadata.userId;
      if (userId) {
        await prisma.subscription.update({
          where: { userId },
          data: { status: 'CANCELED' },
        });
      }
      break;
    }
    case 'invoice.payment_succeeded': {
      const inv = event.data.object as import('stripe').Stripe.Invoice;
      const customerId = inv.customer as string;
      // Reset monthly usage on successful renewal.
      await prisma.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: { shortsUsed: 0, status: 'ACTIVE' },
      });
      break;
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object as import('stripe').Stripe.Invoice;
      await prisma.subscription.updateMany({
        where: { stripeCustomerId: inv.customer as string },
        data: { status: 'PAST_DUE' },
      });
      break;
    }
    default:
      logger.debug(`Unhandled Stripe event: ${event.type}`);
  }
}
