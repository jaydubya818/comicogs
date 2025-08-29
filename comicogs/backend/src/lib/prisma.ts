/**
 * Centralized Prisma Client
 * 
 * Provides a single Prisma client instance with proper connection management.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../middleware/logger';

// Global is used here to maintain a cached connection across hot reloads in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Disconnecting Prisma client...');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  logger.info('Disconnecting Prisma client...');
  await prisma.$disconnect();
});

// Export default for convenience
export default prisma;
