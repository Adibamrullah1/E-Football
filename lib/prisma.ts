import { jsonDb } from './jsonDb';

const globalForPrisma = globalThis as unknown as {
  prisma: typeof jsonDb | undefined
}

export const prisma = globalForPrisma.prisma ?? jsonDb;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
