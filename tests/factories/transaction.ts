/**
 * Transaction Test Data Factory
 *
 * Generates realistic fake transaction data for testing.
 */

import { faker } from '@faker-js/faker';

export interface TransactionFactoryData {
  id: string;
  userId: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EXPENSE_CATEGORIES = ['מזון', 'תחבורה', 'דיור', 'בריאות', 'בילויים', 'ביגוד', 'חינוך', 'אחר'];
const INCOME_CATEGORIES = ['משכורת', 'השקעות', 'מתנות', 'פרילנס', 'אחר'];
const EXPENSE_DESCRIPTIONS = ['סופרמרקט', 'דלק', 'שכירות', 'רופא שיניים', 'מסעדה', 'בגדים', 'שכר לימוד'];
const INCOME_DESCRIPTIONS = ['משכורת חודשית', 'בונוס', 'דיבידנד', 'פרויקט', 'מתנה'];

let transactionCounter = 0;

/**
 * Create a fake transaction with optional overrides.
 */
export function createTransaction(
  userId: string,
  overrides: Partial<TransactionFactoryData> = {}
): TransactionFactoryData {
  transactionCounter++;
  const type = overrides.type || faker.helpers.arrayElement(['expense', 'income'] as const);
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const descriptions = type === 'expense' ? EXPENSE_DESCRIPTIONS : INCOME_DESCRIPTIONS;

  return {
    id: overrides.id || `test-tx-${transactionCounter}-${faker.string.alphanumeric(8)}`,
    userId,
    type,
    amount: overrides.amount ?? faker.number.float({ min: 10, max: 5000, fractionDigits: 2 }),
    category: overrides.category || faker.helpers.arrayElement(categories),
    description: overrides.description || faker.helpers.arrayElement(descriptions),
    date: overrides.date || faker.date.recent({ days: 90 }),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
}

/**
 * Create multiple fake transactions for a user.
 */
export function createTransactions(
  userId: string,
  count: number,
  overrides: Partial<TransactionFactoryData> = {}
): TransactionFactoryData[] {
  return Array.from({ length: count }, () => createTransaction(userId, overrides));
}

/**
 * Create a negative amount transaction (e.g., bank import format).
 */
export function createNegativeTransaction(
  userId: string,
  overrides: Partial<TransactionFactoryData> = {}
): TransactionFactoryData {
  return createTransaction(userId, {
    type: 'expense',
    amount: -(overrides.amount ?? faker.number.float({ min: 10, max: 5000, fractionDigits: 2 })),
    ...overrides,
  });
}

export function resetTransactionFactory(): void {
  transactionCounter = 0;
}

