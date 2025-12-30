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
  // Basic metrics
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  savingsRate: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  liquidAssets: number;
  highInterestDebt: number;

  // Strategic indicators
  monthlyBurnRate: number;        // ממוצע הוצאות חודשיות (3 חודשים אחרונים + שוטפות)
  emergencyFundMonths: number;    // חודשי קרן חירום (נכסים נזילים / הוצאות חודשיות)
  uninvestedCash: number;         // מזומן לא מושקע (נכסים עם נזילות 'immediate')
  hasRealEstate: boolean;         // האם יש נדל"ן
  isReservist: boolean;           // האם מילואימניק
  debtToIncomeRatio: number;      // יחס חוב להכנסה
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

// Recommendation category (strategy vs benefit)
export type RecommendationCategory = 'strategy' | 'benefit';

// Priority levels
export type RecommendationPriority = 'high' | 'medium' | 'low';

// A single recommendation
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  category: RecommendationCategory;  // אסטרטגיה (מאקרו) או הטבה (מיקרו)
  actionUrl?: string;
  potentialValue?: number;
  eligibilityReason?: string; // הסבר למה המשתמש זכאי להמלצה
}

// Rule configuration for createRule factory
export interface RuleConfig {
  id: string;
  name: string;
  condition: (ctx: FinancialContext) => boolean | Promise<boolean>;
  recommendation: Omit<Recommendation, 'id' | 'eligibilityReason' | 'category'> & {
    category?: RecommendationCategory; // ברירת מחדל: 'benefit'
  };
  getEligibilityReason?: (ctx: FinancialContext) => string; // פונקציה דינמית להסבר הזכאות
}

// Advisor response structure
export interface AdvisorResponse {
  strategies: Recommendation[];  // המלצות אסטרטגיות (מאקרו)
  benefits: Recommendation[];    // הטבות ספציפיות (מיקרו)
  stats: {
    totalPotentialValue: number; // סה"כ ערך פוטנציאלי
    activeRulesCount: number;    // מספר חוקים שהופעלו
  };
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

// Category labels in Hebrew
export const CATEGORY_LABELS: Record<RecommendationCategory, string> = {
  strategy: 'אסטרטגיה',
  benefit: 'הטבה',
};
