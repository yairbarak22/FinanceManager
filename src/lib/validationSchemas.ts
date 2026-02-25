import { z } from 'zod';

// --- Shared primitives ---

const positiveAmount = z.number().positive('Amount must be a positive number');
const nonNegativeAmount = z.number().min(0, 'Amount must be non-negative');
const shortString = (max: number) =>
  z.string().trim().min(1, 'Field is required').max(max, `Too long (max ${max} characters)`);
const isoDate = z.string().refine(
  (val) => !isNaN(new Date(val).getTime()),
  { message: 'Invalid date' },
);

// --- Transaction schemas ---

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense'], { message: 'Type must be "income" or "expense"' }),
  amount: positiveAmount,
  category: shortString(50),
  description: shortString(500),
  date: isoDate,
});

export const updateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  amount: positiveAmount.optional(),
  category: shortString(50).optional(),
  description: shortString(500).optional(),
  date: isoDate.optional(),
  // Pass-through fields used by business logic (not validated further here)
  updateExistingTransactions: z.boolean().optional(),
  merchantName: z.string().max(500).optional(),
  originalCategory: z.string().max(50).optional(),
  originalAmount: z.number().optional(),
});

// --- Recurring transaction schemas ---

export const createRecurringSchema = z.object({
  type: z.enum(['income', 'expense'], { message: 'Type must be "income" or "expense"' }),
  amount: positiveAmount,
  category: shortString(50),
  name: shortString(100),
  isActive: z.boolean().optional(),
  activeMonths: z.array(z.number().int().min(1).max(12)).min(1).max(12).optional().nullable(),
});

// --- Liability schemas ---

export const createLiabilitySchema = z.object({
  name: shortString(100),
  type: shortString(50),
  totalAmount: positiveAmount,
  monthlyPayment: nonNegativeAmount,
  interestRate: z.number().min(0).max(100, 'Interest rate must be between 0 and 100').optional().default(0),
  loanTermMonths: z.number().int().min(0).optional().default(0),
  startDate: isoDate.optional(),
  loanMethod: z.enum(['spitzer', 'equal_principal']).optional().default('spitzer'),
  hasInterestRebate: z.boolean().optional().default(false),
  isActiveInCashFlow: z.boolean().optional().default(true),
  linkage: z.enum(['none', 'index', 'foreign']).optional().default('none'),
});

export const updateLiabilitySchema = z.object({
  name: shortString(100).optional(),
  type: shortString(50).optional(),
  totalAmount: positiveAmount.optional(),
  monthlyPayment: nonNegativeAmount.optional(),
  interestRate: z.number().min(0).max(100).optional(),
  loanTermMonths: z.number().int().min(0).optional(),
  startDate: isoDate.optional(),
  loanMethod: z.enum(['spitzer', 'equal_principal']).optional(),
  hasInterestRebate: z.boolean().optional(),
  isActiveInCashFlow: z.boolean().optional(),
  linkage: z.enum(['none', 'index', 'foreign']).optional(),
  remainingAmount: nonNegativeAmount.optional(),
});

// --- Mortgage schemas ---

export const createMortgageSchema = z.object({
  name: shortString(100),
  startDate: isoDate,
  note: z.string().max(500).optional(),
  tracks: z.array(z.object({
    trackType: shortString(50),
    amount: positiveAmount,
    termMonths: z.number().int().min(1),
    termYears: z.number().int().min(1).optional(),
    interestRate: z.number().min(0).max(100),
    loanMethod: z.enum(['spitzer', 'equal_principal']).default('spitzer'),
    monthlyPayment: nonNegativeAmount,
    order: z.number().int().min(0),
  })).min(1, 'חייב לפחות מסלול אחד'),
});

export const updateMortgageSchema = z.object({
  isMortgage: z.literal(true),
  name: shortString(100),
  startDate: isoDate,
  note: z.string().max(500).optional(),
  tracks: z.array(z.object({
    trackType: shortString(50),
    amount: positiveAmount,
    termMonths: z.number().int().min(1),
    termYears: z.number().int().min(1).optional(),
    interestRate: z.number().min(0).max(100),
    loanMethod: z.enum(['spitzer', 'equal_principal']).default('spitzer'),
    monthlyPayment: nonNegativeAmount,
    order: z.number().int().min(0),
  })).min(1, 'חייב לפחות מסלול אחד'),
});

// --- Goal schemas ---

export const createGoalSchema = z.object({
  name: shortString(100),
  targetAmount: positiveAmount.refine((v) => v <= 100_000_000, 'Target amount too high'),
  currentAmount: nonNegativeAmount.optional().default(0),
  deadline: isoDate,
  category: shortString(50).optional().default('saving'),
  icon: z.string().max(50).optional(),
  investInPortfolio: z.boolean().optional(),
  expectedInterestRate: z.number().min(0).max(100).optional(),
});

// --- Invite schemas ---

export const sendFriendInviteSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('כתובת אימייל לא תקינה')
    .max(320, 'כתובת אימייל ארוכה מדי'),
});
