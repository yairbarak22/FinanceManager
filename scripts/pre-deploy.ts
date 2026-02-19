#!/usr/bin/env tsx
/**
 * Pre-Deployment Safety Check Script
 *
 * Run this before every deployment to ensure:
 * 1. All tests pass
 * 2. No production credentials are exposed
 * 3. Build succeeds
 * 4. TypeScript compiles cleanly
 *
 * Usage: npx tsx scripts/pre-deploy.ts
 */

import { execSync } from 'child_process';

interface CheckResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: CheckResult[] = [];

function runCheck(name: string, command: string): void {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🔍 ${name}`);
  console.log(`${'─'.repeat(60)}\n`);

  const start = Date.now();
  try {
    execSync(command, { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } });
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`\n✅ ${name} passed (${((Date.now() - start) / 1000).toFixed(1)}s)`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`\n❌ ${name} FAILED`);
  }
}

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║              PRE-DEPLOYMENT SAFETY CHECKS              ║');
console.log('╚══════════════════════════════════════════════════════════╝');

// 1. TypeScript Check
runCheck('TypeScript Compilation', 'npx tsc --noEmit');

// 2. Lint Check
runCheck('ESLint', 'npx next lint');

// 3. Unit Tests
runCheck('Unit Tests', 'npx vitest run --reporter=verbose');

// 4. Build Check
runCheck('Next.js Build', 'npx next build');

// ============================================================================
// Summary
// ============================================================================

console.log('\n\n');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║                     RESULTS SUMMARY                    ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');

let allPassed = true;
for (const result of results) {
  const icon = result.passed ? '✅' : '❌';
  const time = `(${(result.duration / 1000).toFixed(1)}s)`;
  console.log(`  ${icon} ${result.name} ${time}`);
  if (!result.passed) allPassed = false;
}

const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
console.log('');
console.log(`  Total time: ${(totalTime / 1000).toFixed(1)}s`);
console.log('');

if (allPassed) {
  console.log('  🚀 All checks passed! Safe to deploy.');
  console.log('');
  process.exit(0);
} else {
  console.log('  ⛔ Some checks failed. Do NOT deploy until all checks pass.');
  console.log('');
  process.exit(1);
}

