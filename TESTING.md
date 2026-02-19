# Testing Infrastructure

## Overview

This project uses a comprehensive testing system designed to **never touch production data**.

| Layer | Tool | Config | Purpose |
|-------|------|--------|---------|
| Unit | Vitest | `vitest.config.ts` | Pure logic tests with mocked dependencies |
| Integration | Vitest | `vitest.config.ts` | API route tests with mocked Prisma/services |
| E2E | Playwright | `playwright.config.ts` | Full browser tests against test server |
| CI/CD | GitHub Actions | `.github/workflows/test.yml` | Automated pipeline on push/PR |

## Quick Start

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests (requires Neon credentials)
npm run test:e2e

# Run all checks before deployment
npm run pre-deploy
```

## Safety Architecture

### Production Data Protection

1. **NODE_ENV Enforcement**: Tests refuse to run unless `NODE_ENV=test`
2. **Database URL Validation**: Validates DATABASE_URL is not a production endpoint
3. **API Key Detection**: Blocks real production API keys in test env
4. **Neon Branch Isolation**: Tests run on ephemeral Neon branches (schema only, no data)
5. **Runtime Guards**: `prisma.ts` warns if test code connects without a branch ID

### Neon Database Branching

```
Production (Primary Branch)
     ↓ schema sync
Staging Branch (schema only, NO data)
     ↓ create ephemeral branch
Test Branch ← Tests run here
     ↓ auto-delete
[Deleted after tests]
```

- Test branches are created from a **staging branch** (not production)
- Staging contains **schema only** – no customer data
- Branches are **auto-deleted** after tests
- Orphaned branches are cleaned up daily via cron

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `UNIT_DATABASE_URL` | Database URL for unit/integration tests |
| `E2E_DATABASE_URL` | Database URL for E2E tests |
| `NEON_API_KEY` | Neon API key for branch management |
| `NEON_PROJECT_ID` | Neon project ID |
| `NEON_STAGING_BRANCH_ID` | ID of the staging branch (schema only) |

## Test Structure

```
tests/
├── config/
│   └── test-env.ts          # Environment config & safety validation
├── setup/
│   ├── global-setup.ts      # Vitest global setup (Neon branch creation)
│   ├── global-teardown.ts   # Vitest global teardown (branch deletion)
│   ├── neon-branch.ts       # Neon API integration
│   ├── env-isolation.ts     # Environment variable isolation
│   ├── prisma-test.ts       # Test Prisma client
│   └── safety-checks.ts     # Pre-test safety validation
├── factories/
│   ├── user.ts              # Fake user data
│   ├── transaction.ts       # Fake transaction data
│   └── document.ts          # Fake document data & buffers
├── helpers/
│   ├── api.ts               # API request helpers
│   ├── database.ts          # DB seeding & cleanup
│   └── files.ts             # File buffer generators
├── mocks/
│   ├── prisma.ts            # Prisma Client mock
│   └── auth.ts              # Auth session mock
├── integration/
│   └── api/                 # API route integration tests
├── e2e/
│   ├── global-setup.ts      # Playwright Neon branch setup
│   ├── global-teardown.ts   # Playwright branch cleanup
│   ├── smoke.spec.ts        # Basic smoke tests
│   └── file-upload-flow.spec.ts
└── scripts/
    ├── cleanup-branch.ts    # Manual branch cleanup
    ├── cleanup-stale-branches.ts  # Daily stale branch cleanup
    └── pre-deploy.ts        # Pre-deployment checks

src/lib/__tests__/           # Co-located unit tests
├── fileValidator.test.ts
├── excelSanitizer.test.ts
├── encryption.test.ts
├── contactValidation.test.ts
├── authHelpers.test.ts
└── rateLimit.test.ts
```

## Writing New Tests

### Unit Test Example

```typescript
// src/lib/__tests__/myModule.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('../prisma', () => ({
  prisma: { user: { findUnique: vi.fn() } }
}));

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### Factory Usage

```typescript
import { createUser } from '../factories/user';
import { createTransaction } from '../factories/transaction';

const user = createUser({ email: 'test@test.com' });
const tx = createTransaction(user.id, { amount: -500 });
```

## CI/CD Pipeline

The GitHub Actions workflow runs:

1. **Safety Checks** – Validates test environment
2. **Unit Tests** – Runs Vitest (no DB required)
3. **Integration Tests** – Creates Neon branch → runs tests → deletes branch
4. **E2E Tests** – Creates Neon branch → starts dev server → Playwright → cleanup
5. **Security Audit** – `npm audit`

Branch cleanup runs with `if: always()` to prevent orphaned branches.

## Cleanup

```bash
# Delete a specific branch
npx tsx scripts/cleanup-branch.ts <branch-id>

# Delete all stale branches (>3 hours old)
npx tsx scripts/cleanup-stale-branches.ts
```

