// Maaser/Chomesh calculation utilities

import { Transaction, RecurringTransaction } from '@/lib/types';
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
 * Get all income transactions for a specific month
 */
export function getMonthlyIncomes(
  transactions: Transaction[],
  monthKey: string
): Transaction[] {
  return transactions.filter((tx) => {
    const txMonth = getMonthKey(tx.date);
    return txMonth === monthKey && tx.type === 'income';
  });
}

/**
 * Get all donation/maaser expense transactions for a specific month
 */
export function getMonthlyDonationTransactions(
  transactions: Transaction[],
  monthKey: string
): Transaction[] {
  return transactions.filter((tx) => {
    const txMonth = getMonthKey(tx.date);
    return (
      txMonth === monthKey &&
      tx.type === 'expense' &&
      (tx.category === 'maaser' || tx.category === 'donation')
    );
  });
}

/**
 * Sum up all donation/maaser expenses for a specific month
 */
export function getMonthlyDonationsTotal(
  transactions: Transaction[],
  monthKey: string
): number {
  return getMonthlyDonationTransactions(transactions, monthKey).reduce(
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

