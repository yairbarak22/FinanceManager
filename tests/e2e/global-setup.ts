/**
 * Playwright Global Setup
 *
 * Creates a Neon branch for E2E tests and sets up the test environment.
 */

import { execSync } from 'child_process';
import type { FullConfig } from '@playwright/test';

// We use dynamic imports because these are TS files
async function globalSetup(config: FullConfig): Promise<void> {
  console.log('\n=== Playwright E2E Global Setup ===\n');

  // Force test environment
  process.env.NODE_ENV = 'test';
  process.env.TEST_TYPE = 'e2e';

  // Check if we need to create a Neon branch
  const neonApiKey = process.env.NEON_API_KEY;
  const neonProjectId = process.env.NEON_PROJECT_ID;
  const neonStagingBranchId = process.env.NEON_STAGING_BRANCH_ID;

  if (!neonApiKey || !neonProjectId || !neonStagingBranchId) {
    console.log('[E2E Setup] Neon credentials not configured – skipping branch creation');
    console.log('[E2E Setup] E2E tests will use existing DATABASE_URL\n');
    return;
  }

  // Dynamic imports
  const { createTestBranch, getBranchConnectionStrings, waitForBranchReady, deleteTestBranch, validateNotProductionBranch } =
    await import('../setup/neon-branch');
  const { setTestEnvironment } = await import('../setup/env-isolation');

  // Validate staging branch is not production
  validateNotProductionBranch(neonStagingBranchId);

  console.log(`[E2E Setup] Creating branch from staging: ${neonStagingBranchId}`);

  // Create branch
  const branch = await createTestBranch(`e2e-${Date.now()}`, {
    parentId: neonStagingBranchId,
    schemaOnly: true,
  });

  // Wait for ready
  await waitForBranchReady(branch.id);

  // Get connection strings
  const connections = await getBranchConnectionStrings(branch.id);

  // Set env vars
  setTestEnvironment('e2e', connections.databaseUrl, connections.directUrl);
  process.env.__E2E_BRANCH_ID__ = branch.id;
  process.env.__E2E_BRANCH_CREATED_AT__ = Date.now().toString();

  // Run migrations
  console.log('[E2E Setup] Running Prisma migrations...');
  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      env: {
        ...process.env,
        DATABASE_URL: connections.databaseUrl,
        DIRECT_URL: connections.directUrl,
      },
      stdio: 'pipe',
    });
    console.log('[E2E Setup] Migrations applied');
  } catch (error) {
    console.error('[E2E Setup] Migration failed:', error);
    await deleteTestBranch(branch.id);
    throw error;
  }

  // Register cleanup handler
  const cleanup = async () => {
    console.log(`[E2E Setup] Emergency cleanup: deleting branch ${branch.id}`);
    try { await deleteTestBranch(branch.id); } catch { /* ignore */ }
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  console.log('\n=== E2E Global Setup Complete ===\n');
}

export default globalSetup;

