/**
 * Prisma Client Mock
 *
 * Uses vitest-mock-extended to create a type-safe mock of the Prisma Client.
 * Use this for unit tests that should NOT touch any database.
 */

import { vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

// Create a deep mock of PrismaClient
export const prismaMock = mockDeep<PrismaClient>();

// Type alias for convenience
export type MockPrismaClient = DeepMockProxy<PrismaClient>;

/**
 * Setup Prisma mock – replaces `@/lib/prisma` with the mock.
 * Call this at the top of your test file or in a beforeAll.
 */
export function setupPrismaMock(): void {
  vi.mock('@/lib/prisma', () => ({
    prisma: prismaMock,
  }));
}

/**
 * Reset all Prisma mock state.
 * Call this in beforeEach to ensure clean state between tests.
 */
export function resetPrismaMock(): void {
  mockReset(prismaMock);
}

