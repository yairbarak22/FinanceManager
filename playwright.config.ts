import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 *
 * E2E tests run against a Neon branch database (not production).
 * See tests/e2e/global-setup.ts for branch creation.
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',

  // Global setup/teardown (creates/deletes Neon branch)
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',

  // Timeouts
  timeout: 60_000,       // 60 seconds per test
  expect: {
    timeout: 10_000,     // 10 seconds for assertions
  },

  // Retries
  retries: process.env.CI ? 2 : 0,

  // Parallelism
  fullyParallel: false, // Sequential to avoid DB conflicts
  workers: 1,           // Single worker for DB safety

  // Reporter
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'on-failure' }]],

  // Shared settings
  use: {
    // Base URL for the test server
    baseURL: process.env.TEST_SERVER_URL || 'http://localhost:3000',

    // Trace and screenshots
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',

    // Extra HTTP headers
    extraHTTPHeaders: {
      'X-CSRF-Protection': '1',
    },
  },

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add more browsers as needed
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
  ],

  // Development server (start automatically if needed)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NODE_ENV: 'test',
      TEST_TYPE: 'e2e',
    },
  },

  // Output directory for test artifacts
  outputDir: './test-results',
});

