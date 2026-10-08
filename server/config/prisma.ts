// Load environment variables from .env
import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Make sure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not defined. Please check your .env file.'
  );
}

// Make sure we are using PostgreSQL / Supabase
if (
  !process.env.DATABASE_URL.startsWith('postgresql://') &&
  !process.env.DATABASE_URL.startsWith('postgres://')
) {
  throw new Error(
    'Invalid DATABASE_URL. It must start with postgresql:// or postgres://'
  );
}

// Create a single Prisma Client instance
const prisma =
  global.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

// Reuse the Prisma Client during development
if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export { prisma };