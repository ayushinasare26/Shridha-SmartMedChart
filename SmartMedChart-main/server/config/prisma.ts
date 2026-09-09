import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Automatically resolve DATABASE_URL if missing or invalid SQLite protocol
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
  const possiblePaths = [
    path.join(process.cwd(), 'prisma', 'smartmed.db'),
    path.join(process.cwd(), 'SmartMedChart-main', 'prisma', 'smartmed.db'),
    path.resolve(__dirname, '../../prisma/smartmed.db'),
    path.resolve(__dirname, '../../../prisma/smartmed.db'),
    path.resolve(__dirname, '../../../../prisma/smartmed.db'),
  ];

  let foundDbPath: string | null = null;
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        foundDbPath = p;
        break;
      }
    } catch {
      // Ignore filesystem access errors
    }
  }

  // On Vercel / AWS Lambda, filesystem is read-only except /tmp
  if (foundDbPath && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
    try {
      const tmpDb = path.join('/tmp', 'smartmed.db');
      if (!fs.existsSync(tmpDb)) {
        fs.copyFileSync(foundDbPath, tmpDb);
      }
      process.env.DATABASE_URL = `file:${tmpDb}`;
    } catch {
      process.env.DATABASE_URL = `file:${foundDbPath}`;
    }
  } else if (foundDbPath) {
    process.env.DATABASE_URL = `file:${foundDbPath}`;
  } else {
    // Fallback default
    process.env.DATABASE_URL = 'file:./smartmed.db';
  }
}

const prisma =
  global.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export { prisma };