// Maaser/Chomesh calculation utilities

import { Transaction, RecurringTransaction, CustomCategory, MaaserExpenseOffset } from '@/lib/types';
import { getMonthKey, isRecurringActiveInMonth } from '@/lib/utils';

export type CalculationType = 'maaser' | 'chomesh';

/**
 * Get the percentage for a given calculation type
 * Maaser = 10%, Chomesh = 20%
 */
export function getCalculationPercentage(type: CalculationType): number {
  return type === 'chomesh' ? 0.2 : 0.1;
}

/**
 * Get the display label for a calculation type
 */
export function getCalculationLabel(type: CalculationType): string {
  return type === 'chomesh' ? 'חומש' : 'מעשרות';
}

/**
 * Get the percentage display for a calculation type
 */
export function getCalculationPercentageLabel(type: CalculationType): string {
  return type === 'chomesh' ? '20%' : '10%';
}

/**
 * Calculate the obligation amount based on income and calculation type
 */
export function calculateObligation(
  incomeAmount: number,
  calculationType: CalculationType
): number {
  return Math.round(incomeAmount * getCalculationPercentage(calculationType));
}

/**
 * Get all income transactions for a specific month.
 * Custom income categories with isMaaserEligible=false are excluded if customCategories is provided.
 */
export function getMonthlyIncomes(
  transactions: Transaction[],
  monthKey: string,
  customCategories?: CustomCategory[]
): Transaction[] {
  const excludedCustomIds = customCategories
    ?.filter((c) => c.type === 'income' && !c.isMaaserEligible)
    .map((c) => c.id) ?? [];

  return transactions.filter((tx) => {
    const txMonth = getMonthKey(tx.date);
    if (txMonth !== monthKey || tx.type !== 'income') return false;
    if (excludedCustomIds.includes(tx.category)) return false;
    return true;
  });
}

/**
 * Get all donation/maaser expense transactions for a specific month.
 * Also includes custom expense categories with isMaaserEligible=true.
 */
export function getMonthlyDonationTransactions(
  transactions: Transaction[],
  monthKey: string,
  customCategories?: CustomCategory[]
): Transaction[] {
  const customMaaserIds = customCategories
    ?.filter((c) => c.type === 'expense' && c.isMaaserEligible)
    .map((c) => c.id) ?? [];

  return transactions.filter((tx) => {
    const txMonth = getMonthKey(tx.date);
    if (txMonth !== monthKey || tx.type !== 'expense') return false;
    if (tx.category === 'maaser' || tx.category === 'donation') return true;
    if (customMaaserIds.includes(tx.category)) return true;
    return false;
  });
}

/**
 * Sum up all donation/maaser expenses for a specific month
 */
export function getMonthlyDonationsTotal(
  transactions: Transaction[],
  monthKey: string,
  customCategories?: CustomCategory[]
): number {
  return getMonthlyDonationTransactions(transactions, monthKey, customCategories).reduce(
    (sum, tx) => sum + tx.amount,
    0
  );
}

/**
 * Calculate the balance between obligation and paid donations
 * Returns remaining (positive = still owe) and credit (positive = overpaid)
 */
export function calculateBalance(
  obligation: number,
  paid: number
): { remaining: number; credit: number } {
  const difference = obligation - paid;
  return {
    remaining: difference > 0 ? Math.round(difference) : 0,
    credit: difference < 0 ? Math.round(Math.abs(difference)) : 0,
  };
}

/**
 * Get recurring income transactions active in a specific month
 */
export function getActiveRecurringIncomes(
  recurringTransactions: RecurringTransaction[],
  monthKey: string
): RecurringTransaction[] {
  return recurringTransactions.filter(
    (rt) => rt.type === 'income' && isRecurringActiveInMonth(rt, monthKey)
  );
}

/**
 * Get recurring donation/maaser expense transactions active in a specific month
 */
export function getActiveRecurringDonationTransactions(
  recurringTransactions: RecurringTransaction[],
  monthKey: string
): RecurringTransaction[] {
  return recurringTransactions.filter(
    (rt) =>
      rt.type === 'expense' &&
      (rt.category === 'maaser' || rt.category === 'donation') &&
      isRecurringActiveInMonth(rt, monthKey)
  );
}

/**
 * Sum up all recurring donation/maaser expenses active in a specific month
 */
export function getActiveRecurringDonationsTotal(
  recurringTransactions: RecurringTransaction[],
  monthKey: string
): number {
  return getActiveRecurringDonationTransactions(recurringTransactions, monthKey).reduce(
    (sum, rt) => sum + rt.amount,
    0
  );
}

/**
 * Get month name in Hebrew from a YYYY-MM key
 */
export function getHebrewMonthName(monthKey: string): string {
  const monthNames: Record<string, string> = {
    '01': 'ינואר',
    '02': 'פברואר',
    '03': 'מרץ',
    '04': 'אפריל',
    '05': 'מאי',
    '06': 'יוני',
    '07': 'יולי',
    '08': 'אוגוסט',
    '09': 'ספטמבר',
    '10': 'אוקטובר',
    '11': 'נובמבר',
    '12': 'דצמבר',
  };

  const [year, month] = monthKey.split('-');
  const monthName = monthNames[month] || month;
  return `${monthName} ${year}`;
}

// ============================================
// EXPENSE OFFSET LOGIC
// ============================================

export interface OffsetSummaryItem {
  incomeCategory: string;
  grossIncome: number;
  offsetExpenses: number;
  netIncome: number;
  linkedExpenseCategories: string[];
}

/**
 * Build a map: incomeCategory → [expenseCategory, ...]
 */
export function buildOffsetMap(
  offsets: MaaserExpenseOffset[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const o of offsets) {
    const existing = map.get(o.incomeCategory) ?? [];
    existing.push(o.expenseCategory);
    map.set(o.incomeCategory, existing);
  }
  return map;
}

/**
 * Sum expenses by category for a given month (one-time + recurring).
 * Excludes maaser/donation categories (they are handled separately).
 */
export function getMonthlyExpensesByCategory(
  transactions: Transaction[],
  recurringTransactions: RecurringTransaction[],
  monthKey: string
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (getMonthKey(tx.date) !== monthKey) continue;
    if (tx.category === 'maaser' || tx.category === 'donation') continue;
    totals.set(tx.category, (totals.get(tx.category) ?? 0) + tx.amount);
  }

  for (const rt of recurringTransactions) {
    if (rt.type !== 'expense') continue;
    if (!isRecurringActiveInMonth(rt, monthKey)) continue;
    if (rt.category === 'maaser' || rt.category === 'donation') continue;
    totals.set(rt.category, (totals.get(rt.category) ?? 0) + rt.amount);
  }

  return totals;
}

/**
 * Calculate per-category offset summary for display.
 * Only returns entries for income categories that have active offsets.
 */
export function calculateOffsetSummary(
  incomeByCategory: Map<string, number>,
  expenseByCategory: Map<string, number>,
  offsetMap: Map<string, string[]>
): OffsetSummaryItem[] {
  const summary: OffsetSummaryItem[] = [];

  for (const [incCat, expCats] of offsetMap.entries()) {
    const grossIncome = incomeByCategory.get(incCat) ?? 0;
    if (grossIncome === 0 && expCats.every((ec) => (expenseByCategory.get(ec) ?? 0) === 0)) {
      continue;
    }

    let offsetExpenses = 0;
    for (const ec of expCats) {
      offsetExpenses += expenseByCategory.get(ec) ?? 0;
    }

    summary.push({
      incomeCategory: incCat,
      grossIncome,
      offsetExpenses,
      netIncome: Math.max(grossIncome - offsetExpenses, 0),
      linkedExpenseCategories: expCats,
    });
  }

  return summary;
}

/**
 * Calculate total obligated income after applying expense offsets.
 * For categories WITH offsets: uses net income (gross - expenses, min 0).
 * For categories WITHOUT offsets: uses gross income as-is.
 */
export function calculateObligatedIncomeWithOffsets(
  allIncomeItems: { amount: number; category: string; key: string }[],
  incomeToggles: Map<string, boolean>,
  offsetMap: Map<string, string[]>,
  expenseByCategory: Map<string, number>
): { total: number; totalOffset: number } {
  // Group toggled-on income by category
  const incomeByCat = new Map<string, number>();
  for (const item of allIncomeItems) {
    if (incomeToggles.get(item.key) === false) continue;
    incomeByCat.set(item.category, (incomeByCat.get(item.category) ?? 0) + item.amount);
  }

  let total = 0;
  let totalOffset = 0;

  for (const [cat, gross] of incomeByCat.entries()) {
    const linkedExpCats = offsetMap.get(cat);

    if (linkedExpCats && linkedExpCats.length > 0) {
      let offsetAmount = 0;
      for (const ec of linkedExpCats) {
        offsetAmount += expenseByCategory.get(ec) ?? 0;
      }
      const cappedOffset = Math.min(offsetAmount, gross);
      totalOffset += cappedOffset;
      total += gross - cappedOffset;
    } else {
      total += gross;
    }
  }

  return { total, totalOffset };
}

