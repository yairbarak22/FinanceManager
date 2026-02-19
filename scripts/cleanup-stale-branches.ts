/**
 * Cleanup Stale Test Branches
 *
 * Deletes Neon test branches older than 3 hours.
 * Designed to run daily via GitHub Actions scheduled workflow or manually.
 *
 * Usage:
 *   npx tsx scripts/cleanup-stale-branches.ts
 *
 * Required env vars:
 *   NEON_API_KEY      - Neon API key
 *   NEON_PROJECT_ID   - Neon project ID
 */

import { listAllBranches, deleteTestBranch } from '../tests/setup/neon-branch';

const MAX_BRANCH_AGE_MS = 3 * 60 * 60 * 1000; // 3 hours
const TEST_BRANCH_PATTERN = /^(test|e2e|unit|integration)-/;

async function cleanupStaleBranches(): Promise<void> {
  console.log('=== Neon Test Branch Cleanup ===');
  console.log(`Max branch age: ${MAX_BRANCH_AGE_MS / 1000 / 60} minutes`);

  try {
    const branches = await listAllBranches();
    const now = Date.now();
    let deletedCount = 0;
    let skippedCount = 0;

    console.log(`Found ${branches.length} total branches`);

    for (const branch of branches) {
      // Only cleanup test branches (named test-*, unit-*, e2e-*, integration-*)
      if (!TEST_BRANCH_PATTERN.test(branch.name)) {
        continue;
      }

      const branchAge = now - new Date(branch.created_at).getTime();
      const ageMinutes = Math.round(branchAge / 1000 / 60);

      if (branchAge > MAX_BRANCH_AGE_MS) {
        console.log(
          `Deleting stale branch: ${branch.name} (${branch.id}), age: ${ageMinutes}min`
        );
        await deleteTestBranch(branch.id);
        deletedCount++;
      } else {
        console.log(
          `Keeping branch: ${branch.name} (${branch.id}), age: ${ageMinutes}min`
        );
        skippedCount++;
      }
    }

    console.log('\n=== Cleanup Summary ===');
    console.log(`Deleted: ${deletedCount} stale branches`);
    console.log(`Kept: ${skippedCount} recent branches`);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupStaleBranches();

