/**
 * Pre-Test Safety Checks
 *
 * Run these checks before every test execution to ensure
 * we never accidentally touch production data.
 */

import {
  validateTestEnvironment,
  isProductionDatabaseUrl,
  isProductionApiKey,
  TestEnvironmentError,
} from '../config/test-env';

/**
 * Run all pre-test safety checks.
 * Throws an error if any check fails.
 */
export function runSafetyChecks(): void {
  console.log('[Safety] Running pre-test safety checks...\n');

  const checks = [
    checkNodeEnv,
    checkDatabaseUrl,
    checkDirectUrl,
    checkApiKeys,
    checkNeonBranch,
  ];

  const failures: string[] = [];

  for (const check of checks) {
    try {
      check();
      console.log(`  ✓ ${check.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);
      console.log(`  ✗ ${check.name}: ${message}`);
    }
  }

  if (failures.length > 0) {
    console.log('\n');
    throw new TestEnvironmentError(
      `${failures.length} safety check(s) failed:\n` +
      failures.map((f, i) => `  ${i + 1}. ${f}`).join('\n')
    );
  }

  console.log('\n[Safety] All checks passed\n');
}

function checkNodeEnv(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(`NODE_ENV must be 'test', got '${process.env.NODE_ENV}'`);
  }
}

function checkDatabaseUrl(): void {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // OK for unit tests with mocked Prisma
    return;
  }
  if (isProductionDatabaseUrl(url)) {
    throw new Error('DATABASE_URL points to a production database!');
  }
}

function checkDirectUrl(): void {
  const url = process.env.DIRECT_URL;
  if (!url) return;
  if (isProductionDatabaseUrl(url)) {
    throw new Error('DIRECT_URL points to a production database!');
  }
}

function checkApiKeys(): void {
  const keys = [
    { name: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY },
    { name: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY },
    { name: 'GOOGLE_AI_API_KEY', value: process.env.GOOGLE_AI_API_KEY },
  ];

  for (const { name, value } of keys) {
    if (isProductionApiKey(value)) {
      throw new Error(`${name} appears to be a production API key!`);
    }
  }
}

function checkNeonBranch(): void {
  const branchId = process.env.NEON_BRANCH_ID;
  if (!branchId) return; // Optional for unit tests

  const primaryBranchId = process.env.NEON_PRIMARY_BRANCH_ID;
  if (primaryBranchId && branchId === primaryBranchId) {
    throw new Error('NEON_BRANCH_ID is the production primary branch!');
  }
}

