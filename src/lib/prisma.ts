import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ---------------------------------------------------------------------------
// Runtime Safety Guard – Prevent test code from using production database
// ---------------------------------------------------------------------------
function getDatasourceUrl(): string | undefined {
  if (process.env.NODE_ENV === 'test') {
    const testType = process.env.TEST_TYPE || 'unit';
    const url =
      testType === 'e2e'
        ? process.env.E2E_DATABASE_URL
        : process.env.UNIT_DATABASE_URL;
    return url || process.env.DATABASE_URL;
  }
  return undefined; // Use default from schema.prisma in non-test envs
}

function validateNonProduction(): void {
  if (process.env.NODE_ENV === 'test') {
    const url = process.env.DATABASE_URL || '';
    // Simple check: If it contains neon.tech and doesn't look like a branch endpoint
    // log a warning (we can't reliably detect all production URLs here)
    if (url.includes('.neon.tech') && !process.env.NEON_BRANCH_ID) {
      console.warn(
        '[PRISMA SAFETY] Running in test mode against a Neon database ' +
        'without NEON_BRANCH_ID set. Make sure this is a test branch!'
      );
    }
  }
}

validateNonProduction();

const datasourceUrl = getDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    ...(datasourceUrl
      ? {
          datasources: {
            db: { url: datasourceUrl },
          },
        }
      : {}),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
