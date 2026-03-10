// ---------------------------------------------------------------------------
// Financial Insights Rules Engine – Type Definitions
// ---------------------------------------------------------------------------

export type InsightCategory =
  | 'cash_flow'
  | 'investments'
  | 'loans'
  | 'haredi_lifestyle'
  | 'emergency_fund'
  | 'goals'
  | 'trend'
  | 'fees';

export type InsightTone = 'alert' | 'recommendation' | 'positive';

// ---------------------------------------------------------------------------
// Actionable CTA attached to an insight
// ---------------------------------------------------------------------------

export interface InsightAction {
  buttonText: string;
  type: 'internal_route' | 'external_link' | 'course_module' | 'app_action';
  url?: string;
  actionType?: string;
}

// ---------------------------------------------------------------------------
// Historical month summary (for trend analysis)
// ---------------------------------------------------------------------------

export interface MonthSummary {
  monthKey: string;
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  totalAssets: number;
  totalLiabilities: number;
}

// ---------------------------------------------------------------------------
// Loan detail used inside UserFinancialData
// ---------------------------------------------------------------------------

export interface LoanDetail {
  name: string;
  balance: number;
  monthlyPayment: number;
}

// ---------------------------------------------------------------------------
// Goal snapshot used inside UserFinancialData
// ---------------------------------------------------------------------------

export interface GoalSnapshot {
  name: string;
  category: string;
  percentage: number;
  status: string;
  monthlyContribution: number;
}

// ---------------------------------------------------------------------------
// Investment / trading account context
// ---------------------------------------------------------------------------

export interface AssetContext {
  hasActiveHishtalmut: boolean;
  hasTradingAccount: boolean;
  /** Realized capital gains year-to-date (0 when not yet tracked). */
  realizedCapitalGainsYTD: number;
}

// ---------------------------------------------------------------------------
// User profile context relevant to insights
// ---------------------------------------------------------------------------

export interface ProfileContext {
  childrenCount: number;
}

// ---------------------------------------------------------------------------
// Fee context (populated once fee tracking is enabled)
// ---------------------------------------------------------------------------

export interface FeeContext {
  tradingManagementFee?: number;
  tradingPurchaseCommission?: number;
}

// ---------------------------------------------------------------------------
// The full financial snapshot fed into the rules engine
// ---------------------------------------------------------------------------

export interface UserFinancialData {
  // Current month – cash flow
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  fixedExpenses: number;
  variableExpenses: number;

  // Assets
  cashBalance: number;
  investmentPortfolio: number;
  totalAssets: number;

  // Liabilities
  totalLiabilities: number;
  bankLoans: LoanDetail[];
  gemachLoans: LoanDetail[];
  mortgageBalance: number;
  totalMonthlyDebtPayments: number;

  // Goals
  goals: GoalSnapshot[];

  // Haredi lifestyle
  maaserExpenses: number;
  netIncome: number;

  // Historical data (last 3 months, newest first)
  historicalData: MonthSummary[];

  // Derived / context
  freeCashFlow: number;
  annualIncome: number;

  // Extended context for investment rules
  assets: AssetContext;
  profile: ProfileContext;
  fees: FeeContext;
}

// ---------------------------------------------------------------------------
// Rule definition (generic over category for future filtering)
// ---------------------------------------------------------------------------

export interface FinancialRule<T extends InsightCategory = InsightCategory> {
  id: string;
  category: T;
  priority: number;
  /** Optional: the amount of free cash flow this recommendation "costs". */
  requiredFreeCashFlow?: number;
  condition: (data: UserFinancialData) => boolean;
  generateInsight: (data: UserFinancialData) => {
    message: string;
    tone?: InsightTone;
    action?: InsightAction;
  };
}

// ---------------------------------------------------------------------------
// Output produced by the engine
// ---------------------------------------------------------------------------

export interface FinancialInsight {
  id: string;
  category: InsightCategory;
  priority: number;
  tone: InsightTone;
  message: string;
  action?: InsightAction;
}
