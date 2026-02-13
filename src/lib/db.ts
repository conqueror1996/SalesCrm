import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query'],
    });

if (process.env.NODE_ENV !== 'production') {
    // Force new client generation on file save to pick up new schema
    globalForPrisma.prisma = new PrismaClient({ log: ['query'] });
}
