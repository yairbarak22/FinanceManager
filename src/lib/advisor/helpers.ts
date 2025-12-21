/**
 * Financial Advisor Engine - Helper Functions
 * פונקציות עזר לבדיקת תנאים בחוקי ההמלצות
 */

import { FinancialContext } from './types';
import {
  REAL_ESTATE_CATEGORIES,
  LIQUID_ASSET_TYPES,
  INTEREST_THRESHOLDS,
} from './constants';

// ============================================
// Profile Checks - בדיקות פרופיל
// ============================================

/**
 * Check if user has a complete profile
 */
export function hasProfile(ctx: FinancialContext): boolean {
  return ctx.user.profile !== null && ctx.user.profile !== undefined;
}

/**
 * Check if user is career military (קבע)
 */
export function isCareer(ctx: FinancialContext): boolean {
  return ctx.user.profile?.militaryStatus === 'career';
}

/**
 * Check if user is reservist (מילואימניק)
 */
export function isReservist(ctx: FinancialContext): boolean {
  return ctx.user.profile?.militaryStatus === 'reserve';
}

/**
 * Check if user is self-employed (עצמאי)
 */
export function isSelfEmployed(ctx: FinancialContext): boolean {
  const empType = ctx.user.profile?.employmentType;
  return empType === 'self_employed' || empType === 'both';
}

/**
 * Check if user is an employee (שכיר)
 */
export function isEmployee(ctx: FinancialContext): boolean {
  const empType = ctx.user.profile?.employmentType;
  return empType === 'employee' || empType === 'both';
}

/**
 * Check if user is a student (סטודנט)
 */
export function isStudent(ctx: FinancialContext): boolean {
  return ctx.user.profile?.isStudent === true || 
         ctx.user.profile?.employmentType === 'student';
}

/**
 * Check if user is married
 */
export function isMarried(ctx: FinancialContext): boolean {
  return ctx.user.profile?.maritalStatus === 'married';
}

/**
 * Check if user has children
 */
export function hasChildren(ctx: FinancialContext): boolean {
  return ctx.user.profile?.hasChildren === true;
}

/**
 * Get the middle of an age range (for calculations)
 */
function getAgeFromRange(ageRange?: string): number | null {
  if (!ageRange) return null;
  
  const ranges: Record<string, number> = {
    '18-25': 22,
    '26-35': 30,
    '36-45': 40,
    '46-55': 50,
    '56-65': 60,
    '65+': 70,
  };
  
  return ranges[ageRange] ?? null;
}

/**
 * Check if user is within an age range
 */
export function isInAgeRange(ctx: FinancialContext, minAge: number, maxAge: number): boolean {
  const age = getAgeFromRange(ctx.user.profile?.ageRange);
  if (age === null) return false;
  return age >= minAge && age <= maxAge;
}

/**
 * Get estimated user age
 */
export function getEstimatedAge(ctx: FinancialContext): number | null {
  return getAgeFromRange(ctx.user.profile?.ageRange);
}

// ============================================
// Financial Checks - בדיקות פיננסיות
// ============================================

/**
 * Check if user has high-interest debt
 */
export function hasHighInterestDebt(
  ctx: FinancialContext, 
  threshold: number = INTEREST_THRESHOLDS.HIGH_INTEREST_RATE
): boolean {
  return ctx.liabilities.some(l => l.interestRate > threshold);
}

/**
 * Get total high-interest debt amount
 */
export function getHighInterestDebtAmount(
  ctx: FinancialContext,
  threshold: number = INTEREST_THRESHOLDS.HIGH_INTEREST_RATE
): number {
  return ctx.liabilities
    .filter(l => l.interestRate > threshold)
    .reduce((sum, l) => sum + (l.remainingAmount ?? l.totalAmount), 0);
}

/**
 * Get the highest interest rate on liabilities
 */
export function getHighestInterestRate(ctx: FinancialContext): number {
  if (ctx.liabilities.length === 0) return 0;
  return Math.max(...ctx.liabilities.map(l => l.interestRate));
}

/**
 * Check if user has liquid assets
 */
export function hasLiquidAssets(ctx: FinancialContext): boolean {
  return ctx.metrics.liquidAssets > 0;
}

/**
 * Get total liquid assets value
 */
export function getLiquidAssetsValue(ctx: FinancialContext): number {
  return ctx.assets
    .filter(a => LIQUID_ASSET_TYPES.includes(a.liquidity as 'immediate' | 'short_term'))
    .reduce((sum, a) => sum + a.value, 0);
}

/**
 * Check if user has no real estate
 */
export function hasNoRealEstate(ctx: FinancialContext): boolean {
  return !ctx.assets.some(a => 
    REAL_ESTATE_CATEGORIES.includes(a.category as typeof REAL_ESTATE_CATEGORIES[number])
  );
}

/**
 * Check if user has real estate
 */
export function hasRealEstate(ctx: FinancialContext): boolean {
  return !hasNoRealEstate(ctx);
}

/**
 * Check if monthly cash flow is negative
 */
export function hasNegativeCashFlow(ctx: FinancialContext): boolean {
  return ctx.metrics.monthlyCashFlow < 0;
}

/**
 * Get monthly cash flow
 */
export function getMonthlyCashFlow(ctx: FinancialContext): number {
  return ctx.metrics.monthlyCashFlow;
}

/**
 * Check if user has a mortgage
 */
export function hasMortgage(ctx: FinancialContext): boolean {
  return ctx.liabilities.some(l => l.type === 'mortgage');
}

/**
 * Check if user has any liabilities
 */
export function hasLiabilities(ctx: FinancialContext): boolean {
  return ctx.liabilities.length > 0;
}

// ============================================
// Transaction Checks - בדיקות עסקאות
// ============================================

/**
 * Find transactions matching keywords (case-insensitive)
 */
export function findTransactionsByKeywords(
  ctx: FinancialContext,
  keywords: readonly string[]
): FinancialContext['transactions'] {
  const lowerKeywords = keywords.map(k => k.toLowerCase());
  
  return ctx.transactions.filter(t => {
    const description = t.description.toLowerCase();
    const category = t.category.toLowerCase();
    return lowerKeywords.some(kw => 
      description.includes(kw) || category.includes(kw)
    );
  });
}

/**
 * Sum transaction amounts matching keywords
 */
export function sumTransactionsByKeywords(
  ctx: FinancialContext,
  keywords: readonly string[]
): number {
  const matching = findTransactionsByKeywords(ctx, keywords);
  return matching.reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/**
 * Get total income from transactions
 */
export function getTotalIncome(ctx: FinancialContext): number {
  return ctx.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Get total expenses from transactions
 */
export function getTotalExpenses(ctx: FinancialContext): number {
  return ctx.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

// ============================================
// Recurring Transaction Checks - בדיקות עסקאות קבועות
// ============================================

/**
 * Get total recurring income
 */
export function getRecurringIncome(ctx: FinancialContext): number {
  return ctx.recurring
    .filter(r => r.type === 'income' && r.isActive)
    .reduce((sum, r) => sum + r.amount, 0);
}

/**
 * Get total recurring expenses
 */
export function getRecurringExpenses(ctx: FinancialContext): number {
  return ctx.recurring
    .filter(r => r.type === 'expense' && r.isActive)
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);
}
