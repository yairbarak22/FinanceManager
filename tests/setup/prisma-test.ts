/**
 * Prisma Test Client
 *
 * Provides a separate Prisma client instance connected to the Neon test branch.
 * Includes auto-cleanup helpers and transaction rollback support.
 *
 * SAFETY: Validates that the connection string points to a test branch,
 * not production.
 */

import { PrismaClient } from '@prisma/client';
import { getTestDatabaseUrl, getTestDirectUrl } from './env-isolation';
import { isProductionDatabaseUrl } from '../config/test-env';

let testPrisma: PrismaClient | null = null;

/**
 * Get or create the test Prisma client.
 * Validates the connection string before creating the client.
 */
export function getTestPrismaClient(): PrismaClient {
  if (testPrisma) return testPrisma;

  const databaseUrl = getTestDatabaseUrl();
  const directUrl = getTestDirectUrl();

  // Safety check
  if (!databaseUrl) {
    throw new Error(
      '[PrismaTest] No DATABASE_URL set for tests. ' +
      'Run integration tests with TEST_NEEDS_DB=true to create a Neon branch.'
    );
  }

  if (isProductionDatabaseUrl(databaseUrl)) {
    throw new Error(
      '[PrismaTest] DATABASE_URL points to PRODUCTION! ' +
      'Tests must use a Neon branch or local database.'
    );
  }

  testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: ['error', 'warn'],
  });

  return testPrisma;
}

/**
 * Disconnect the test Prisma client.
 * Call in afterAll hooks.
 */
export async function disconnectTestPrisma(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
  }
}

/**
 * Clean up all test data from the database.
 * Deletes data in reverse-dependency order to avoid FK violations.
 */
export async function cleanupTestData(): Promise<void> {
  const prisma = getTestPrismaClient();

  // Delete in reverse-dependency order
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.marketingEvent.deleteMany(),
    prisma.marketingCampaign.deleteMany(),
    prisma.emailTemplate.deleteMany(),
    prisma.inboxMessage.deleteMany(),
    prisma.maaserPreference.deleteMany(),
    prisma.calculatorInvite.deleteMany(),
    prisma.merchantCategoryMap.deleteMany(),
    prisma.document.deleteMany(),
    prisma.assetValueHistory.deleteMany(),
    prisma.netWorthHistory.deleteMany(),
    prisma.holding.deleteMany(),
    prisma.financialGoal.deleteMany(),
    prisma.recurringTransaction.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.liability.deleteMany(),
    prisma.asset.deleteMany(),
    prisma.customCategory.deleteMany(),
    prisma.userProfile.deleteMany(),
    prisma.accountInvite.deleteMany(),
    prisma.sharedAccountMember.deleteMany(),
    prisma.sharedAccount.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/**
 * Run a test inside a transaction that gets rolled back.
 * Useful for tests that mutate data but should leave DB in original state.
 */
export async function withRollback<T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = getTestPrismaClient();

  try {
    // Prisma interactive transactions with rollback
    const result = await prisma.$transaction(async (tx) => {
      const result = await fn(tx as unknown as PrismaClient);

      // Force rollback by throwing
      throw { __rollback: true, result };
    });

    return result; // Won't reach here
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      '__rollback' in error &&
      (error as { __rollback: boolean }).__rollback
    ) {
      return (error as { result: T }).result;
    }
    throw error;
  }
}

