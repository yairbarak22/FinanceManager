/**
 * Financial Advisor Engine - Types
 * טיפוסים למנוע הייעוץ הפיננסי
 */

import { Asset, Liability, Transaction, RecurringTransaction, UserProfile } from '@/lib/types';

// User with profile for advisor context
export interface UserWithProfile {
  id: string;
  name?: string | null;
  email: string;
  profile?: UserProfile | null;
}

// Calculated financial metrics
export interface FinancialMetrics {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  savingsRate: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  liquidAssets: number;
  highInterestDebt: number;
}

// Full context for evaluating rules
export interface FinancialContext {
  user: UserWithProfile;
  assets: Asset[];
  liabilities: Liability[];
  transactions: Transaction[];
  recurring: RecurringTransaction[];
  metrics: FinancialMetrics;
}

// Recommendation types
export type RecommendationType = 
  | 'tax_benefit'   // הטבות מס
  | 'savings'       // חיסכון
  | 'insurance'     // ביטוח
  | 'banking'       // בנקאות
  | 'general';      // כללי

// Priority levels
export type RecommendationPriority = 'high' | 'medium' | 'low';

// A single recommendation
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  actionUrl?: string;
  potentialValue?: number;
}

// Rule configuration for createRule factory
export interface RuleConfig {
  id: string;
  name: string;
  condition: (ctx: FinancialContext) => boolean | Promise<boolean>;
  recommendation: Omit<Recommendation, 'id'>;
}

// A financial rule interface
export interface FinancialRule {
  id: string;
  name: string;
  evaluate(context: FinancialContext): Promise<Recommendation | null>;
}

// Priority order for sorting (higher = more important)
export const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

// Type labels in Hebrew
export const TYPE_LABELS: Record<RecommendationType, string> = {
  tax_benefit: 'הטבת מס',
  savings: 'חיסכון',
  insurance: 'ביטוח',
  banking: 'בנקאות',
  general: 'כללי',
};

// Priority labels in Hebrew
export const PRIORITY_LABELS: Record<RecommendationPriority, string> = {
  high: 'גבוהה',
  medium: 'בינונית',
  low: 'נמוכה',
};
