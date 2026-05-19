import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PLANS } from '../src/config/plans';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@vacado.app';
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Marco Reyes',
      passwordHash: await bcrypt.hash('demo1234', 12),
    },
  });

  const pro = PLANS.PRO;
  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      plan: 'PRO',
      status: 'ACTIVE',
      shortsUsed: 94,
      shortsLimit: pro.shortsLimit,
      channelLimit: pro.channelLimit,
      languageLimit: pro.languageLimit,
      apiAccess: pro.apiAccess,
      currentPeriodEnd: new Date('2026-06-01'),
    },
  });

  const movies = [
    { m: 'Inception (2010)', l: 'Spanish', s: 'PUBLISHED', v: 284000 },
    { m: 'Avengers: Endgame', l: 'Hindi', s: 'PROCESSING', v: 0 },
    { m: 'Parasite (2019)', l: 'French', s: 'SCHEDULED', v: 0 },
    { m: 'Interstellar (2014)', l: 'Arabic', s: 'PUBLISHED', v: 412000 },
    { m: 'Joker (2019)', l: 'Portuguese', s: 'FAILED', v: 0 },
    { m: 'Oppenheimer (2023)', l: 'German', s: 'PUBLISHED', v: 176000 },
  ] as const;

  for (const x of movies) {
    await prisma.short.create({
      data: {
        userId: user.id,
        movieTitle: x.m,
        language: x.l,
        status: x.s,
        views: x.v,
        title: `${x.m} Explained`,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded demo user: ${email} / demo1234`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
