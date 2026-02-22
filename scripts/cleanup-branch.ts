/**
 * Delete a specific Neon branch by ID.
 * Used by GitHub Actions always() cleanup step.
 *
 * Usage:
 *   npx tsx scripts/cleanup-branch.ts <branch-id>
 *
 * Required env vars:
 *   NEON_API_KEY      - Neon API key
 *   NEON_PROJECT_ID   - Neon project ID
 */

import { deleteTestBranch } from '../tests/setup/neon-branch';

async function main(): Promise<void> {
  const branchId = process.argv[2];

  if (!branchId) {
    console.log('No branch ID provided. Nothing to clean up.');
    process.exit(0);
  }

  console.log(`Cleaning up branch: ${branchId}`);

  try {
    await deleteTestBranch(branchId);
    console.log(`Branch ${branchId} cleaned up successfully`);
  } catch (error) {
    console.error(`Failed to clean up branch ${branchId}:`, error);
    // Don't exit with error – cleanup should not block CI
    process.exit(0);
  }
}

main();

