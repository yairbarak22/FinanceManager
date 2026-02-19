/**
 * Vitest Global Teardown
 *
 * Runs once after ALL test files. Deletes the Neon test branch
 * and cleans up environment variables.
 */

import { deleteTestBranch } from './neon-branch';
import { clearTestEnvironment } from './env-isolation';

export default async function globalTeardown(): Promise<void> {
  console.log('\n=== Vitest Global Teardown ===\n');

  const branchId = (globalThis as Record<string, unknown>).__UNIT_BRANCH_ID__ as
    | string
    | undefined;

  if (!branchId) {
    console.log('[GlobalTeardown] No branch ID found – skipping cleanup');
    return;
  }

  try {
    await deleteTestBranch(branchId);
    console.log(`[GlobalTeardown] Branch ${branchId} deleted successfully`);
  } catch (error) {
    console.error(`[GlobalTeardown] Failed to delete branch ${branchId}:`, error);
    // Don't throw – cleanup failures should not fail the test run
  }

  // Clean up environment variables
  clearTestEnvironment('unit');

  // Clear global state
  delete (globalThis as Record<string, unknown>).__UNIT_BRANCH_ID__;
  delete (globalThis as Record<string, unknown>).__BRANCH_CREATED_AT__;

  console.log('\n=== Global Teardown Complete ===\n');
}

