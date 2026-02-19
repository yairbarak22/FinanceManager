#!/usr/bin/env tsx
/**
 * Test Setup Verification Script
 *
 * Validates all environment configuration and connectivity before running tests.
 * Run with:  npm run test:verify
 *
 * Exit codes:
 *   0 – All checks passed, ready to run tests
 *   1 – Critical checks failed (missing env vars, API failure)
 *   2 – Warnings present but non-critical
 */

import * as fs from 'fs';
import * as path from 'path';
import { isProductionApiKey, isProductionDatabaseUrl } from '../tests/config/test-env';

// ---------------------------------------------------------------------------
// ANSI Colors (works in most terminals)
// ---------------------------------------------------------------------------
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function pass(msg: string) { console.log(`  ${GREEN}✅ ${msg}${RESET}`); }
function fail(msg: string) { console.log(`  ${RED}❌ ${msg}${RESET}`); }
function warn(msg: string) { console.log(`  ${YELLOW}⚠️  ${msg}${RESET}`); }
function info(msg: string) { console.log(`  ${DIM}   ${msg}${RESET}`); }
function header(msg: string) { console.log(`\n${CYAN}${BOLD}━━━ ${msg} ━━━${RESET}`); }

// ---------------------------------------------------------------------------
// Result tracking
// ---------------------------------------------------------------------------
let criticalFailures = 0;
let warnings = 0;

function recordPass(msg: string) { pass(msg); }
function recordFail(msg: string) { fail(msg); criticalFailures++; }
function recordWarn(msg: string) { warn(msg); warnings++; }

// ---------------------------------------------------------------------------
// Phase 0: Load .env.test
// ---------------------------------------------------------------------------
function loadEnvTestFile(): void {
  header('Phase 0: Loading Environment');

  const envTestPath = path.resolve(process.cwd(), '.env.test');

  if (!fs.existsSync(envTestPath)) {
    recordWarn('.env.test file not found — using current environment variables');
    return;
  }

  const content = fs.readFileSync(envTestPath, 'utf-8');
  let loaded = 0;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      // Strip inline comments (only for unquoted values)
      // e.g.  MY_VAR=value   # some comment
      const commentIndex = value.indexOf('#');
      if (commentIndex > 0) {
        value = value.slice(0, commentIndex).trim();
      }
    }

    // Only set if not already defined (allow shell overrides)
    if (process.env[key] === undefined) {
      process.env[key] = value;
      loaded++;
    }
  }

  recordPass(`.env.test loaded (${loaded} variables set)`);
}

// ---------------------------------------------------------------------------
// Phase 1: Environment Variables Validation
// ---------------------------------------------------------------------------
function validateEnvironmentVariables(): void {
  header('Phase 1: Environment Variables');

  // NODE_ENV
  (process.env as { NODE_ENV?: string }).NODE_ENV = 'test'; // Force for this verification script
  recordPass('NODE_ENV = test');

  // NEON_API_KEY
  const neonApiKey = process.env.NEON_API_KEY || '';
  if (!neonApiKey) {
    recordFail('NEON_API_KEY is not set');
  } else {
    recordPass('NEON_API_KEY is set');
    // Check format (Neon keys typically start with napi_ or are long alphanumeric strings)
    if (neonApiKey.length < 10) {
      recordWarn(`NEON_API_KEY seems too short (${neonApiKey.length} chars)`);
    }
  }

  // NEON_PROJECT_ID
  const neonProjectId = process.env.NEON_PROJECT_ID || '';
  if (!neonProjectId) {
    recordFail('NEON_PROJECT_ID is not set');
  } else {
    recordPass(`NEON_PROJECT_ID is set: ${neonProjectId}`);
  }

  // NEON_STAGING_BRANCH_ID
  const neonStagingBranchId = process.env.NEON_STAGING_BRANCH_ID || '';
  if (!neonStagingBranchId) {
    recordFail('NEON_STAGING_BRANCH_ID is not set');
  } else {
    if (!neonStagingBranchId.startsWith('br-')) {
      recordWarn(`NEON_STAGING_BRANCH_ID does not start with 'br-': ${neonStagingBranchId}`);
    } else {
      recordPass(`NEON_STAGING_BRANCH_ID is set: ${neonStagingBranchId}`);
    }
  }

  // Production API key checks
  const apiKeys = [
    { name: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY },
    { name: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY },
    { name: 'GOOGLE_AI_API_KEY', value: process.env.GOOGLE_AI_API_KEY },
  ];

  for (const { name, value } of apiKeys) {
    if (isProductionApiKey(value)) {
      recordFail(`${name} looks like a PRODUCTION key — use a test/mock key or leave empty`);
    } else if (value) {
      recordPass(`${name} is set (non-production)`);
    } else {
      recordPass(`${name} is empty (will be mocked in tests)`);
    }
  }

  // DATABASE_URL (if set already, validate it)
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl) {
    if (isProductionDatabaseUrl(dbUrl)) {
      recordFail('DATABASE_URL points to a PRODUCTION database!');
    } else {
      recordPass('DATABASE_URL is set and not production');
    }
  } else {
    recordPass('DATABASE_URL is empty (will be set dynamically by test setup via Neon branch)');
  }
}

// ---------------------------------------------------------------------------
// Phase 2: Neon API Connectivity Test
// ---------------------------------------------------------------------------
async function testNeonApiConnectivity(): Promise<void> {
  header('Phase 2: Neon API Connectivity');

  const neonApiKey = process.env.NEON_API_KEY;
  const neonProjectId = process.env.NEON_PROJECT_ID;

  if (!neonApiKey || !neonProjectId) {
    recordFail('Cannot test Neon API — NEON_API_KEY or NEON_PROJECT_ID is missing');
    return;
  }

  try {
    const response = await fetch(
      `https://console.neon.tech/api/v2/projects/${neonProjectId}`,
      {
        headers: {
          'Authorization': `Bearer ${neonApiKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (response.status === 401) {
      recordFail('Neon API returned 401 Unauthorized — API key is invalid');
      return;
    }

    if (response.status === 404) {
      recordFail(`Neon project '${neonProjectId}' not found — check NEON_PROJECT_ID`);
      return;
    }

    if (!response.ok) {
      const body = await response.text();
      recordFail(`Neon API returned ${response.status}: ${body.slice(0, 200)}`);
      return;
    }

    const data = await response.json();
    const project = data.project;
    recordPass(`Neon API connected successfully`);
    info(`Project name: ${project.name}`);
    info(`Region: ${project.region_id}`);
    info(`Created: ${project.created_at}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    recordFail(`Neon API connection failed: ${msg}`);
  }
}

// ---------------------------------------------------------------------------
// Phase 3: Staging Branch Verification
// ---------------------------------------------------------------------------
async function verifyStagingBranch(): Promise<void> {
  header('Phase 3: Staging Branch Verification');

  const neonApiKey = process.env.NEON_API_KEY;
  const neonProjectId = process.env.NEON_PROJECT_ID;
  const neonStagingBranchId = process.env.NEON_STAGING_BRANCH_ID;

  if (!neonApiKey || !neonProjectId || !neonStagingBranchId) {
    recordFail('Cannot verify staging branch — missing NEON_API_KEY, NEON_PROJECT_ID, or NEON_STAGING_BRANCH_ID');
    return;
  }

  try {
    // Fetch branch details
    const branchResponse = await fetch(
      `https://console.neon.tech/api/v2/projects/${neonProjectId}/branches/${neonStagingBranchId}`,
      {
        headers: {
          'Authorization': `Bearer ${neonApiKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (branchResponse.status === 404) {
      recordFail(`Staging branch '${neonStagingBranchId}' not found — check NEON_STAGING_BRANCH_ID`);
      return;
    }

    if (!branchResponse.ok) {
      const body = await branchResponse.text();
      recordFail(`Failed to fetch staging branch (${branchResponse.status}): ${body.slice(0, 200)}`);
      return;
    }

    const branchData = await branchResponse.json();
    const branch = branchData.branch;

    recordPass(`Staging branch found: ${branch.name}`);
    info(`Branch ID: ${branch.id}`);
    info(`Created: ${branch.created_at}`);
    info(`Parent: ${branch.parent_id || '(root/primary)'}`);
    info(`State: ${branch.current_state}`);

    // Safety check: verify this is NOT the primary branch
    if (branch.primary === true) {
      recordFail('NEON_STAGING_BRANCH_ID points to the PRIMARY (production) branch!');
      info('The staging branch must be a separate branch, NOT the primary.');
      info('Create a new branch from primary (schema only, no data) for staging.');
    } else {
      recordPass('Staging branch is NOT the primary branch (safe)');
    }

    // Check branch name pattern (informational)
    const name = (branch.name || '').toLowerCase();
    if (name.includes('staging') || name.includes('schema') || name.includes('test')) {
      recordPass(`Branch name follows expected pattern: "${branch.name}"`);
    } else {
      recordWarn(`Branch name "${branch.name}" does not contain 'staging', 'schema', or 'test' — verify this is the correct branch`);
    }

    // List all branches to verify primary is different
    const branchesResponse = await fetch(
      `https://console.neon.tech/api/v2/projects/${neonProjectId}/branches`,
      {
        headers: {
          'Authorization': `Bearer ${neonApiKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (branchesResponse.ok) {
      const branchesData = await branchesResponse.json();
      const branches = branchesData.branches || [];
      const primaryBranch = branches.find((b: { primary?: boolean }) => b.primary === true);

      if (primaryBranch) {
        if (primaryBranch.id === neonStagingBranchId) {
          recordFail('Staging branch ID matches the primary branch — this is DANGEROUS!');
        } else {
          recordPass(`Primary branch is "${primaryBranch.name}" (${primaryBranch.id}) — different from staging`);
        }
      }

      // Count existing test branches
      const testBranches = branches.filter((b: { name: string }) =>
        /^(test|unit|e2e|integration)-/.test(b.name)
      );
      if (testBranches.length > 0) {
        recordWarn(`Found ${testBranches.length} existing test branch(es) — consider running 'npm run cleanup:branches'`);
        for (const tb of testBranches) {
          info(`  - ${tb.name} (${tb.id}) created ${tb.created_at}`);
        }
      } else {
        recordPass('No orphaned test branches found');
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    recordFail(`Staging branch verification failed: ${msg}`);
  }
}

// ---------------------------------------------------------------------------
// Phase 4: Test Database Connection (optional)
// ---------------------------------------------------------------------------
async function testDatabaseConnection(): Promise<void> {
  header('Phase 4: Test Database Connection (optional)');

  const needsDb = process.env.TEST_NEEDS_DB === 'true';

  if (!needsDb) {
    recordPass('TEST_NEEDS_DB is not set — skipping live database test');
    info('To test full branch creation, run: TEST_NEEDS_DB=true npm run test:verify');
    return;
  }

  const neonApiKey = process.env.NEON_API_KEY;
  const neonProjectId = process.env.NEON_PROJECT_ID;
  const neonStagingBranchId = process.env.NEON_STAGING_BRANCH_ID;

  if (!neonApiKey || !neonProjectId || !neonStagingBranchId) {
    recordFail('Cannot test DB connection — missing Neon configuration');
    return;
  }

  let testBranchId: string | null = null;

  try {
    // Create a temporary test branch
    info('Creating temporary test branch (schema only)...');

    const createResponse = await fetch(
      `https://console.neon.tech/api/v2/projects/${neonProjectId}/branches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${neonApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          branch: {
            name: `test-verify-${Date.now()}`,
            parent_id: neonStagingBranchId,
          },
          endpoints: [{ type: 'read_write' }],
        }),
      }
    );

    if (!createResponse.ok) {
      const body = await createResponse.text();
      recordFail(`Failed to create test branch (${createResponse.status}): ${body.slice(0, 200)}`);
      return;
    }

    const createData = await createResponse.json();
    testBranchId = createData.branch?.id;
    recordPass(`Test branch created: ${createData.branch?.name} (${testBranchId})`);

    // Wait for branch to be ready (poll for up to 30s)
    info('Waiting for branch to become ready...');
    const startTime = Date.now();
    const timeout = 30_000;
    let ready = false;

    while (Date.now() - startTime < timeout) {
      const statusResponse = await fetch(
        `https://console.neon.tech/api/v2/projects/${neonProjectId}/branches/${testBranchId}/endpoints`,
        {
          headers: {
            'Authorization': `Bearer ${neonApiKey}`,
            'Accept': 'application/json',
          },
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const endpoints = statusData.endpoints || [];
        if (endpoints.length > 0) {
          ready = true;
          break;
        }
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    if (ready) {
      recordPass('Test branch is ready with active endpoint');
    } else {
      recordWarn('Test branch did not become ready within 30s — may need more time');
    }

    // Get connection string — try with common role names
    const roleNames = ['neondb_owner', 'neon_superuser', 'default'];
    let connRetrieved = false;

    for (const roleName of roleNames) {
      const connResponse = await fetch(
        `https://console.neon.tech/api/v2/projects/${neonProjectId}/connection_uri?branch_id=${testBranchId}&role_name=${roleName}&database_name=neondb`,
        {
          headers: {
            'Authorization': `Bearer ${neonApiKey}`,
            'Accept': 'application/json',
          },
        }
      );

      if (connResponse.ok) {
        const connData = await connResponse.json();
        if (connData.uri) {
          recordPass(`Connection string retrieved (role: ${roleName})`);
          const connUrl = new URL(connData.uri);
          info(`Host: ${connUrl.hostname}`);
          info(`Database: ${connUrl.pathname.slice(1)}`);
          connRetrieved = true;
          break;
        }
      }
    }

    if (!connRetrieved) {
      // Try listing roles to find the right one
      const rolesResponse = await fetch(
        `https://console.neon.tech/api/v2/projects/${neonProjectId}/branches/${testBranchId}/roles`,
        {
          headers: {
            'Authorization': `Bearer ${neonApiKey}`,
            'Accept': 'application/json',
          },
        }
      );

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        const roles = rolesData.roles || [];
        const roleNamesList = roles.map((r: { name: string }) => r.name).join(', ');
        recordWarn(`Could not retrieve connection string. Available roles: ${roleNamesList}`);
        info('The global-setup script handles this automatically — this is not a blocker.');
      } else {
        recordWarn('Could not retrieve connection string (role mismatch). The global-setup script handles this automatically.');
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    recordFail(`Database connection test failed: ${msg}`);
  } finally {
    // Always clean up the temporary branch
    if (testBranchId) {
      info('Cleaning up temporary test branch...');
      try {
        const deleteResponse = await fetch(
          `https://console.neon.tech/api/v2/projects/${neonProjectId}/branches/${testBranchId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${neonApiKey}`,
              'Accept': 'application/json',
            },
          }
        );
        if (deleteResponse.ok || deleteResponse.status === 404) {
          recordPass('Temporary test branch cleaned up');
        } else {
          recordWarn(`Failed to delete temporary branch (${deleteResponse.status}) — clean up manually`);
        }
      } catch {
        recordWarn('Failed to delete temporary branch — clean up manually with: npm run cleanup:branches');
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Phase 5: Unit Test Readiness Check
// ---------------------------------------------------------------------------
function checkTestReadiness(): void {
  header('Phase 5: Test Infrastructure Readiness');

  // Check Vitest is installed
  const vitestPath = path.resolve(process.cwd(), 'node_modules', 'vitest');
  if (fs.existsSync(vitestPath)) {
    recordPass('Vitest is installed');
  } else {
    recordFail('Vitest is not installed — run: npm install');
  }

  // Check Playwright is installed
  const playwrightPath = path.resolve(process.cwd(), 'node_modules', '@playwright', 'test');
  if (fs.existsSync(playwrightPath)) {
    recordPass('Playwright is installed');
  } else {
    recordWarn('Playwright is not installed — E2E tests will not work. Run: npm install');
  }

  // Check vitest.config.ts exists
  const vitestConfigPath = path.resolve(process.cwd(), 'vitest.config.ts');
  if (fs.existsSync(vitestConfigPath)) {
    recordPass('vitest.config.ts exists');
  } else {
    recordFail('vitest.config.ts is missing');
  }

  // Check unit test files exist
  const unitTestDir = path.resolve(process.cwd(), 'src', 'lib', '__tests__');
  if (fs.existsSync(unitTestDir)) {
    const testFiles = fs.readdirSync(unitTestDir).filter(f => f.endsWith('.test.ts'));
    if (testFiles.length > 0) {
      recordPass(`Found ${testFiles.length} unit test file(s) in src/lib/__tests__/`);
      for (const f of testFiles) {
        info(`  - ${f}`);
      }
    } else {
      recordWarn('No .test.ts files found in src/lib/__tests__/');
    }
  } else {
    recordWarn('src/lib/__tests__/ directory does not exist');
  }

  // Check integration test files
  const integrationTestDir = path.resolve(process.cwd(), 'tests', 'integration');
  if (fs.existsSync(integrationTestDir)) {
    const integrationFiles: string[] = [];
    function findTestFiles(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          findTestFiles(fullPath);
        } else if (entry.name.endsWith('.test.ts')) {
          integrationFiles.push(path.relative(process.cwd(), fullPath));
        }
      }
    }
    findTestFiles(integrationTestDir);

    if (integrationFiles.length > 0) {
      recordPass(`Found ${integrationFiles.length} integration test file(s)`);
      for (const f of integrationFiles) {
        info(`  - ${f}`);
      }
    } else {
      recordWarn('No integration test files found in tests/integration/');
    }
  } else {
    recordWarn('tests/integration/ directory does not exist');
  }

  // Check E2E test files
  const e2eTestDir = path.resolve(process.cwd(), 'tests', 'e2e');
  if (fs.existsSync(e2eTestDir)) {
    const e2eFiles = fs.readdirSync(e2eTestDir).filter(f => f.endsWith('.spec.ts'));
    if (e2eFiles.length > 0) {
      recordPass(`Found ${e2eFiles.length} E2E test file(s) in tests/e2e/`);
      for (const f of e2eFiles) {
        info(`  - ${f}`);
      }
    } else {
      recordWarn('No .spec.ts files found in tests/e2e/');
    }
  }

  // Check test factories
  const factoriesDir = path.resolve(process.cwd(), 'tests', 'factories');
  if (fs.existsSync(factoriesDir)) {
    const factoryFiles = fs.readdirSync(factoriesDir).filter(f => f.endsWith('.ts'));
    recordPass(`Found ${factoryFiles.length} test factory file(s)`);
  } else {
    recordWarn('tests/factories/ directory does not exist');
  }

  // Check test helpers
  const helpersDir = path.resolve(process.cwd(), 'tests', 'helpers');
  if (fs.existsSync(helpersDir)) {
    const helperFiles = fs.readdirSync(helpersDir).filter(f => f.endsWith('.ts'));
    recordPass(`Found ${helperFiles.length} test helper file(s)`);
  } else {
    recordWarn('tests/helpers/ directory does not exist');
  }

  // Check setup files
  const setupDir = path.resolve(process.cwd(), 'tests', 'setup');
  if (fs.existsSync(setupDir)) {
    const setupFiles = fs.readdirSync(setupDir).filter(f => f.endsWith('.ts'));
    recordPass(`Found ${setupFiles.length} test setup file(s)`);
    for (const f of setupFiles) {
      info(`  - ${f}`);
    }
  }

  // Check .gitignore protects .env.test
  const gitignorePath = path.resolve(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    if (gitignoreContent.includes('.env*') || gitignoreContent.includes('.env.test')) {
      recordPass('.gitignore protects .env.test from being committed');
    } else {
      recordFail('.gitignore does NOT ignore .env.test — secrets may leak to Git!');
    }
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
function printSummary(): void {
  console.log('\n');
  console.log(`${BOLD}${'═'.repeat(50)}${RESET}`);

  if (criticalFailures === 0 && warnings === 0) {
    console.log(`${GREEN}${BOLD}  All checks passed! Ready to run tests.${RESET}`);
    console.log(`\n  Next steps:`);
    console.log(`    ${DIM}npm run test${RESET}                           # Unit tests`);
    console.log(`    ${DIM}TEST_NEEDS_DB=true npm run test:verify${RESET}  # Full DB test`);
    console.log(`    ${DIM}npm run test:all${RESET}                       # All tests`);
  } else if (criticalFailures === 0) {
    console.log(`${YELLOW}${BOLD}  Passed with ${warnings} warning(s).${RESET}`);
    console.log(`\n  Unit tests should work. Review warnings above before integration tests.`);
    console.log(`\n  Next steps:`);
    console.log(`    ${DIM}npm run test${RESET}                           # Unit tests`);
  } else {
    console.log(`${RED}${BOLD}  ${criticalFailures} critical failure(s), ${warnings} warning(s).${RESET}`);
    console.log(`\n  Fix the issues above before running tests.`);
    console.log(`  Refer to ${CYAN}.env.test.example${RESET} for required variables.`);
  }

  console.log(`${BOLD}${'═'.repeat(50)}${RESET}\n`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log(`\n${BOLD}${CYAN}Test Setup Verification${RESET}`);
  console.log(`${DIM}Checking that everything is configured correctly...${RESET}`);

  // Phase 0: Load .env.test
  loadEnvTestFile();

  // Phase 1: Environment variables
  validateEnvironmentVariables();

  // Phase 2: Neon API (requires network)
  await testNeonApiConnectivity();

  // Phase 3: Staging branch
  await verifyStagingBranch();

  // Phase 4: Test DB connection (optional)
  await testDatabaseConnection();

  // Phase 5: Test infrastructure
  checkTestReadiness();

  // Summary
  printSummary();

  // Exit code
  if (criticalFailures > 0) {
    process.exit(1);
  } else if (warnings > 0) {
    process.exit(2);
  } else {
    process.exit(0);
  }
}

main().catch((error) => {
  console.error(`\n${RED}${BOLD}Unexpected error:${RESET}`, error);
  process.exit(1);
});

