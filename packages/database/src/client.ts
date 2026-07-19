import { PrismaClient } from '@prisma/client';

// Avoid exhausting Postgres connections from creating a new PrismaClient on
// every hot-reload during development (Nest's webpack watch mode included).
declare global {
  var __propsAnalyzerPrismaClient: PrismaClient | undefined;
}

export const prisma =
  globalThis.__propsAnalyzerPrismaClient ?? new PrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalThis.__propsAnalyzerPrismaClient = prisma;
}
