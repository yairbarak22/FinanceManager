/**
 * Financial Advisor Engine - Helper Functions
 * פונקציות עזר לבדיקת תנאים בחוקי ההמלצות
 */

import { FinancialContext } from './types';
import {
  REAL_ESTATE_CATEGORIES,
  LIQUID_ASSET_TYPES,
  INTEREST_THRESHOLDS,
  KEYWORDS,
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
 * Get children count
 */
export function getChildrenCount(ctx: FinancialContext): number {
  return ctx.user.profile?.childrenCount ?? 0;
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

/**
 * Check if user is recently graduated (last 2 years)
 */
export function isRecentGraduate(ctx: FinancialContext): boolean {
  if (!ctx.user.profile?.graduationDate) return false;
  const gradDate = new Date(ctx.user.profile.graduationDate);
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  return gradDate >= twoYearsAgo;
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
 * Count real estate properties
 */
export function getRealEstateCount(ctx: FinancialContext): number {
  return ctx.assets.filter(a => 
    REAL_ESTATE_CATEGORIES.includes(a.category as typeof REAL_ESTATE_CATEGORIES[number])
  ).length;
}

/**
 * Check if monthly cash flow is negative
 */
export function hasNegativeCashFlow(ctx: FinancialContext): boolean {
  return ctx.metrics.monthlyCashFlow < 0;
}

/**
 * Check if monthly cash flow is positive
 */
export function hasPositiveCashFlow(ctx: FinancialContext): boolean {
  return ctx.metrics.monthlyCashFlow > 0;
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
// Asset Specific Checks - בדיקות נכסים ספציפיים
// ============================================

/**
 * Check if user has Keren Hishtalmut asset
 */
export function hasKerenHishtalmut(ctx: FinancialContext): boolean {
  return ctx.assets.some(a => 
    a.category === 'education_fund' || 
    a.name.includes('קרן השתלמות') ||
    a.name.includes('קה"ש')
  );
}

/**
 * Get Keren Hishtalmut total value
 */
export function getKerenHishtalmutValue(ctx: FinancialContext): number {
  return ctx.assets
    .filter(a => 
      a.category === 'education_fund' || 
      a.name.includes('קרן השתלמות') ||
      a.name.includes('קה"ש')
    )
    .reduce((sum, a) => sum + a.value, 0);
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
 * Check if user has transactions with specific keywords
 */
export function hasTransactionsWithKeywords(
  ctx: FinancialContext, 
  keywords: readonly string[],
  type?: 'income' | 'expense'
): boolean {
  return ctx.transactions.some(t => {
    if (type && t.type !== type) return false;
    const description = t.description.toLowerCase();
    return keywords.some(kw => 
      description.includes(kw.toLowerCase())
    );
  });
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

/**
 * Check if user has rental income
 */
export function hasRentalIncome(ctx: FinancialContext): boolean {
  return hasTransactionsWithKeywords(ctx, KEYWORDS.RENT_INCOME, 'income');
}

/**
 * Get monthly rental income (average over available transaction data)
 */
export function getMonthlyRentalIncome(ctx: FinancialContext): number {
  const rentTransactions = ctx.transactions.filter(t =>
    t.type === 'income' &&
    KEYWORDS.RENT_INCOME.some(kw => t.description.toLowerCase().includes(kw.toLowerCase()))
  );
  const total = rentTransactions.reduce((sum, t) => sum + t.amount, 0);
  // Assume 3 months of transaction data
  return total / 3;
}

/**
 * Check if user pays arnona (municipal tax)
 */
export function paysArnona(ctx: FinancialContext): boolean {
  return hasTransactionsWithKeywords(ctx, KEYWORDS.ARNONA, 'expense');
}

/**
 * Check if user has life insurance payments
 */
export function paysLifeInsurance(ctx: FinancialContext): boolean {
  return hasTransactionsWithKeywords(ctx, KEYWORDS.LIFE_INSURANCE, 'expense');
}

/**
 * Check if user has special needs child indicators
 */
export function hasSpecialNeedsIndicators(ctx: FinancialContext): boolean {
  return hasTransactionsWithKeywords(ctx, KEYWORDS.SPECIAL_NEEDS, 'expense');
}

/**
 * Check if user pays for daycare
 */
export function paysDaycare(ctx: FinancialContext): boolean {
  return hasTransactionsWithKeywords(ctx, KEYWORDS.DAYCARE, 'expense');
}

/**
 * Check if user has electricity income (solar panels)
 */
export function hasElectricityIncome(ctx: FinancialContext): boolean {
  return hasTransactionsWithKeywords(ctx, KEYWORDS.ELECTRICITY_INCOME, 'income');
}

/**
 * Get bank fees from transactions
 */
export function getMonthlyBankFees(ctx: FinancialContext): number {
  const feeTransactions = ctx.transactions.filter(t =>
    t.type === 'expense' &&
    KEYWORDS.BANK_FEES.some(kw => t.description.toLowerCase().includes(kw.toLowerCase()))
  );
  const total = feeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  // Assume 3 months of transaction data
  return total / 3;
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

// ============================================
// Income & Tax Helpers - עזרים להכנסה ומס
// ============================================

/**
 * Get estimated age from profile (alias for getEstimatedAge)
 */
export function getAge(ctx: FinancialContext): number {
  return getEstimatedAge(ctx) ?? 30; // Default to 30 if unknown
}

/**
 * Get liquid assets value (alias for getLiquidAssetsValue)
 */
export function getLiquidAssets(ctx: FinancialContext): number {
  return getLiquidAssetsValue(ctx);
}

/**
 * Get Keren Hishtalmut balance (alias for getKerenHishtalmutValue)
 */
export function getKerenHishtalmutBalance(ctx: FinancialContext): number {
  return getKerenHishtalmutValue(ctx);
}

/**
 * Get estimated annual income
 * Based on recurring income × 12 or transactions average
 */
export function getAnnualIncome(ctx: FinancialContext): number {
  // Primary: recurring income × 12
  const recurringAnnual = ctx.metrics.monthlyIncome * 12;
  if (recurringAnnual > 0) return recurringAnnual;

  // Fallback: transaction income × 4 (3 months data → annual)
  const transactionIncome = ctx.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  return transactionIncome * 4;
}

/**
 * Get estimated taxable income (annual)
 * For simplicity, uses gross income (real calculation would subtract deductions)
 */
export function getTaxableIncome(ctx: FinancialContext): number {
  return getAnnualIncome(ctx);
}

/**
 * Get donation sum for current year
 * Searches transactions for donation-related keywords
 */
export function getDonationSum(ctx: FinancialContext): number {
  const donationKeywords = [
    'תרומה', 'תרומות', 'עמותת', 'עמותה', 'צדקה',
    'jgive', 'israelgives', 'donation', 'charity'
  ];

  const currentYear = new Date().getFullYear();

  return ctx.transactions
    .filter(t => {
      // Only expenses (donations are expenses)
      if (t.type !== 'expense') return false;

      // Check if in current year
      const transactionYear = new Date(t.date).getFullYear();
      if (transactionYear !== currentYear) return false;

      // Check keywords
      const desc = t.description.toLowerCase();
      const cat = t.category.toLowerCase();
      return donationKeywords.some(kw =>
        desc.includes(kw.toLowerCase()) || cat.includes(kw.toLowerCase())
      );
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

// ============================================
// Real Estate Helpers - עזרים לנדל"ן
// ============================================

/**
 * Check if user bought a property recently (within specified months)
 * Looks for real estate assets created recently
 */
export function boughtPropertyRecently(ctx: FinancialContext, monthsAgo: number = 18): boolean {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsAgo);

  return ctx.assets.some(a => {
    // Check if it's real estate
    const isRealEstate = REAL_ESTATE_CATEGORIES.some(cat =>
      a.category.toLowerCase().includes(cat.toLowerCase())
    );
    if (!isRealEstate) return false;

    // Check if created recently
    if (!a.createdAt) return false;
    const createdDate = new Date(a.createdAt);
    return createdDate >= cutoffDate;
  });
}

/**
 * Get total real estate value
 */
export function getRealEstateValue(ctx: FinancialContext): number {
  return ctx.assets
    .filter(a => REAL_ESTATE_CATEGORIES.some(cat =>
      a.category.toLowerCase().includes(cat.toLowerCase())
    ))
    .reduce((sum, a) => sum + a.value, 0);
}

// ============================================
// Pension & Benefits Helpers - עזרים לפנסיה והטבות
// ============================================

/**
 * Get estimated pension contribution percentage
 * Returns a default based on employment type (real data would come from profile)
 */
export function getPensionContributionPct(ctx: FinancialContext): number {
  // Default assumption: most employees contribute 5.5-6%
  // Self-employed often contribute less
  if (isSelfEmployed(ctx) && !isEmployee(ctx)) {
    return 4; // Self-employed typically contribute less
  }
  return 5.5; // Default employee contribution
}

/**
 * Check if user has pension assets
 */
export function hasPension(ctx: FinancialContext): boolean {
  return ctx.assets.some(a =>
    a.category === 'pension' ||
    a.name.includes('פנסיה') ||
    a.name.includes('קופת גמל')
  );
}

/**
 * Get pension total value
 */
export function getPensionValue(ctx: FinancialContext): number {
  return ctx.assets
    .filter(a =>
      a.category === 'pension' ||
      a.name.includes('פנסיה') ||
      a.name.includes('קופת גמל')
    )
    .reduce((sum, a) => sum + a.value, 0);
}

// ============================================
// Investment Helpers - עזרים להשקעות
// ============================================

/**
 * Get investment assets (stocks, crypto, etc.)
 */
export function getInvestmentAssets(ctx: FinancialContext): number {
  const investmentCategories = ['stocks', 'crypto', 'investments', 'שוק ההון', 'קריפטו'];
  return ctx.assets
    .filter(a => investmentCategories.some(cat =>
      a.category.toLowerCase().includes(cat.toLowerCase())
    ))
    .reduce((sum, a) => sum + a.value, 0);
}

/**
 * Get uninvested cash (immediate liquidity)
 */
export function getUninvestedCash(ctx: FinancialContext): number {
  return ctx.metrics.uninvestedCash;
}

/**
 * Get current month (1-12)
 */
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

/**
 * Check if it's end of year (November or December)
 */
export function isEndOfYear(): boolean {
  return getCurrentMonth() >= 11;
}
