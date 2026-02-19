/**
 * Playwright Global Teardown
 *
 * Deletes the Neon E2E test branch.
 */

async function globalTeardown(): Promise<void> {
  console.log('\n=== Playwright E2E Global Teardown ===\n');

  const branchId = process.env.__E2E_BRANCH_ID__;

  if (!branchId) {
    console.log('[E2E Teardown] No branch ID found – skipping cleanup');
    return;
  }

  try {
    const { deleteTestBranch } = await import('../setup/neon-branch');
    await deleteTestBranch(branchId);
    console.log(`[E2E Teardown] Branch ${branchId} deleted`);
  } catch (error) {
    console.error(`[E2E Teardown] Failed to delete branch ${branchId}:`, error);
  }

  delete process.env.__E2E_BRANCH_ID__;
  delete process.env.__E2E_BRANCH_CREATED_AT__;

  console.log('\n=== E2E Global Teardown Complete ===\n');
}

export default globalTeardown;

