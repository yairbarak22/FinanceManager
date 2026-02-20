/**
 * Zod Validation Schemas — Unit Tests
 *
 * Tests each schema with valid and invalid inputs to ensure
 * all fields are validated correctly.
 */

import { describe, it, expect } from 'vitest';
import {
  createTransactionSchema,
  updateTransactionSchema,
  createRecurringSchema,
  createLiabilitySchema,
  updateLiabilitySchema,
  createGoalSchema,
} from '../validationSchemas';

// ============================================================================
// createTransactionSchema
// ============================================================================

describe('createTransactionSchema', () => {
  const validTransaction = {
    type: 'expense' as const,
    amount: 100,
    category: 'Food',
    description: 'Lunch',
    date: '2024-01-15T12:00:00Z',
  };

  it('accepts valid transaction data', () => {
    const result = createTransactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
  });

  it('accepts income type', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      type: 'income',
    });
    expect(result.success).toBe(true);
  });

  // --- Type ---

  it('rejects invalid type', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      type: 'transfer',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing type', () => {
    const { type, ...rest } = validTransaction;
    const result = createTransactionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // --- Amount ---

  it('rejects negative amount', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      amount: -100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero amount', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it('accepts decimal amount', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      amount: 99.99,
    });
    expect(result.success).toBe(true);
  });

  it('rejects string amount', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      amount: '100',
    });
    expect(result.success).toBe(false);
  });

  // --- Category ---

  it('rejects empty category', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      category: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only category', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      category: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects category longer than 50 chars', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      category: 'x'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('accepts Hebrew category', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      category: 'מזון',
    });
    expect(result.success).toBe(true);
  });

  // --- Description ---

  it('rejects empty description', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      description: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects description longer than 500 chars', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      description: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  // --- Date ---

  it('rejects invalid date string', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      date: 'invalid-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects completely garbage date', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      date: 'not-a-date-at-all',
    });
    expect(result.success).toBe(false);
  });

  it('accepts ISO date without time', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      date: '2024-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('accepts ISO date with timezone', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      date: '2024-01-15T12:00:00+02:00',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing date', () => {
    const { date, ...rest } = validTransaction;
    const result = createTransactionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // --- Missing fields ---

  it('rejects missing amount', () => {
    const { amount, ...rest } = validTransaction;
    const result = createTransactionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects missing category', () => {
    const { category, ...rest } = validTransaction;
    const result = createTransactionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects missing description', () => {
    const { description, ...rest } = validTransaction;
    const result = createTransactionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// updateTransactionSchema
// ============================================================================

describe('updateTransactionSchema', () => {
  it('accepts partial update (only amount)', () => {
    const result = updateTransactionSchema.safeParse({ amount: 200 });
    expect(result.success).toBe(true);
  });

  it('accepts partial update (only category)', () => {
    const result = updateTransactionSchema.safeParse({ category: 'Transport' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = updateTransactionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid type in partial update', () => {
    const result = updateTransactionSchema.safeParse({ type: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount in partial update', () => {
    const result = updateTransactionSchema.safeParse({ amount: -50 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date in partial update', () => {
    const result = updateTransactionSchema.safeParse({ date: 'bad-date' });
    expect(result.success).toBe(false);
  });

  it('accepts business-logic pass-through fields', () => {
    const result = updateTransactionSchema.safeParse({
      amount: 100,
      updateExistingTransactions: true,
      merchantName: 'Test Merchant',
      originalCategory: 'Food',
      originalAmount: 50,
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// createRecurringSchema
// ============================================================================

describe('createRecurringSchema', () => {
  const validRecurring = {
    type: 'expense' as const,
    amount: 500,
    category: 'דיור',
    name: 'שכירות',
  };

  it('accepts valid recurring transaction', () => {
    const result = createRecurringSchema.safeParse(validRecurring);
    expect(result.success).toBe(true);
  });

  it('accepts with optional activeMonths', () => {
    const result = createRecurringSchema.safeParse({
      ...validRecurring,
      activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    });
    expect(result.success).toBe(true);
  });

  it('rejects activeMonths with month 0', () => {
    const result = createRecurringSchema.safeParse({
      ...validRecurring,
      activeMonths: [0, 1, 2],
    });
    expect(result.success).toBe(false);
  });

  it('rejects activeMonths with month 13', () => {
    const result = createRecurringSchema.safeParse({
      ...validRecurring,
      activeMonths: [1, 13],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = createRecurringSchema.safeParse({
      ...validRecurring,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 100 chars', () => {
    const result = createRecurringSchema.safeParse({
      ...validRecurring,
      name: 'x'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = createRecurringSchema.safeParse({
      ...validRecurring,
      amount: -500,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid type', () => {
    const result = createRecurringSchema.safeParse({
      ...validRecurring,
      type: 'savings',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// createLiabilitySchema
// ============================================================================

describe('createLiabilitySchema', () => {
  const validLiability = {
    name: 'משכנתא',
    type: 'mortgage',
    totalAmount: 1000000,
    monthlyPayment: 5000,
  };

  it('accepts valid liability', () => {
    const result = createLiabilitySchema.safeParse(validLiability);
    expect(result.success).toBe(true);
  });

  it('accepts with all optional fields', () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiability,
      interestRate: 3.5,
      loanTermMonths: 300,
      startDate: '2024-01-01',
      loanMethod: 'spitzer',
      hasInterestRebate: true,
      isActiveInCashFlow: true,
      linkage: 'index',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative totalAmount', () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiability,
      totalAmount: -100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects interestRate above 100', () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiability,
      interestRate: 150,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid loanMethod', () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiability,
      loanMethod: 'bullet',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid linkage', () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiability,
      linkage: 'gold',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiability,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero monthlyPayment', () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiability,
      monthlyPayment: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative monthlyPayment', () => {
    const result = createLiabilitySchema.safeParse({
      ...validLiability,
      monthlyPayment: -100,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// updateLiabilitySchema
// ============================================================================

describe('updateLiabilitySchema', () => {
  it('accepts partial update', () => {
    const result = updateLiabilitySchema.safeParse({ monthlyPayment: 6000 });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateLiabilitySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects negative totalAmount in update', () => {
    const result = updateLiabilitySchema.safeParse({ totalAmount: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts remainingAmount field', () => {
    const result = updateLiabilitySchema.safeParse({ remainingAmount: 50000 });
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// createGoalSchema
// ============================================================================

describe('createGoalSchema', () => {
  const validGoal = {
    name: 'קרן חירום',
    targetAmount: 50000,
    deadline: '2025-12-31',
  };

  it('accepts valid goal', () => {
    const result = createGoalSchema.safeParse(validGoal);
    expect(result.success).toBe(true);
  });

  it('accepts with all optional fields', () => {
    const result = createGoalSchema.safeParse({
      ...validGoal,
      currentAmount: 10000,
      category: 'investment',
      icon: '🎯',
      investInPortfolio: true,
      expectedInterestRate: 7.5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects targetAmount above 100M', () => {
    const result = createGoalSchema.safeParse({
      ...validGoal,
      targetAmount: 200_000_000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative targetAmount', () => {
    const result = createGoalSchema.safeParse({
      ...validGoal,
      targetAmount: -1000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid deadline date', () => {
    const result = createGoalSchema.safeParse({
      ...validGoal,
      deadline: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = createGoalSchema.safeParse({
      ...validGoal,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 100 chars', () => {
    const result = createGoalSchema.safeParse({
      ...validGoal,
      name: 'x'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('defaults currentAmount to 0', () => {
    const result = createGoalSchema.safeParse(validGoal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentAmount).toBe(0);
    }
  });

  it('defaults category to saving', () => {
    const result = createGoalSchema.safeParse(validGoal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('saving');
    }
  });

  it('rejects expectedInterestRate above 100', () => {
    const result = createGoalSchema.safeParse({
      ...validGoal,
      expectedInterestRate: 150,
    });
    expect(result.success).toBe(false);
  });
});

