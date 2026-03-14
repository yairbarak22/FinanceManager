import type {
  FinanceRecordType as PrismaFinanceRecordType,
  BillingCycle as PrismaBillingCycle,
  SubscriptionStatus as PrismaSubscriptionStatus,
  TransactionStatus as PrismaTransactionStatus,
  AdminSubscription as PrismaAdminSubscription,
  AdminTransaction as PrismaAdminTransaction,
} from '@prisma/client';

// Re-export Prisma enums as runtime constants
export const FinanceRecordType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const;

export const BillingCycle = {
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  REVIEWING: 'REVIEWING',
  CANCELED: 'CANCELED',
} as const;

export const TransactionStatus = {
  COMPLETED: 'COMPLETED',
  PENDING: 'PENDING',
} as const;

// Types derived from Prisma
export type FinanceRecordType = PrismaFinanceRecordType;
export type BillingCycle = PrismaBillingCycle;
export type SubscriptionStatus = PrismaSubscriptionStatus;
export type TransactionStatus = PrismaTransactionStatus;
export type AdminSubscription = PrismaAdminSubscription;
export type AdminTransaction = PrismaAdminTransaction;

// Combined data type for dashboard
export type CfoData = {
  subscriptions: AdminSubscription[];
  transactions: AdminTransaction[];
};

// UI Color mappings
export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionStatus, string> = {
  ACTIVE: '#00C875',
  REVIEWING: '#FF9800',
  CANCELED: '#E2445C',
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'פעיל',
  REVIEWING: 'בבדיקה',
  CANCELED: 'בוטל',
};

export const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, string> = {
  COMPLETED: '#00C875',
  PENDING: '#FF9800',
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  COMPLETED: 'הושלם',
  PENDING: 'ממתין',
};

export const FINANCE_RECORD_TYPE_COLORS: Record<FinanceRecordType, string> = {
  INCOME: '#00C875',
  EXPENSE: '#E2445C',
};

export const FINANCE_RECORD_TYPE_LABELS: Record<FinanceRecordType, string> = {
  INCOME: 'הכנסה',
  EXPENSE: 'הוצאה',
};

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  MONTHLY: 'חודשי',
  YEARLY: 'שנתי',
};
