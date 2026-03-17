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
const currencyCode = z.enum(['ILS', 'USD']).default('ILS');

// --- Transaction schemas ---

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense'], { message: 'Type must be "income" or "expense"' }),
  amount: positiveAmount,
  currency: currencyCode,
  category: shortString(50),
  description: shortString(500),
  date: isoDate,
});

export const updateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  amount: positiveAmount.optional(),
  currency: z.enum(['ILS', 'USD']).optional(),
  category: shortString(50).optional(),
  description: shortString(500).optional(),
  date: isoDate.optional(),
  updateExistingTransactions: z.boolean().optional(),
  merchantName: z.string().max(500).optional(),
  originalCategory: z.string().max(50).optional(),
  originalAmount: z.number().optional(),
});

// --- Recurring transaction schemas ---

export const createRecurringSchema = z.object({
  type: z.enum(['income', 'expense'], { message: 'Type must be "income" or "expense"' }),
  amount: positiveAmount,
  currency: currencyCode,
  category: shortString(50),
  name: shortString(100),
  isActive: z.boolean().optional(),
  activeMonths: z.array(z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format')).min(1).max(24).optional().nullable(),
});

// --- Liability schemas ---

export const createLiabilitySchema = z.object({
  name: shortString(100),
  type: shortString(50),
  totalAmount: positiveAmount,
  monthlyPayment: nonNegativeAmount,
  currency: currencyCode,
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
  currency: z.enum(['ILS', 'USD']).optional(),
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

// --- Budget schemas ---

export const createBudgetSchema = z.object({
  categoryId: shortString(100),
  amount: positiveAmount,
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

// --- Passover Budget schemas ---

export const upsertPassoverSectionSchema = z.object({
  categoryId: z.string().trim().min(1).max(200),
  categoryName: shortString(100).optional(),
  plannedAmount: nonNegativeAmount.optional(),
  orderIndex: z.number().int().min(0).optional(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export const deletePassoverSectionSchema = z.object({
  sectionId: z.string().trim().min(1),
});

export const bulkCreatePassoverSectionsSchema = z.object({
  template: z.enum(['hosting', 'guest']),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export const copyBudgetSchema = z.object({
  fromMonth: z.number().int().min(1).max(12),
  fromYear: z.number().int().min(2020).max(2100),
  toMonth: z.number().int().min(1).max(12),
  toYear: z.number().int().min(2020).max(2100),
});

// --- Admin Roadmap schemas ---

const adminTaskStatusEnum = z.enum(['WORKING_ON_IT', 'DONE', 'STUCK', 'NOT_STARTED']);
const adminTaskPriorityEnum = z.enum(['HIGH', 'MEDIUM', 'LOW']);

export const createAdminTaskSchema = z.object({
  groupId: z.string().cuid('Invalid group ID'),
  title: shortString(200),
  ownerId: z.string().max(100).optional(),
  status: adminTaskStatusEnum.default('NOT_STARTED'),
  priority: adminTaskPriorityEnum.default('MEDIUM'),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
});

export const updateAdminTaskSchema = z.object({
  groupId: z.string().cuid('Invalid group ID').optional(),
  title: shortString(200).optional(),
  ownerId: z.string().max(100).nullable().optional(),
  status: adminTaskStatusEnum.optional(),
  priority: adminTaskPriorityEnum.optional(),
  startDate: isoDate.nullable().optional(),
  endDate: isoDate.nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const createAdminTaskGroupSchema = z.object({
  title: shortString(100),
  color: z.string().max(30),
});

export const updateAdminTaskGroupSchema = z.object({
  title: shortString(100).optional(),
  color: z.string().max(30).optional(),
});

export const updateAdminTaskGroupOrderSchema = z.array(
  z.object({
    id: z.string().cuid('Invalid group ID'),
    orderIndex: z.number().int().min(0),
  })
).min(1, 'At least one group required');

// --- CFO Dashboard schemas ---

const financeRecordTypeEnum = z.enum(['INCOME', 'EXPENSE']);
const billingCycleEnum = z.enum(['MONTHLY', 'YEARLY']);
const subscriptionStatusEnum = z.enum(['ACTIVE', 'REVIEWING', 'CANCELED']);
const transactionStatusEnum = z.enum(['COMPLETED', 'PENDING']);

export const createAdminSubscriptionSchema = z.object({
  title: shortString(200),
  type: financeRecordTypeEnum,
  amount: nonNegativeAmount,
  currency: currencyCode,
  category: z.string().trim().max(100).optional().default(''),
  billingCycle: billingCycleEnum,
  nextBillingDate: isoDate,
  status: subscriptionStatusEnum.default('ACTIVE'),
});

export const updateAdminSubscriptionSchema = z.object({
  title: shortString(200).optional(),
  type: financeRecordTypeEnum.optional(),
  amount: nonNegativeAmount.optional(),
  currency: currencyCode.optional(),
  category: z.string().trim().max(100).optional(),
  billingCycle: billingCycleEnum.optional(),
  nextBillingDate: isoDate.optional(),
  status: subscriptionStatusEnum.optional(),
});

export const createAdminTransactionSchema = z.object({
  title: shortString(200),
  type: financeRecordTypeEnum,
  amount: nonNegativeAmount,
  currency: currencyCode,
  category: z.string().trim().max(100).optional().default(''),
  date: isoDate,
  status: transactionStatusEnum.default('COMPLETED'),
  receiptUrl: z.string().url('Invalid URL').max(500).optional(),
});

export const updateAdminTransactionSchema = z.object({
  title: shortString(200).optional(),
  type: financeRecordTypeEnum.optional(),
  amount: nonNegativeAmount.optional(),
  currency: currencyCode.optional(),
  category: z.string().trim().max(100).optional(),
  date: isoDate.optional(),
  status: transactionStatusEnum.optional(),
  receiptUrl: z.string().url('Invalid URL').max(500).nullable().optional(),
});

// --- IVR schemas ---

export const ivrPinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN חייב להיות 4 ספרות'),
  phoneNumber: z.string().min(9).max(15),
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

// --- Marketing Campaign schemas ---

const campaignVariantSchema = z.object({
  id: z.enum(['A', 'B'], { message: 'Variant ID must be A or B' }),
  subject: z.string().trim().min(1, 'Subject is required').max(200, 'Subject too long'),
  htmlContent: z.string().min(1, 'Content is required'),
});

export type CampaignVariant = z.infer<typeof campaignVariantSchema>;

export const createCampaignSchema = z.object({
  name: shortString(200),
  subject: shortString(200),
  content: z.string().min(1, 'Content is required'),
  segmentFilter: z.any(),
  scheduledAt: isoDate.nullable().optional(),
  isAbTest: z.boolean().optional().default(false),
  abTestPercentage: z.number().int().min(1).max(50).optional(),
  abTestDurationHours: z.number().int().min(1).max(72).optional(),
  abTestWinningMetric: z.enum(['OPEN_RATE', 'CLICK_RATE']).optional(),
  variants: z.array(campaignVariantSchema).min(2).max(2).optional(),
}).refine((data) => {
  if (data.isAbTest) {
    return (
      data.abTestPercentage !== undefined &&
      data.abTestDurationHours !== undefined &&
      data.abTestWinningMetric !== undefined &&
      data.variants !== undefined &&
      data.variants.length === 2
    );
  }
  return true;
}, {
  message: 'A/B test campaigns require percentage, duration, winning metric, and exactly 2 variants',
  path: ['isAbTest'],
});

export const updateCampaignSchema = z.object({
  name: shortString(200).optional(),
  subject: shortString(200).optional(),
  content: z.string().min(1, 'Content is required').optional(),
  segmentFilter: z.any().optional(),
  scheduledAt: isoDate.nullable().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'TESTING', 'COMPLETED', 'CANCELLED']).optional(),
  isAbTest: z.boolean().optional(),
  abTestPercentage: z.number().int().min(1).max(50).optional(),
  abTestDurationHours: z.number().int().min(1).max(72).optional(),
  abTestWinningMetric: z.enum(['OPEN_RATE', 'CLICK_RATE']).optional(),
  variants: z.array(campaignVariantSchema).min(2).max(2).optional(),
  winningVariantId: z.enum(['A', 'B']).optional(),
}).refine((data) => {
  if (data.isAbTest === true) {
    return (
      data.abTestPercentage !== undefined &&
      data.abTestDurationHours !== undefined &&
      data.abTestWinningMetric !== undefined &&
      data.variants !== undefined &&
      data.variants.length === 2
    );
  }
  return true;
}, {
  message: 'A/B test campaigns require percentage, duration, winning metric, and exactly 2 variants',
  path: ['isAbTest'],
});
