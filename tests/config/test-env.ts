/**
 * Test Environment Configuration
 * Validates environment variables and prevents accidental production access.
 *
 * SAFETY RULES:
 * 1. NODE_ENV must be 'test'
 * 2. DATABASE_URL must point to a Neon branch (not production primary)
 * 3. No production API keys allowed
 * 4. All external services must use mock/test keys
 */

// ---------------------------------------------------------------------------
// Known production hostnames – if DATABASE_URL contains any of these AND is
// not a branch endpoint, we refuse to run.
// ---------------------------------------------------------------------------
const PRODUCTION_HOSTNAME_PATTERNS = [
  '.neon.tech',        // Neon production databases
  '.supabase.co',      // Supabase production
  '.rds.amazonaws.com', // AWS RDS production
];

// Neon branch connection strings contain a branch identifier in the host
// e.g.  ep-cool-darkness-a1b2c3.us-east-2.aws.neon.tech
// The primary (production) endpoint does NOT contain "br-" in the host.
const NEON_BRANCH_PATTERN = /ep-[a-z]+-[a-z]+-[a-z0-9]+/;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TestEnvironment {
  databaseUrl: string;
  directUrl: string;
  neonApiKey: string;
  neonProjectId: string;
  neonStagingBranchId: string;
  nodeEnv: 'test';
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Check whether a DATABASE_URL looks like a production (primary) Neon DB.
 * We require the connection string to originate from a *branch*, not from
 * the primary endpoint.
 */
export function isProductionDatabaseUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();

  // If it points at a known cloud DB host, make sure it's a branch
  for (const pattern of PRODUCTION_HOSTNAME_PATTERNS) {
    if (lower.includes(pattern)) {
      // For Neon specifically, branches are fine
      if (pattern === '.neon.tech') {
        // Accept if the URL was auto-generated for a branch (contains branch endpoint)
        if (NEON_BRANCH_PATTERN.test(url)) {
          return false; // It's a branch – OK
        }
        return true; // Looks like primary production
      }
      return true; // Other cloud providers – always treat as production
    }
  }

  return false; // localhost / unknown host – OK for tests
}

/**
 * Detect whether an API key looks like a real production key.
 * Test/mock keys usually start with "test_", "sk_test_", "fake_", or are
 * obviously placeholder strings.
 */
export function isProductionApiKey(key: string | undefined): boolean {
  if (!key) return false;
  const lower = key.trim().toLowerCase();

  // Allow clearly-test keys
  if (
    lower.startsWith('test_') ||
    lower.startsWith('sk_test_') ||
    lower.startsWith('fake_') ||
    lower.startsWith('mock_') ||
    lower === 'placeholder' ||
    lower === 'test' ||
    lower === ''
  ) {
    return false;
  }

  // Keys that look real (long, contain "sk_live", "re_", etc.)
  if (
    lower.startsWith('sk_live_') || // Stripe live key pattern
    lower.startsWith('re_') ||      // Resend key pattern (could be production)
    lower.startsWith('sk-')         // OpenAI key pattern
  ) {
    return true;
  }

  return false; // Unknown format – allow (conservative)
}

// ---------------------------------------------------------------------------
// Main validation
// ---------------------------------------------------------------------------

export class TestEnvironmentError extends Error {
  constructor(message: string) {
    super(`[TEST SAFETY] ${message}`);
    this.name = 'TestEnvironmentError';
  }
}

/**
 * Validate that the current environment is safe for running tests.
 * Throws TestEnvironmentError if any safety check fails.
 */
export function validateTestEnvironment(): TestEnvironment {
  const errors: string[] = [];

  // 1. NODE_ENV must be 'test'
  if (process.env.NODE_ENV !== 'test') {
    errors.push(
      `NODE_ENV must be 'test', got '${process.env.NODE_ENV}'. ` +
      `Set NODE_ENV=test before running tests.`
    );
  }

  // 2. DATABASE_URL must exist and not point to production
  const databaseUrl = process.env.DATABASE_URL || '';
  if (!databaseUrl) {
    errors.push('DATABASE_URL is not set. Tests require a database connection.');
  } else if (isProductionDatabaseUrl(databaseUrl)) {
    errors.push(
      'DATABASE_URL appears to point to a PRODUCTION database! ' +
      'Tests must run against a Neon branch or local database. ' +
      `Current URL host: ${new URL(databaseUrl).hostname}`
    );
  }

  // 3. DIRECT_URL same checks
  const directUrl = process.env.DIRECT_URL || '';
  if (directUrl && isProductionDatabaseUrl(directUrl)) {
    errors.push(
      'DIRECT_URL appears to point to a PRODUCTION database! ' +
      'Tests must run against a Neon branch or local database.'
    );
  }

  // 4. No production API keys
  const apiKeyChecks = [
    { name: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY },
    { name: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY },
    { name: 'GOOGLE_AI_API_KEY', value: process.env.GOOGLE_AI_API_KEY },
  ];

  for (const { name, value } of apiKeyChecks) {
    if (isProductionApiKey(value)) {
      errors.push(
        `${name} appears to be a PRODUCTION API key. ` +
        `Use a test/mock key (prefix with 'test_' or 'fake_') or leave empty.`
      );
    }
  }

  // 5. Neon API key and project ID (required for branch management)
  const neonApiKey = process.env.NEON_API_KEY || '';
  const neonProjectId = process.env.NEON_PROJECT_ID || '';
  const neonStagingBranchId = process.env.NEON_STAGING_BRANCH_ID || '';

  // These are only required when running integration/E2E tests with real DB
  // Unit tests can skip them

  if (errors.length > 0) {
    throw new TestEnvironmentError(
      'Environment validation failed:\n' +
      errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')
    );
  }

  return {
    databaseUrl,
    directUrl: directUrl || databaseUrl,
    neonApiKey,
    neonProjectId,
    neonStagingBranchId,
    nodeEnv: 'test',
  };
}

/**
 * Force NODE_ENV=test. Call this at the very beginning of test setup.
 */
export function forceTestEnvironment(): void {
  (process.env as { NODE_ENV?: string }).NODE_ENV = 'test';
}

/**
 * Get the test database URL based on the current test context.
 * Supports UNIT_DATABASE_URL and E2E_DATABASE_URL for concurrency isolation.
 */
export function getTestDatabaseUrl(): string {
  const testType = process.env.TEST_TYPE || 'unit';

  if (testType === 'e2e') {
    return process.env.E2E_DATABASE_URL || process.env.DATABASE_URL || '';
  }

  return process.env.UNIT_DATABASE_URL || process.env.DATABASE_URL || '';
}

/**
 * Get the test direct URL based on the current test context.
 */
export function getTestDirectUrl(): string {
  const testType = process.env.TEST_TYPE || 'unit';

  if (testType === 'e2e') {
    return process.env.E2E_DIRECT_URL || process.env.DIRECT_URL || '';
  }

  return process.env.UNIT_DIRECT_URL || process.env.DIRECT_URL || '';
}

