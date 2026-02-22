/**
 * Vitest Global Setup
 *
 * Runs once before ALL test files. Creates a Neon branch from staging
 * (schema only, no data), sets environment variables, runs migrations,
 * and seeds test data.
 */

import { execSync } from 'child_process';
import {
  createTestBranch,
  getBranchConnectionStrings,
  waitForBranchReady,
  deleteTestBranch,
  getStagingBranchId,
  validateNotProductionBranch,
} from './neon-branch';
import { setTestEnvironment } from './env-isolation';
import { validateTestEnvironment, forceTestEnvironment } from '../config/test-env';

// Register cleanup handlers for unexpected exits
function registerCleanupHandler(branchId: string): void {
  const cleanup = async () => {
    console.log(`\n[GlobalSetup] Emergency cleanup: deleting branch ${branchId}...`);
    try {
      await deleteTestBranch(branchId);
    } catch {
      console.error('[GlobalSetup] Emergency cleanup failed');
    }
    process.exit(1);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('uncaughtException', async (error) => {
    console.error('[GlobalSetup] Uncaught exception:', error);
    await cleanup();
  });
}

export default async function globalSetup(): Promise<void> {
  console.log('\n=== Vitest Global Setup ===\n');

  // 1. Force test environment
  forceTestEnvironment();

  // 2. Check if we need Neon branches (skip for unit-only runs)
  const needsDb = process.env.TEST_NEEDS_DB === 'true';

  if (!needsDb) {
    console.log('[GlobalSetup] Skipping DB setup (TEST_NEEDS_DB not set)');
    console.log('[GlobalSetup] Unit tests will use mocked Prisma client\n');
    return;
  }

  // 3. Validate environment
  validateTestEnvironment();

  // 4. Get staging branch ID (NOT production)
  const stagingBranchId = getStagingBranchId();
  validateNotProductionBranch(stagingBranchId);

  console.log(`[GlobalSetup] Using staging branch: ${stagingBranchId}`);

  // 5. Create Neon branch from STAGING (schema only)
  const branch = await createTestBranch(`unit-${Date.now()}`, {
    parentId: stagingBranchId,
    schemaOnly: true,
  });

  // 6. Register cleanup handler for unexpected exits
  registerCleanupHandler(branch.id);

  // 7. Wait for branch to be ready
  await waitForBranchReady(branch.id);

  // 8. Get connection strings
  const connections = await getBranchConnectionStrings(branch.id);

  // 9. Set environment variables
  setTestEnvironment('unit', connections.databaseUrl, connections.directUrl);
  process.env.NEON_BRANCH_ID = branch.id;
  process.env.BRANCH_CREATED_AT = Date.now().toString();

  // 10. Run Prisma migrations
  console.log('[GlobalSetup] Running Prisma migrations...');
  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      env: {
        ...process.env,
        DATABASE_URL: connections.databaseUrl,
        DIRECT_URL: connections.directUrl,
      },
      stdio: 'pipe',
    });
    console.log('[GlobalSetup] Migrations applied successfully');
  } catch (error) {
    console.error('[GlobalSetup] Migration failed:', error);
    await deleteTestBranch(branch.id);
    throw error;
  }

  // 11. Store branch ID for teardown
  (globalThis as Record<string, unknown>).__UNIT_BRANCH_ID__ = branch.id;
  (globalThis as Record<string, unknown>).__BRANCH_CREATED_AT__ = Date.now();

  console.log('\n=== Global Setup Complete ===\n');
}

