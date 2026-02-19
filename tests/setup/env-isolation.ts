/**
 * Environment Variable Isolation for Concurrent Test Runs
 *
 * Prevents conflicts when running Vitest (unit/integration) and Playwright (E2E)
 * simultaneously by using separate environment variable prefixes:
 *
 * - Unit/Integration: UNIT_DATABASE_URL, UNIT_DIRECT_URL
 * - E2E:              E2E_DATABASE_URL,  E2E_DIRECT_URL
 *
 * Falls back to DATABASE_URL / DIRECT_URL if prefixed vars are not set.
 */

export type TestType = 'unit' | 'integration' | 'e2e';

/**
 * Determine the current test type from environment.
 */
export function getTestType(): TestType {
  const testType = process.env.TEST_TYPE;

  if (testType === 'e2e') return 'e2e';
  if (testType === 'integration') return 'integration';
  return 'unit';
}

/**
 * Get the correct DATABASE_URL for the current test context.
 */
export function getTestDatabaseUrl(): string {
  const testType = getTestType();

  if (testType === 'e2e') {
    return process.env.E2E_DATABASE_URL || process.env.DATABASE_URL || '';
  }

  // unit & integration share the same Vitest branch
  return process.env.UNIT_DATABASE_URL || process.env.DATABASE_URL || '';
}

/**
 * Get the correct DIRECT_URL for the current test context.
 */
export function getTestDirectUrl(): string {
  const testType = getTestType();

  if (testType === 'e2e') {
    return process.env.E2E_DIRECT_URL || process.env.DIRECT_URL || '';
  }

  return process.env.UNIT_DIRECT_URL || process.env.DIRECT_URL || '';
}

/**
 * Set environment variables for a specific test type.
 * Used by global setup scripts.
 */
export function setTestEnvironment(
  testType: TestType,
  databaseUrl: string,
  directUrl: string
): void {
  // Set type-specific variables
  if (testType === 'e2e') {
    process.env.E2E_DATABASE_URL = databaseUrl;
    process.env.E2E_DIRECT_URL = directUrl;
  } else {
    process.env.UNIT_DATABASE_URL = databaseUrl;
    process.env.UNIT_DIRECT_URL = directUrl;
  }

  // Also set generic vars as fallback (Prisma reads these)
  process.env.DATABASE_URL = databaseUrl;
  process.env.DIRECT_URL = directUrl;

  // Mark the test type
  process.env.TEST_TYPE = testType;
}

/**
 * Clear test environment variables on teardown.
 */
export function clearTestEnvironment(testType: TestType): void {
  if (testType === 'e2e') {
    delete process.env.E2E_DATABASE_URL;
    delete process.env.E2E_DIRECT_URL;
    delete process.env.__E2E_BRANCH_ID__;
    delete process.env.__E2E_BRANCH_CREATED_AT__;
  } else {
    delete process.env.UNIT_DATABASE_URL;
    delete process.env.UNIT_DIRECT_URL;
  }

  delete process.env.NEON_BRANCH_ID;
  delete process.env.BRANCH_CREATED_AT;
}

