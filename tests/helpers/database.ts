/**
 * Database Test Helpers
 *
 * Utilities for seeding test data and cleaning up the test database.
 */

import { PrismaClient } from '@prisma/client';
import { createUser, type UserFactoryData } from '../factories/user';
import {
  createTransaction,
  createTransactions,
  type TransactionFactoryData,
} from '../factories/transaction';
import { createDocument, type DocumentFactoryData } from '../factories/document';

/**
 * Seed a test user into the database.
 * Returns the created user.
 */
export async function seedUser(
  prisma: PrismaClient,
  overrides: Partial<UserFactoryData> = {}
): Promise<UserFactoryData> {
  const userData = createUser(overrides);

  await prisma.user.create({
    data: {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      emailVerified: userData.emailVerified,
      image: userData.image,
      hasSeenOnboarding: userData.hasSeenOnboarding,
      hasProAccess: userData.hasProAccess,
      signupSource: userData.signupSource,
      isMarketingSubscribed: userData.isMarketingSubscribed,
    },
  });

  return userData;
}

/**
 * Seed a user with shared account setup.
 */
export async function seedUserWithSharedAccount(
  prisma: PrismaClient,
  overrides: Partial<UserFactoryData> = {}
): Promise<{ user: UserFactoryData; sharedAccountId: string }> {
  const user = await seedUser(prisma, overrides);

  const sharedAccount = await prisma.sharedAccount.create({
    data: {
      name: 'Test Account',
      members: {
        create: {
          userId: user.id,
          role: 'OWNER',
        },
      },
    },
  });

  return { user, sharedAccountId: sharedAccount.id };
}

/**
 * Seed transactions for a user.
 */
export async function seedTransactions(
  prisma: PrismaClient,
  userId: string,
  count: number,
  overrides: Partial<TransactionFactoryData> = {}
): Promise<TransactionFactoryData[]> {
  const transactions = createTransactions(userId, count, overrides);

  await prisma.transaction.createMany({
    data: transactions.map((tx) => ({
      id: tx.id,
      userId: tx.userId,
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      description: tx.description,
      date: tx.date,
    })),
  });

  return transactions;
}

/**
 * Seed a document for a user.
 */
export async function seedDocument(
  prisma: PrismaClient,
  userId: string,
  overrides: Partial<DocumentFactoryData> = {}
): Promise<DocumentFactoryData> {
  const doc = createDocument(userId, overrides);

  await prisma.document.create({
    data: {
      id: doc.id,
      userId: doc.userId,
      filename: doc.filename,
      storedName: doc.storedName,
      url: doc.url,
      mimeType: doc.mimeType,
      size: doc.size,
      entityType: doc.entityType,
      entityId: doc.entityId,
    },
  });

  return doc;
}

/**
 * Delete all data from all tables (in correct order).
 */
export async function truncateAllTables(prisma: PrismaClient): Promise<void> {
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

