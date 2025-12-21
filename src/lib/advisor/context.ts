/**
 * Financial Advisor Engine - Context Loader
 * טוען את כל הנתונים הפיננסיים של המשתמש לצורך ניתוח
 */

import { prisma } from '@/lib/prisma';
import { FinancialContext, FinancialMetrics, UserWithProfile } from './types';
import { Asset, Liability, Transaction, RecurringTransaction } from '@/lib/types';
import { LIQUID_ASSET_TYPES, INTEREST_THRESHOLDS } from './constants';

/**
 * Get user financial context for advisor engine
 * Fetches all relevant data and calculates metrics
 */
export async function getUserFinancialContext(userId: string): Promise<FinancialContext> {
  // Fetch all data in parallel
  const [
    userWithProfile,
    assets,
    liabilities,
    transactions,
    recurring,
  ] = await Promise.all([
    // User with profile
    prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    }),
    
    // Assets
    prisma.asset.findMany({
      where: { userId },
    }),
    
    // Liabilities
    prisma.liability.findMany({
      where: { userId },
    }),
    
    // Transactions from last 3 months
    prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        },
      },
      orderBy: { date: 'desc' },
    }),
    
    // Recurring transactions
    prisma.recurringTransaction.findMany({
      where: { userId },
    }),
  ]);

  if (!userWithProfile) {
    throw new Error('User not found');
  }

  // Transform user to our type
  const user: UserWithProfile = {
    id: userWithProfile.id,
    name: userWithProfile.name,
    email: userWithProfile.email,
    profile: userWithProfile.profile ? {
      id: userWithProfile.profile.id,
      userId: userWithProfile.profile.userId,
      militaryStatus: userWithProfile.profile.militaryStatus as 'none' | 'reserve' | 'career' | undefined,
      maritalStatus: userWithProfile.profile.maritalStatus as 'single' | 'married' | 'divorced' | 'widowed' | undefined,
      employmentType: userWithProfile.profile.employmentType as 'employee' | 'self_employed' | 'both' | 'student' | undefined,
      hasChildren: userWithProfile.profile.hasChildren,
      childrenCount: userWithProfile.profile.childrenCount,
      ageRange: userWithProfile.profile.ageRange as '18-25' | '26-35' | '36-45' | '46-55' | '56-65' | '65+' | undefined,
      monthlyIncome: userWithProfile.profile.monthlyIncome ?? undefined,
      riskTolerance: userWithProfile.profile.riskTolerance as 'low' | 'medium' | 'high' | undefined,
      isStudent: userWithProfile.profile.isStudent,
      graduationDate: userWithProfile.profile.graduationDate?.toISOString(),
    } : null,
  };

  // Transform assets
  const transformedAssets: Asset[] = assets.map(a => ({
    id: a.id,
    name: a.name,
    category: a.category,
    value: a.value,
    liquidity: a.liquidity as 'immediate' | 'short_term' | 'pension' | 'locked',
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  // Transform liabilities
  const transformedLiabilities: Liability[] = liabilities.map(l => ({
    id: l.id,
    name: l.name,
    type: l.type as 'loan' | 'mortgage',
    totalAmount: l.totalAmount,
    monthlyPayment: l.monthlyPayment,
    interestRate: l.interestRate,
    loanTermMonths: l.loanTermMonths,
    startDate: l.startDate.toISOString(),
    remainingAmount: l.remainingAmount ?? undefined,
    loanMethod: l.loanMethod as 'spitzer' | 'equal_principal',
    hasInterestRebate: l.hasInterestRebate,
    linkage: l.linkage as 'none' | 'index' | 'foreign',
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));

  // Transform transactions
  const transformedTransactions: Transaction[] = transactions.map(t => ({
    id: t.id,
    type: t.type as 'income' | 'expense',
    amount: t.amount,
    category: t.category,
    description: t.description,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  // Transform recurring transactions
  const transformedRecurring: RecurringTransaction[] = recurring.map(r => ({
    id: r.id,
    type: r.type as 'income' | 'expense',
    amount: r.amount,
    category: r.category,
    name: r.name,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  // Calculate metrics
  const metrics = calculateMetrics(
    transformedAssets,
    transformedLiabilities,
    transformedTransactions,
    transformedRecurring
  );

  return {
    user,
    assets: transformedAssets,
    liabilities: transformedLiabilities,
    transactions: transformedTransactions,
    recurring: transformedRecurring,
    metrics,
  };
}

/**
 * Calculate financial metrics from the data
 */
function calculateMetrics(
  assets: Asset[],
  liabilities: Liability[],
  transactions: Transaction[],
  recurring: RecurringTransaction[]
): FinancialMetrics {
  // Total assets
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  
  // Total liabilities (remaining amounts)
  const totalLiabilities = liabilities.reduce(
    (sum, l) => sum + (l.remainingAmount ?? l.totalAmount), 
    0
  );
  
  // Net worth
  const netWorth = totalAssets - totalLiabilities;
  
  // Liquid assets (immediate + short_term)
  const liquidAssets = assets
    .filter(a => LIQUID_ASSET_TYPES.includes(a.liquidity as 'immediate' | 'short_term'))
    .reduce((sum, a) => sum + a.value, 0);
  
  // High interest debt
  const highInterestDebt = liabilities
    .filter(l => l.interestRate > INTEREST_THRESHOLDS.HIGH_INTEREST_RATE)
    .reduce((sum, l) => sum + (l.remainingAmount ?? l.totalAmount), 0);
  
  // Monthly income from recurring
  const monthlyIncome = recurring
    .filter(r => r.type === 'income' && r.isActive)
    .reduce((sum, r) => sum + r.amount, 0);
  
  // Monthly expenses from recurring + liability payments
  const recurringExpenses = recurring
    .filter(r => r.type === 'expense' && r.isActive)
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);
  
  const liabilityPayments = liabilities.reduce((sum, l) => sum + l.monthlyPayment, 0);
  const monthlyExpenses = recurringExpenses + liabilityPayments;
  
  // Monthly cash flow
  const monthlyCashFlow = monthlyIncome - monthlyExpenses;
  
  // Savings rate
  const savingsRate = monthlyIncome > 0 
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 
    : 0;
  
  return {
    netWorth,
    totalAssets,
    totalLiabilities,
    savingsRate,
    monthlyIncome,
    monthlyExpenses,
    monthlyCashFlow,
    liquidAssets,
    highInterestDebt,
  };
}

