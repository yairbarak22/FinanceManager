/**
 * Import Matching Engine
 *
 * Runs two filters against imported rows:
 *   1. Exact duplicate detection against existing Transaction records
 *   2. Recurring-transaction candidate matching
 *
 * Pure functions — no Prisma calls here; DB data is passed in.
 */

import { superNormalizeMerchantName } from '@/lib/classificationUtils';
import { isRecurringActiveInMonth } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImportedRow {
  /** Stable index within the import batch (used as correlation key) */
  idx: number;
  date: Date;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  suggestedCategory: string | null;
}

export interface ExistingTransaction {
  id: string;
  date: Date;
  amount: number;
  type: string;
  description: string;
}

export interface ActiveRecurring {
  id: string;
  name: string;
  amount: number;
  type: string;
  category: string;
  isActive: boolean;
  activeMonths: string[] | null;
}

export type MatchKind = 'new' | 'exact_duplicate' | 'recurring_candidate';

export interface MatchResult {
  idx: number;
  matchKind: MatchKind;
  matchedTransactionId: string | null;
  matchedRecurringId: string | null;
}

// ---------------------------------------------------------------------------
// Thresholds (exported for tests)
// ---------------------------------------------------------------------------

/** Maximum absolute amount difference for recurring match (ILS) */
export const RECURRING_AMOUNT_TOLERANCE = 5;
/** Maximum relative amount difference for recurring match (fraction) */
export const RECURRING_AMOUNT_RELATIVE_TOLERANCE = 0.01;

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

/**
 * Build a lookup key for duplicate detection.
 * Uses same-day + same type + same amount + normalized description.
 */
function duplicateKey(date: Date, type: string, amount: number, description: string): string {
  const day = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  const amt = Math.round(amount * 100);
  const norm = description.toLowerCase().trim();
  return `${day}|${type}|${amt}|${norm}`;
}

/**
 * Build a set of keys from existing Transaction records for O(1) lookup.
 */
export function buildExistingKeyMap(
  existing: ExistingTransaction[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const tx of existing) {
    const key = duplicateKey(tx.date, tx.type, tx.amount, tx.description);
    if (!map.has(key)) {
      map.set(key, tx.id);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Recurring matching
// ---------------------------------------------------------------------------

function amountCloseEnough(imported: number, recurring: number): boolean {
  const diff = Math.abs(imported - recurring);
  if (diff <= RECURRING_AMOUNT_TOLERANCE) return true;
  if (recurring > 0 && diff / recurring <= RECURRING_AMOUNT_RELATIVE_TOLERANCE) return true;
  return false;
}

function namesMatch(importedDesc: string, recurringName: string): boolean {
  const normImported = superNormalizeMerchantName(importedDesc);
  const normRecurring = superNormalizeMerchantName(recurringName);
  if (!normImported || !normRecurring) return false;
  return normImported.includes(normRecurring) || normRecurring.includes(normImported);
}

/**
 * Find the best recurring-transaction match for a single imported row.
 * Returns the recurring ID or null.
 */
function findRecurringMatch(
  row: ImportedRow,
  monthKey: string,
  recurrings: ActiveRecurring[],
  alreadyMatched: Set<string>
): string | null {
  for (const r of recurrings) {
    if (alreadyMatched.has(r.id)) continue;
    if (r.type !== row.type) continue;
    if (!isRecurringActiveInMonth(r, monthKey)) continue;
    if (!amountCloseEnough(row.amount, r.amount)) continue;
    if (!namesMatch(row.description, r.name)) continue;
    return r.id;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Classify each imported row as new / exact_duplicate / recurring_candidate.
 *
 * @param rows           Imported rows from the parsed file
 * @param existingTxs    Existing Transaction records in the month's date range
 * @param recurrings     Active RecurringTransaction records for the user
 * @param monthKey       "YYYY-MM" of the import target month
 */
export function matchImportedRows(
  rows: ImportedRow[],
  existingTxs: ExistingTransaction[],
  recurrings: ActiveRecurring[],
  monthKey: string
): MatchResult[] {
  const existingKeys = buildExistingKeyMap(existingTxs);
  const recurringMatched = new Set<string>();
  const results: MatchResult[] = [];

  for (const row of rows) {
    const key = duplicateKey(row.date, row.type, row.amount, row.description);
    const existingId = existingKeys.get(key);

    if (existingId) {
      results.push({
        idx: row.idx,
        matchKind: 'exact_duplicate',
        matchedTransactionId: existingId,
        matchedRecurringId: null,
      });
      continue;
    }

    const recurringId = findRecurringMatch(row, monthKey, recurrings, recurringMatched);
    if (recurringId) {
      recurringMatched.add(recurringId);
      results.push({
        idx: row.idx,
        matchKind: 'recurring_candidate',
        matchedTransactionId: null,
        matchedRecurringId: recurringId,
      });
      continue;
    }

    results.push({
      idx: row.idx,
      matchKind: 'new',
      matchedTransactionId: null,
      matchedRecurringId: null,
    });
  }

  return results;
}
