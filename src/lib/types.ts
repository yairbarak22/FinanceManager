// Types for the finance manager application

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  name: string;
  isActive: boolean;
  activeMonths?: string[] | null; // Array of month keys in "YYYY-MM" format, null = all months
  goalId?: string; // קישור ליעד פיננסי (אופציונלי)
  createdAt?: string;
  updatedAt?: string;
}

// יעד פיננסי
export interface FinancialGoal {
  id: string;
  userId: string;
  name: string;                    // שם היעד (למשל: "קניית דירה לילד")
  targetAmount: number;            // סכום היעד הכולל
  currentAmount: number;           // סכום שנצבר עד כה
  deadline: string;                // תאריך היעד
  category: string;                // קטגוריה (saving, travel, car, home, education, emergency)
  icon?: string;                   // שם האייקון מ-Lucide
  recurringTransactionId?: string; // קישור להוצאה קבועה (אופציונלי)
  recurringTransaction?: RecurringTransaction; // הוצאה קבועה מקושרת
  createdAt?: string;
  updatedAt?: string;
}

// קטגוריות יעדים מוגדרות מראש
export type GoalCategory = 
  | 'saving'    // חיסכון כללי
  | 'travel'    // נסיעות
  | 'car'       // רכב
  | 'home'      // דירה/בית
  | 'education' // לימודים
  | 'vacation'  // חופשה
  | 'emergency' // קרן חירום
  | 'other';    // אחר

export interface Asset {
  id: string;
  name: string;
  category: string; // 'investments' | 'real_estate' etc.
  value: number;
  liquidity?: 'immediate' | 'short_term' | 'pension' | 'locked'; // נזילות הנכס
  gemachId?: string; // UUID linking to paired Liability (null for regular assets)
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetValueHistory {
  id: string;
  assetId: string;
  value: number;
  monthKey: string; // "2025-12" format
  createdAt?: string;
}

export interface Liability {
  id: string;
  name: string;
  type: string;
  totalAmount: number;        // סכום ההלוואה המקורי
  monthlyPayment: number;     // תשלום חודשי קבוע
  interestRate: number;       // ריבית שנתית באחוזים
  loanTermMonths: number;     // תקופת ההלוואה בחודשים
  startDate: string;          // תאריך תחילת ההלוואה
  remainingAmount?: number;   // יתרת החוב הנוכחית
  loanMethod: 'spitzer' | 'equal_principal'; // שיטת ההלוואה
  hasInterestRebate: boolean; // זיכוי על הריבית
  linkage?: 'none' | 'index' | 'foreign'; // הצמדה (אין / מדד / מט"ח)
  isActiveInCashFlow?: boolean; // האם פעיל בתזרים החודשי (ברירת מחדל: true)
  gemachId?: string; // UUID linking to paired Asset (null for regular liabilities)
  createdAt?: string;
  updatedAt?: string;
}

// שורה בלוח סילוקין
export interface AmortizationRow {
  month: number;
  date: Date;
  payment: number;      // תשלום כולל
  principal: number;    // קרן
  interest: number;     // ריבית
  balance: number;      // יתרה
}

export interface NetWorthHistory {
  id: string;
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

// מסמך מצורף
export interface Document {
  id: string;
  filename: string;     // שם הקובץ המקורי
  storedName: string;   // שם הקובץ בשרת
  mimeType: string;
  size: number;         // גודל בבייטים
  entityType: 'asset' | 'liability';
  entityId: string;
  createdAt?: string;
}

// אחזקה בתיק השקעות
export interface Holding {
  id: string;
  name: string;
  symbol?: string;
  type: 'etf' | 'index_fund';
  currentValue: number;
  targetAllocation: number; // 0-100
  createdAt?: string;
  updatedAt?: string;
}

// קטגוריה מותאמת אישית
export interface CustomCategory {
  id: string;
  name: string;
  type: 'expense' | 'income' | 'asset' | 'liability';
  icon?: string;
  color?: string;
  createdAt?: string;
}

// Category definitions
export type ExpenseCategory = 
  | 'housing'      // דיור
  | 'food'         // מזון
  | 'transport'    // תחבורה
  | 'entertainment' // בילויים
  | 'bills'        // חשבונות
  | 'health'       // בריאות
  | 'maaser'       // מעשר כספים (חרדי)
  | 'donation'     // תרומה (חרדי)
  | 'other';       // אחר

export type IncomeCategory = 
  | 'salary'       // משכורת
  | 'bonus'        // בונוס
  | 'investment'   // השקעות
  | 'other';       // אחר

export type AssetCategory = 
  | 'apartment'       // דירה
  | 'stocks'          // שוק ההון
  | 'crypto'          // קריפטו
  | 'education_fund'  // קרן השתלמות
  | 'pension';        // פנסיה

export type LiabilityType = 
  | 'loan'           // הלוואה
  | 'mortgage'       // משכנתא
  | 'credit_card'    // כרטיס אשראי
  | 'car_loan'       // הלוואת רכב
  | 'student_loan'   // הלוואת סטודנטים
  | (string & {});   // קטגוריות מותאמות אישית

// Monthly summary
export interface MonthlySummary {
  month: string;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  transactionCount: number;
  savingsRate: number;
}

// Dashboard data
export interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  fixedIncome: number;
  fixedExpenses: number;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyLiabilityPayments: number;
}

// User Profile for advisor
export interface UserProfile {
  id: string;
  userId: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  employmentType?: 'employee' | 'self_employed' | 'both' | 'student';
  hasChildren: boolean;
  childrenCount: number;
  ageRange?: '18-25' | '26-35' | '36-45' | '46-55' | '56-65' | '65+';
  monthlyIncome?: string;
  riskTolerance?: 'low' | 'medium' | 'high';
  isStudent: boolean;
  graduationDate?: string;
  hasIndependentAccount: boolean;
  createdAt?: string;
  updatedAt?: string;
}
