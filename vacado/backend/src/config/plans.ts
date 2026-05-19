import { Plan } from '@prisma/client';

export interface PlanDef {
  plan: Plan;
  name: string;
  priceMonthly: number;
  shortsLimit: number; // -1 = unlimited
  channelLimit: number;
  languageLimit: number;
  apiAccess: boolean;
  priorityQueue: boolean;
}

export const PLANS: Record<Plan, PlanDef> = {
  STARTER: {
    plan: 'STARTER',
    name: 'Starter',
    priceMonthly: 29,
    shortsLimit: 30,
    channelLimit: 1,
    languageLimit: 5,
    apiAccess: false,
    priorityQueue: false,
  },
  PRO: {
    plan: 'PRO',
    name: 'Pro',
    priceMonthly: 79,
    shortsLimit: 150,
    channelLimit: 5,
    languageLimit: 25,
    apiAccess: true,
    priorityQueue: false,
  },
  AGENCY: {
    plan: 'AGENCY',
    name: 'Agency',
    priceMonthly: 199,
    shortsLimit: -1,
    channelLimit: 20,
    languageLimit: 50,
    apiAccess: true,
    priorityQueue: true,
  },
};

/** Resolve a plan from a Stripe price id. */
export function planFromPriceId(
  priceId: string,
  priceMap: Record<string, string>,
): Plan {
  const entry = Object.entries(priceMap).find(([, id]) => id === priceId);
  return (entry?.[0] as Plan) ?? 'STARTER';
}
