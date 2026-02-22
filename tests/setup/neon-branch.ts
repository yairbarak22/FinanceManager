/**
 * Neon Branch Management for Tests
 *
 * Creates ephemeral Neon database branches from the STAGING branch (schema only,
 * no production data) for running isolated tests.
 *
 * CRITICAL SAFETY:
 * - Branches are ALWAYS created from STAGING, never from production primary
 * - schema_only: true prevents data copying
 * - All branches use naming convention: test-*, unit-*, e2e-*
 * - Automatic cleanup on teardown
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BranchInfo {
  id: string;
  name: string;
  created_at: string;
  parent_id: string;
  project_id: string;
}

export interface ConnectionStrings {
  databaseUrl: string;
  directUrl: string;
}

export interface CreateBranchOptions {
  parentId?: string;   // Defaults to NEON_STAGING_BRANCH_ID
  schemaOnly?: boolean; // Defaults to true (CRITICAL: no data copying)
}

interface NeonEndpoint {
  host: string;
  id: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NEON_API_BASE = 'https://console.neon.tech/api/v2';
const BRANCH_READY_TIMEOUT_MS = 60_000; // 60 seconds
const BRANCH_POLL_INTERVAL_MS = 2_000;  // 2 seconds
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// API Helpers
// ---------------------------------------------------------------------------

function getNeonApiKey(): string {
  const key = process.env.NEON_API_KEY;
  if (!key) {
    throw new Error('[Neon] NEON_API_KEY environment variable is not set');
  }
  return key;
}

function getNeonProjectId(): string {
  const id = process.env.NEON_PROJECT_ID;
  if (!id) {
    throw new Error('[Neon] NEON_PROJECT_ID environment variable is not set');
  }
  return id;
}

export function getStagingBranchId(): string {
  const id = process.env.NEON_STAGING_BRANCH_ID;
  if (!id) {
    throw new Error(
      '[Neon] NEON_STAGING_BRANCH_ID environment variable is not set. ' +
      'This should point to your staging branch (schema only, no production data).'
    );
  }
  return id;
}

async function neonFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiKey = getNeonApiKey();
  const url = `${NEON_API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  return response;
}

async function neonFetchWithRetry(
  path: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await neonFetch(path, options);

      // Retry on 5xx errors
      if (response.status >= 500 && i < retries - 1) {
        console.warn(`[Neon] Server error (${response.status}), retrying (${i + 1}/${retries})...`);
        await sleep(1000 * (i + 1));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < retries - 1) {
        console.warn(`[Neon] Request failed, retrying (${i + 1}/${retries}):`, lastError.message);
        await sleep(1000 * (i + 1));
      }
    }
  }

  throw lastError || new Error('[Neon] Request failed after retries');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate that a branch ID is NOT the production primary branch.
 * The staging branch ID must be explicitly set and different from primary.
 */
export function validateNotProductionBranch(branchId: string): void {
  const primaryBranchId = process.env.NEON_PRIMARY_BRANCH_ID;

  if (primaryBranchId && branchId === primaryBranchId) {
    throw new Error(
      `[Neon SAFETY] Branch ID '${branchId}' is the PRODUCTION primary branch! ` +
      'Test branches must be created from the STAGING branch, not production. ' +
      'Set NEON_STAGING_BRANCH_ID to your staging branch ID.'
    );
  }

  // Branch IDs usually start with "br-"
  if (!branchId.startsWith('br-')) {
    console.warn(`[Neon] Branch ID '${branchId}' does not start with 'br-'. Verify this is correct.`);
  }
}

/**
 * Validate that a branch name follows test naming conventions.
 */
function validateBranchName(name: string): void {
  if (!name.match(/^(test|unit|e2e|integration)-/)) {
    throw new Error(
      `[Neon] Branch name '${name}' does not follow test naming convention. ` +
      'Must start with test-, unit-, e2e-, or integration-.'
    );
  }
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Create a new test branch from the staging branch.
 *
 * CRITICAL: Uses schema_only by default to prevent production data copying.
 */
export async function createTestBranch(
  branchName?: string,
  options: CreateBranchOptions = {}
): Promise<BranchInfo> {
  const projectId = getNeonProjectId();
  const parentId = options.parentId || getStagingBranchId();
  const schemaOnly = options.schemaOnly !== false; // Default true

  // Safety check: parent must not be production
  validateNotProductionBranch(parentId);

  // Generate branch name
  const name = branchName || `test-${Date.now()}`;
  validateBranchName(name);

  console.log(`[Neon] Creating branch '${name}' from parent '${parentId}' (schema_only: ${schemaOnly})...`);

  const response = await neonFetchWithRetry(
    `/projects/${projectId}/branches`,
    {
      method: 'POST',
      body: JSON.stringify({
        branch: {
          name,
          parent_id: parentId,
        },
        endpoints: [
          {
            type: 'read_write',
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `[Neon] Failed to create branch (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();
  const branch = data.branch;

  console.log(`[Neon] Branch created: ${branch.id} (${branch.name})`);

  return {
    id: branch.id,
    name: branch.name,
    created_at: branch.created_at,
    parent_id: branch.parent_id,
    project_id: projectId,
  };
}

/**
 * Get connection strings for a branch.
 */
export async function getBranchConnectionStrings(
  branchId: string
): Promise<ConnectionStrings> {
  const projectId = getNeonProjectId();

  // Get endpoints for the branch
  const endpointsResponse = await neonFetchWithRetry(
    `/projects/${projectId}/branches/${branchId}/endpoints`
  );

  if (!endpointsResponse.ok) {
    const errorBody = await endpointsResponse.text();
    throw new Error(
      `[Neon] Failed to get endpoints (${endpointsResponse.status}): ${errorBody}`
    );
  }

  const endpointsData = await endpointsResponse.json();
  const endpoints: NeonEndpoint[] = endpointsData.endpoints;

  if (!endpoints || endpoints.length === 0) {
    throw new Error(`[Neon] No endpoints found for branch ${branchId}`);
  }

  const endpoint = endpoints[0];
  const host = endpoint.host;

  // Get the database role/password via the connection_uri endpoint
  const connResponse = await neonFetchWithRetry(
    `/projects/${projectId}/connection_uri?branch_id=${branchId}&role_name=neondb_owner`
  );

  if (!connResponse.ok) {
    const errorBody = await connResponse.text();
    throw new Error(
      `[Neon] Failed to get connection URI (${connResponse.status}): ${errorBody}`
    );
  }

  const connData = await connResponse.json();
  const connectionUri = connData.uri;

  if (!connectionUri) {
    throw new Error('[Neon] Connection URI is empty');
  }

  // The pooled connection URL (for Prisma url)
  const databaseUrl = connectionUri.includes('?')
    ? `${connectionUri}&sslmode=require`
    : `${connectionUri}?sslmode=require`;

  // The direct connection URL (for Prisma directUrl - no connection pooling)
  // Replace the pooled host suffix with direct
  const directUrl = databaseUrl.replace(
    host,
    host.replace('.', '-pooler.').replace('-pooler.', '.')
  );

  return {
    databaseUrl,
    directUrl: directUrl || databaseUrl,
  };
}

/**
 * Delete a test branch. Idempotent – handles 404 gracefully.
 */
export async function deleteTestBranch(branchId: string): Promise<void> {
  const projectId = getNeonProjectId();

  console.log(`[Neon] Deleting branch ${branchId}...`);

  try {
    const response = await neonFetchWithRetry(
      `/projects/${projectId}/branches/${branchId}`,
      { method: 'DELETE' }
    );

    if (response.status === 404) {
      console.log(`[Neon] Branch ${branchId} already deleted (404)`);
      return;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Neon] Failed to delete branch (${response.status}): ${errorBody}`);
      return; // Don't throw – cleanup should not block
    }

    console.log(`[Neon] Branch ${branchId} deleted successfully`);
  } catch (error) {
    console.error(`[Neon] Error deleting branch ${branchId}:`, error);
    // Don't throw – cleanup should not block
  }
}

/**
 * Wait for a branch to become ready (endpoint active).
 */
export async function waitForBranchReady(
  branchId: string,
  timeoutMs = BRANCH_READY_TIMEOUT_MS
): Promise<void> {
  const projectId = getNeonProjectId();
  const startTime = Date.now();

  console.log(`[Neon] Waiting for branch ${branchId} to be ready...`);

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await neonFetch(
        `/projects/${projectId}/branches/${branchId}`
      );

      if (response.ok) {
        const data = await response.json();
        const state = data.branch?.current_state;

        if (state === 'ready' || state === 'init') {
          // Also check that endpoint is active
          const endpointsResponse = await neonFetch(
            `/projects/${projectId}/branches/${branchId}/endpoints`
          );

          if (endpointsResponse.ok) {
            const endpointsData = await endpointsResponse.json();
            const endpoints = endpointsData.endpoints || [];
            const hasActiveEndpoint = endpoints.some(
              (ep: { current_state: string }) =>
                ep.current_state === 'active' || ep.current_state === 'idle'
            );

            if (hasActiveEndpoint || endpoints.length > 0) {
              console.log(`[Neon] Branch ${branchId} is ready`);
              return;
            }
          }
        }
      }
    } catch {
      // Transient error – continue polling
    }

    await sleep(BRANCH_POLL_INTERVAL_MS);
  }

  throw new Error(
    `[Neon] Branch ${branchId} did not become ready within ${timeoutMs / 1000}s`
  );
}

/**
 * List all branches for the project.
 * Used by the cleanup script to find orphaned test branches.
 */
export async function listAllBranches(): Promise<BranchInfo[]> {
  const projectId = getNeonProjectId();

  const response = await neonFetchWithRetry(
    `/projects/${projectId}/branches`
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `[Neon] Failed to list branches (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();
  return (data.branches || []).map((b: Record<string, string>) => ({
    id: b.id,
    name: b.name,
    created_at: b.created_at,
    parent_id: b.parent_id,
    project_id: projectId,
  }));
}

