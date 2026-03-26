import { describe, it, expect } from 'vitest';
import {
  matchImportedRows,
  buildExistingKeyMap,
  RECURRING_AMOUNT_TOLERANCE,
  type ImportedRow,
  type ExistingTransaction,
  type ActiveRecurring,
} from '@/lib/workspace/importMatching';

function makeRow(overrides: Partial<ImportedRow> & { idx: number }): ImportedRow {
  return {
    date: new Date('2026-03-15'),
    amount: 100,
    type: 'expense',
    description: 'שופרסל שלי',
    suggestedCategory: null,
    ...overrides,
  };
}

function makeExisting(overrides: Partial<ExistingTransaction> = {}): ExistingTransaction {
  return {
    id: 'tx-1',
    date: new Date('2026-03-15'),
    amount: 100,
    type: 'expense',
    description: 'שופרסל שלי',
    ...overrides,
  };
}

function makeRecurring(overrides: Partial<ActiveRecurring> = {}): ActiveRecurring {
  return {
    id: 'rec-1',
    name: 'משכורת',
    amount: 15000,
    type: 'income',
    category: 'salary',
    isActive: true,
    activeMonths: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

describe('matchImportedRows — duplicate detection', () => {
  it('marks exact duplicate when same day/type/amount/description exists', () => {
    const rows = [makeRow({ idx: 0 })];
    const existing = [makeExisting()];
    const results = matchImportedRows(rows, existing, [], '2026-03');

    expect(results).toHaveLength(1);
    expect(results[0].matchKind).toBe('exact_duplicate');
    expect(results[0].matchedTransactionId).toBe('tx-1');
  });

  it('does NOT match when amount differs', () => {
    const rows = [makeRow({ idx: 0, amount: 200 })];
    const existing = [makeExisting({ amount: 100 })];
    const results = matchImportedRows(rows, existing, [], '2026-03');

    expect(results[0].matchKind).toBe('new');
  });

  it('does NOT match when date differs', () => {
    const rows = [makeRow({ idx: 0, date: new Date('2026-03-16') })];
    const existing = [makeExisting({ date: new Date('2026-03-15') })];
    const results = matchImportedRows(rows, existing, [], '2026-03');

    expect(results[0].matchKind).toBe('new');
  });

  it('does NOT match when type differs', () => {
    const rows = [makeRow({ idx: 0, type: 'income' })];
    const existing = [makeExisting({ type: 'expense' })];
    const results = matchImportedRows(rows, existing, [], '2026-03');

    expect(results[0].matchKind).toBe('new');
  });
});

// ---------------------------------------------------------------------------
// Recurring matching
// ---------------------------------------------------------------------------

describe('matchImportedRows — recurring candidate detection', () => {
  it('matches imported row to active recurring with close amount and matching name', () => {
    const rows = [makeRow({ idx: 0, type: 'income', amount: 15000, description: 'משכורת חברת ABC' })];
    const recurrings = [makeRecurring()];
    const results = matchImportedRows(rows, [], recurrings, '2026-03');

    expect(results[0].matchKind).toBe('recurring_candidate');
    expect(results[0].matchedRecurringId).toBe('rec-1');
  });

  it('matches when amount is within tolerance', () => {
    const rows = [makeRow({ idx: 0, type: 'income', amount: 15000 + RECURRING_AMOUNT_TOLERANCE, description: 'משכורת' })];
    const recurrings = [makeRecurring({ amount: 15000 })];
    const results = matchImportedRows(rows, [], recurrings, '2026-03');

    expect(results[0].matchKind).toBe('recurring_candidate');
  });

  it('does NOT match when amount exceeds tolerance', () => {
    const rows = [makeRow({ idx: 0, type: 'income', amount: 15200, description: 'משכורת' })];
    const recurrings = [makeRecurring({ amount: 15000 })];
    const results = matchImportedRows(rows, [], recurrings, '2026-03');

    expect(results[0].matchKind).toBe('new');
  });

  it('does NOT match when type differs', () => {
    const rows = [makeRow({ idx: 0, type: 'expense', amount: 15000, description: 'משכורת' })];
    const recurrings = [makeRecurring({ type: 'income' })];
    const results = matchImportedRows(rows, [], recurrings, '2026-03');

    expect(results[0].matchKind).toBe('new');
  });

  it('does NOT match inactive recurring', () => {
    const rows = [makeRow({ idx: 0, type: 'income', amount: 15000, description: 'משכורת' })];
    const recurrings = [makeRecurring({ isActive: false })];
    const results = matchImportedRows(rows, [], recurrings, '2026-03');

    expect(results[0].matchKind).toBe('new');
  });

  it('does NOT match recurring not active in target month', () => {
    const rows = [makeRow({ idx: 0, type: 'income', amount: 15000, description: 'משכורת' })];
    const recurrings = [makeRecurring({ activeMonths: ['2026-01', '2026-02'] })];
    const results = matchImportedRows(rows, [], recurrings, '2026-03');

    expect(results[0].matchKind).toBe('new');
  });

  it('does NOT match recurring when names are unrelated', () => {
    const rows = [makeRow({ idx: 0, type: 'income', amount: 15000, description: 'שכר דירה' })];
    const recurrings = [makeRecurring({ name: 'משכורת' })];
    const results = matchImportedRows(rows, [], recurrings, '2026-03');

    expect(results[0].matchKind).toBe('new');
  });

  it('each recurring can match at most one imported row', () => {
    const rows = [
      makeRow({ idx: 0, type: 'income', amount: 15000, description: 'משכורת' }),
      makeRow({ idx: 1, type: 'income', amount: 15000, description: 'משכורת' }),
    ];
    const recurrings = [makeRecurring()];
    const results = matchImportedRows(rows, [], recurrings, '2026-03');

    const candidates = results.filter(r => r.matchKind === 'recurring_candidate');
    expect(candidates).toHaveLength(1);
    expect(results.find(r => r.matchKind === 'new')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Priority: duplicate check runs before recurring
// ---------------------------------------------------------------------------

describe('matchImportedRows — priority ordering', () => {
  it('prefers exact duplicate over recurring candidate', () => {
    const rows = [makeRow({ idx: 0, type: 'income', amount: 15000, description: 'משכורת' })];
    const existing = [makeExisting({ type: 'income', amount: 15000, description: 'משכורת' })];
    const recurrings = [makeRecurring()];
    const results = matchImportedRows(rows, existing, recurrings, '2026-03');

    expect(results[0].matchKind).toBe('exact_duplicate');
  });
});

// ---------------------------------------------------------------------------
// buildExistingKeyMap
// ---------------------------------------------------------------------------

describe('buildExistingKeyMap', () => {
  it('builds map and keeps first occurrence for duplicate keys', () => {
    const txs = [
      makeExisting({ id: 'a' }),
      makeExisting({ id: 'b' }),
    ];
    const map = buildExistingKeyMap(txs);
    expect(map.size).toBe(1);
    expect(map.values().next().value).toBe('a');
  });
});
