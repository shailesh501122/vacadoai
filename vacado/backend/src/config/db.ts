import { PrismaClient } from '@prisma/client';

// Single Prisma instance. Connection pool is bounded via the
// `connection_limit` query param in DATABASE_URL (or pgBouncer in prod).
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
});

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}
