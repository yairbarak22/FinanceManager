import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Environment
    environment: 'node',

    // Global setup/teardown (creates/deletes Neon branch for integration tests)
    globalSetup: ['./tests/setup/global-setup.ts'],

    // Test file patterns
    include: [
      'src/**/__tests__/**/*.test.ts',    // Unit tests (co-located)
      'tests/**/*.test.ts',               // Integration tests
    ],
    exclude: [
      'node_modules',
      'tests/e2e/**',                     // E2E tests use Playwright
    ],

    // Timeouts
    testTimeout: 30_000,    // 30 seconds per test
    hookTimeout: 60_000,    // 60 seconds for hooks (DB setup)

    // Environment variables
    env: {
      NODE_ENV: 'test',
      TEST_TYPE: 'unit',
    },

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/lib/**/*.ts',
        'src/app/api/**/*.ts',
      ],
      exclude: [
        'src/lib/prisma.ts',      // Prisma client (tested via integration)
        'src/lib/config.ts',      // Config module
        'src/lib/smartlook.ts',   // Analytics
        'src/lib/mixpanel.ts',    // Analytics
        '**/*.d.ts',
        '**/__tests__/**',
      ],
      thresholds: {
        // Overall coverage thresholds
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },

    // Reporter
    reporters: ['verbose'],

    // Pool
    pool: 'forks',
  },
});

