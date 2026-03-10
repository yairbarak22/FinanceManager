import type { FinancialRule } from './types';
import { formatILS } from '@/lib/periodicReport/rtlUtils';

// ---------------------------------------------------------------------------
// Helper – safe division (avoids NaN / Infinity)
// ---------------------------------------------------------------------------

function safeDiv(a: number, b: number): number {
  if (!b || !Number.isFinite(b)) return 0;
  return a / b;
}

// ---------------------------------------------------------------------------
// All financial rules
// ---------------------------------------------------------------------------

export const financialRules: FinancialRule[] = [
  // -----------------------------------------------------------------------
  // 1. No Emergency Fund (critical)
  // -----------------------------------------------------------------------
  {
    id: 'no_emergency_fund',
    category: 'emergency_fund',
    priority: 10,
    condition: (d) =>
      d.totalExpenses > 0 && d.cashBalance <= 0,
    generateInsight: (d) => ({
      message: `אין לך קרן חירום. מומלץ להתחיל לחסוך לפחות ${formatILS(d.totalExpenses)} (חודש הוצאות).`,
      action: {
        buttonText: 'למד על קרן חירום',
        type: 'course_module',
        url: '/course/emergency-fund',
      },
    }),
  },

  // -----------------------------------------------------------------------
  // 2. Negative Cash Flow (critical)
  // -----------------------------------------------------------------------
  {
    id: 'negative_cashflow',
    category: 'cash_flow',
    priority: 10,
    condition: (d) => d.netCashflow < 0,
    generateInsight: (d) => ({
      message: `התזרים החודשי שלך שלילי: -${formatILS(d.netCashflow)}. ההוצאות עולות על ההכנסות.`,
      action: {
        buttonText: 'איך לאזן תקציב',
        type: 'course_module',
        url: '/course/budget-rebuilding',
      },
    }),
  },

  // -----------------------------------------------------------------------
  // 3. Emergency Fund Low (< 1 month expenses)
  // -----------------------------------------------------------------------
  {
    id: 'emergency_fund_low',
    category: 'emergency_fund',
    priority: 9,
    condition: (d) =>
      d.totalExpenses > 0 &&
      d.cashBalance > 0 &&
      d.cashBalance < d.totalExpenses,
    generateInsight: (d) => ({
      message: `קרן החירום שלך (${formatILS(d.cashBalance)}) קטנה מחודש הוצאות (${formatILS(d.totalExpenses)}). מומלץ להגדיל.`,
      action: {
        buttonText: 'הגדר יעד חיסכון',
        type: 'internal_route',
        url: '/dashboard',
      },
    }),
  },

  // -----------------------------------------------------------------------
  // 4. Negative Trend – 2 consecutive months in deficit
  // -----------------------------------------------------------------------
  {
    id: 'negative_trend_2months',
    category: 'trend',
    priority: 9,
    condition: (d) => {
      if (d.netCashflow >= 0) return false;
      const prev = d.historicalData;
      if (!prev || prev.length === 0) return false;
      return prev[0].netCashflow < 0;
    },
    generateInsight: (d) => {
      const months = 1 + d.historicalData.filter((m) => m.netCashflow < 0).length;
      return {
        message: `זהו החודש ה-${months} ברציפות שאתה מסיים עם תזרים שלילי. כדאי לבנות מחדש את התקציב.`,
        action: {
          buttonText: 'צפה בשיעור על בניית תקציב',
          type: 'course_module',
          url: '/course/budget-rebuilding',
        },
      };
    },
  },

  // -----------------------------------------------------------------------
  // 5. Ma'aser below 10%
  // -----------------------------------------------------------------------
  {
    id: 'maaser_below_10pct',
    category: 'haredi_lifestyle',
    priority: 8,
    requiredFreeCashFlow: undefined, // dynamically set in generateInsight
    condition: (d) => {
      if (d.netIncome <= 0) return false;
      return d.maaserExpenses < d.netIncome * 0.1;
    },
    generateInsight: (d) => {
      const target = Math.round(d.netIncome * 0.1);
      const gap = target - Math.round(d.maaserExpenses);
      const pct = Math.round(safeDiv(d.maaserExpenses, d.netIncome) * 100);
      return {
        message: `המעשרות שלך ${formatILS(d.maaserExpenses)} (${pct}% מההכנסה הנקייה). להגעה ל-10% חסרים ${formatILS(gap)}.`,
        action: {
          buttonText: 'מחשבון מעשרות',
          type: 'internal_route',
          url: '/maaser',
        },
      };
    },
  },

  // -----------------------------------------------------------------------
  // 6. High Debt-to-Income Ratio
  // -----------------------------------------------------------------------
  {
    id: 'high_debt_ratio',
    category: 'loans',
    priority: 8,
    condition: (d) => {
      if (d.annualIncome <= 0) return false;
      return safeDiv(d.totalLiabilities, d.annualIncome) > 0.5;
    },
    generateInsight: (d) => {
      const ratio = Math.round(safeDiv(d.totalLiabilities, d.annualIncome) * 100);
      return {
        message: `יחס החוב להכנסה שלך גבוה: ${ratio}%. מומלץ לשמור על יחס של עד 50%.`,
        action: {
          buttonText: 'למד על ניהול חובות',
          type: 'course_module',
          url: '/course/debt-management',
        },
      };
    },
  },

  // -----------------------------------------------------------------------
  // 7. Gemach Loan with no repayment
  // -----------------------------------------------------------------------
  {
    id: 'gemach_no_repayment',
    category: 'loans',
    priority: 7,
    requiredFreeCashFlow: 200,
    condition: (d) =>
      d.gemachLoans.some((g) => g.balance > 0 && g.monthlyPayment === 0),
    generateInsight: (d) => {
      const idle = d.gemachLoans.filter(
        (g) => g.balance > 0 && g.monthlyPayment === 0
      );
      const total = idle.reduce((s, g) => s + g.balance, 0);
      return {
        message: `יש לך ${idle.length > 1 ? `${idle.length} הלוואות גמ"ח` : `הלוואת גמ"ח`} בסך ${formatILS(total)} ללא תשלום חודשי. מומלץ להגדיר תשלום קטן.`,
        action: {
          buttonText: 'נהל התחייבויות',
          type: 'internal_route',
          url: '/dashboard',
        },
      };
    },
  },

  // -----------------------------------------------------------------------
  // 8. Goal Behind Schedule
  // -----------------------------------------------------------------------
  {
    id: 'goal_behind',
    category: 'goals',
    priority: 7,
    condition: (d) => d.goals.some((g) => g.status === 'behind'),
    generateInsight: (d) => {
      const behind = d.goals.filter((g) => g.status === 'behind');
      if (behind.length === 1) {
        return {
          message: `היעד "${behind[0].name}" מפגר (${behind[0].percentage}%). כדאי להגדיל את ההפרשה החודשית.`,
          action: {
            buttonText: 'עדכן יעדים',
            type: 'internal_route',
            url: '/dashboard',
          },
        };
      }
      return {
        message: `${behind.length} מהיעדים שלך מפגרים. כדאי לבדוק את ההפרשות החודשיות.`,
        action: {
          buttonText: 'עדכן יעדים',
          type: 'internal_route',
          url: '/dashboard',
        },
      };
    },
  },

  // -----------------------------------------------------------------------
  // 9. Prioritize Keren Hishtalmut before opening a trading account
  // -----------------------------------------------------------------------
  {
    id: 'prioritize_hishtalmut',
    category: 'investments',
    priority: 9,
    requiredFreeCashFlow: 300,
    condition: (d) =>
      d.freeCashFlow > 300 &&
      !d.assets.hasActiveHishtalmut &&
      !d.assets.hasTradingAccount,
    generateInsight: () => ({
      message:
        'יש לך כסף פנוי להשקעה! לפני שפותחים תיק השקעות עצמאי, הצעד החכם ביותר הוא לפתוח קרן השתלמות ולנצל את הפטור המלא ממס רווחי הון. זה שווה לך המון כסף בעתיד.',
      action: {
        buttonText: 'למד על קרן השתלמות',
        type: 'course_module',
        url: '/course/keren-hishtalmut-basics',
      },
    }),
  },

  // -----------------------------------------------------------------------
  // 10. Open trading account (hishtalmut done, surplus cash)
  // -----------------------------------------------------------------------
  {
    id: 'open_trading_account',
    category: 'investments',
    priority: 8,
    requiredFreeCashFlow: 500,
    condition: (d) =>
      d.freeCashFlow > 500 &&
      d.assets.hasActiveHishtalmut &&
      !d.assets.hasTradingAccount,
    generateInsight: () => ({
      message:
        'קרן ההשתלמות שלך עובדת נהדר, ויש לך עודף תזרימי. זה הזמן המושלם לפתוח תיק מסחר עצמאי (IRA/ברוקר). חשוב לבחור פלטפורמה שמציעה תנאים תחרותיים, כמו 0.1% דמי ניהול, 0.1% עמלת קנייה וללא עמלות הפקדה.',
      action: {
        buttonText: 'איך פותחים תיק עצמאי?',
        type: 'course_module',
        url: '/course/independent-trading-guide',
      },
    }),
  },

  // -----------------------------------------------------------------------
  // 11. Optimize trading fees
  // -----------------------------------------------------------------------
  {
    id: 'optimize_trading_fees',
    category: 'fees',
    priority: 8,
    condition: (d) =>
      d.assets.hasTradingAccount &&
      ((d.fees.tradingManagementFee ?? 0) > 0.1 ||
        (d.fees.tradingPurchaseCommission ?? 0) > 0.1),
    generateInsight: (d) => {
      const fee = d.fees.tradingManagementFee ?? 0;
      return {
        message: `אתה משלם דמי ניהול של ${fee}% בתיק המסחר שלך. כיום ניתן להשיג בבתי ההשקעות המובילים תנאים של סביב 0.1% דמי ניהול ו-0.1% עמלת קנייה ללא דמי משמרת. זה יכול לחסוך לך אלפי שקלים לאורך השנים. כדאי לבצע סקר שוק או להתמקח.`,
        action: {
          buttonText: 'איך להוזיל עמלות?',
          type: 'course_module',
          url: '/course/negotiating-fees',
        },
      };
    },
  },

  // -----------------------------------------------------------------------
  // 12. Chasunah (wedding) fund via trading account
  // -----------------------------------------------------------------------
  {
    id: 'chasunah_fund_trading',
    category: 'goals',
    priority: 7,
    condition: (d) =>
      d.profile.childrenCount > 0 &&
      d.freeCashFlow > 250 &&
      !d.goals.some(
        (g) =>
          g.category === 'chasunah' ||
          g.name.includes('חתונה') ||
          g.name.includes('חתונות')
      ),
    generateInsight: () => ({
      message:
        `הוצאות החתונה לילדים דורשות היערכות מוקדמת. פתיחת תיק מסחר עצמאי והפקדה של אפילו ${formatILS(250)} בחודש למשך 15 שנה, יכולים לצבור סכום משמעותי בזכות אפקט הריבית דריבית, שיחסוך ממך הלוואות וגמ"חים בעתיד.`,
      action: {
        buttonText: 'הגדר יעד חתונות עכשיו',
        type: 'app_action',
        actionType: 'OPEN_GOAL_MODAL',
      },
    }),
  },

  // -----------------------------------------------------------------------
  // 13. Ma'aser on realized capital gains
  // -----------------------------------------------------------------------
  {
    id: 'maaser_on_capital_gains',
    category: 'haredi_lifestyle',
    priority: 6,
    condition: (d) =>
      d.assets.hasTradingAccount &&
      d.assets.realizedCapitalGainsYTD > 1000,
    generateInsight: () => ({
      message:
        'שמנו לב שמימשת רווחים יפים בתיק ההשקעות שלך. כדאי לזכור: רווחי הון ריאליים חייבים במעשר כספים (לפי רוב הפוסקים, בעת המימוש). מומלץ להיוועץ ברב כיצד לחשב את ההפרשה המדויקת לאחר ניכוי האינפלציה והמס.',
      action: {
        buttonText: 'מדריך מעשרות והשקעות',
        type: 'course_module',
        url: '/course/halacha-investments',
      },
    }),
  },

  // -----------------------------------------------------------------------
  // 15. Excessive Fixed Expenses (> 70% of income)
  // -----------------------------------------------------------------------
  {
    id: 'excessive_fixed',
    category: 'cash_flow',
    priority: 6,
    condition: (d) => {
      if (d.totalIncome <= 0) return false;
      return safeDiv(d.fixedExpenses, d.totalIncome) > 0.7;
    },
    generateInsight: (d) => {
      const pct = Math.round(safeDiv(d.fixedExpenses, d.totalIncome) * 100);
      return {
        message: `הוצאות קבועות מהוות ${pct}% מההכנסה שלך – גבוה מהמומלץ (70%). כדאי לבדוק הוצאות שניתן לצמצם.`,
        action: {
          buttonText: 'ניתוח הוצאות קבועות',
          type: 'internal_route',
          url: '/monthly-summary',
        },
      };
    },
  },

  // -----------------------------------------------------------------------
  // 16. High Idle Cash (> 6 months expenses)
  // -----------------------------------------------------------------------
  {
    id: 'high_cash_idle',
    category: 'investments',
    priority: 4,
    condition: (d) => {
      if (d.totalExpenses <= 0) return false;
      return d.cashBalance > d.totalExpenses * 6;
    },
    generateInsight: (d) => {
      const months = Math.round(safeDiv(d.cashBalance, d.totalExpenses));
      return {
        message: `יש לך מזומן השווה ל-${months} חודשי הוצאות. מעבר ל-6 חודשים כדאי לשקול להשקיע את העודף.`,
        action: {
          buttonText: 'למד על השקעות',
          type: 'course_module',
          url: '/course/intro-to-investing',
        },
      };
    },
  },

  // =======================================================================
  // POSITIVE RULES – things the user is doing well
  // =======================================================================

  // -----------------------------------------------------------------------
  // 17. Healthy Emergency Fund (>= 3 months expenses)
  // -----------------------------------------------------------------------
  {
    id: 'emergency_fund_healthy',
    category: 'emergency_fund',
    priority: 3,
    condition: (d) =>
      d.totalExpenses > 0 && d.cashBalance >= d.totalExpenses * 3,
    generateInsight: (d) => {
      const months = Math.round(safeDiv(d.cashBalance, d.totalExpenses));
      return {
        tone: 'positive',
        message: `קרן החירום שלך מכסה ${months} חודשי הוצאות. מצוין! אתה מוגן היטב מפני הפתעות.`,
      };
    },
  },

  // -----------------------------------------------------------------------
  // 18. Positive Cash Flow Streak (current + previous month positive)
  // -----------------------------------------------------------------------
  {
    id: 'positive_cashflow_streak',
    category: 'cash_flow',
    priority: 3,
    condition: (d) => {
      if (d.netCashflow <= 0) return false;
      const prev = d.historicalData;
      if (!prev || prev.length === 0) return false;
      return prev[0].netCashflow > 0;
    },
    generateInsight: (d) => {
      const streak = 1 + d.historicalData.filter((m) => m.netCashflow > 0).length;
      return {
        tone: 'positive',
        message: `כל הכבוד! ${streak} חודשים ברציפות עם תזרים חיובי. המשך כך!`,
      };
    },
  },

  // -----------------------------------------------------------------------
  // 19. Ma'aser On Track (>= 10%)
  // -----------------------------------------------------------------------
  {
    id: 'maaser_on_track',
    category: 'haredi_lifestyle',
    priority: 3,
    condition: (d) => {
      if (d.netIncome <= 0) return false;
      return d.maaserExpenses >= d.netIncome * 0.1;
    },
    generateInsight: (d) => {
      const pct = Math.round(safeDiv(d.maaserExpenses, d.netIncome) * 100);
      return {
        tone: 'positive',
        message: `המעשרות שלך על ${pct}% מההכנסה הנקייה. אתה עומד ביעד ההלכתי. יישר כוח!`,
      };
    },
  },
];
