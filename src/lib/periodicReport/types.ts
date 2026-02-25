import { z } from 'zod';

// --- Request Types ---

export const periodicReportRequestSchema = z
  .object({
    calendarType: z.enum(['gregorian', 'hebrew']),
    month: z.number().int(),
    year: z.number().int(),
    deliveryMethod: z.enum(['download', 'email']),
    email: z.string().email().optional(),
    password: z.string().min(4),
  })
  .refine(
    (data) => {
      if (data.calendarType === 'gregorian') {
        return data.month >= 1 && data.month <= 12;
      }
      return data.month >= 1 && data.month <= 13;
    },
    { message: 'חודש לא תקין', path: ['month'] }
  )
  .refine(
    (data) => {
      if (data.calendarType === 'gregorian') {
        return data.year >= 2020 && data.year <= 2100;
      }
      return data.year >= 5780 && data.year <= 5900;
    },
    { message: 'שנה לא תקינה', path: ['year'] }
  )
  .refine(
    (data) => {
      if (data.deliveryMethod === 'email') {
        return !!data.email;
      }
      return true;
    },
    {
      message: 'כתובת אימייל נדרשת לשליחה במייל',
      path: ['email'],
    }
  );

export type PeriodicReportRequest = z.infer<typeof periodicReportRequestSchema>;

// --- Date Range ---

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// --- Response Types ---

export interface CashFlowData {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  transactionIncome: number;
  fixedIncome: number;
  transactionExpenses: number;
  fixedExpenses: number;
  liabilityPayments: number;
}

export interface TopExpenseItem {
  category: string;
  categoryName: string;
  amount: number;
  percentage: number;
  momChangePercent: number | null;
}

export interface TopIncomeItem {
  category: string;
  categoryName: string;
  amount: number;
  percentage: number;
  momChangePercent: number | null;
}

export interface MonthOverMonthComparison {
  prevPeriodLabel: string;
  netWorthChange: number | null;
  netWorthChangePercent: number | null;
  incomeChange: number | null;
  incomeChangePercent: number | null;
  expenseChange: number | null;
  expenseChangePercent: number | null;
  cashflowChange: number | null;
}

export interface PeriodInfo {
  startDate: string;
  endDate: string;
  label: string;
  calendarType: 'gregorian' | 'hebrew';
}

export interface BreakdownLineItem {
  name: string;
  value: number;
}

export interface AssetBreakdownItem {
  group: string;
  groupNameHe: string;
  items: BreakdownLineItem[];
  total: number;
}

export interface LiabilityBreakdownItem {
  group: string;
  groupNameHe: string;
  items: BreakdownLineItem[];
  total: number;
}

export interface GoalStatus {
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  monthlyContribution: number;
  status: string;
  contributedThisMonth: boolean;
  requiredMonthly: number;
  projectedCompletionDate: string | null;
  monthsRemaining: number | null;
}

export interface ProjectionData {
  nextMonthFixedExpenses: number;
  nextMonthLiabilityPayments: number;
  totalProjected: number;
}

export interface FixedExpenseItem {
  name: string;
  amount: number;
  percentage: number;
}

export interface VariableExpenseItem {
  name: string;
  amount: number;
  percentage: number;
  prevMonthAmount: number | null;
  lastYearAmount: number | null;
}

export interface FixedIncomeItem {
  name: string;
  amount: number;
  percentage: number;
}

export interface VariableIncomeItem {
  name: string;
  amount: number;
  percentage: number;
  prevMonthAmount: number | null;
  lastYearAmount: number | null;
}

export interface CashFlowComparison {
  prevMonthIncome: number | null;
  prevMonthExpenses: number | null;
  prevMonthCashflow: number | null;
  lastYearIncome: number | null;
  lastYearExpenses: number | null;
  lastYearCashflow: number | null;
}

export interface TradingPortfolioData {
  holdings: { name: string; value: number }[];
  totalValue: number;
  hasHoldings: boolean;
  freeCashFlow: number;
}

export interface PeriodicReportData {
  period: PeriodInfo;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  cashFlow: CashFlowData;
  topExpenses: TopExpenseItem[];
  topIncomes: TopIncomeItem[];
  fixedIncomeItems: FixedIncomeItem[];
  variableIncomeItems: VariableIncomeItem[];
  fixedExpenseItems: FixedExpenseItem[];
  variableExpenseItems: VariableExpenseItem[];
  cashFlowComparison: CashFlowComparison;
  monthOverMonth: MonthOverMonthComparison;
  assetBreakdown: AssetBreakdownItem[];
  liabilityBreakdown: LiabilityBreakdownItem[];
  goals: GoalStatus[];
  projections: ProjectionData;
  tradingPortfolio: TradingPortfolioData;
}
