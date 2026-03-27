// ---------------------------------------------------------------------------
// Cash Flow Tips (~20 tips)
// ---------------------------------------------------------------------------

import type { TipDefinition } from '../types';
import { formatILS, formatPercent, formatNumber, wrapLtr } from '@/lib/periodicReport/rtlUtils';

export const cashFlowTips: TipDefinition[] = [
  // ── URGENT ──────────────────────────────────────────────────────────────

  {
    id: 'cf.negative_cashflow_severe',
    domain: 'cash_flow',
    priority: 10,
    tone: 'urgent',
    exclusionGroup: 'cf.cashflow_direction',
    condition: (d) => d.totalIncome > 0 && d.netCashflow / d.totalIncome < -0.2,
    generateTip: (d) => ({
      text: `ההוצאות עלו על ההכנסות ב-${formatILS(Math.abs(d.netCashflow))} – גירעון של ${formatPercent((d.netCashflow / d.totalIncome) * 100)}. יש לבצע חיתוך הוצאות בהקדם.`,
      scoreImpact: 20,
    }),
  },
  {
    id: 'cf.negative_cashflow',
    domain: 'cash_flow',
    priority: 9,
    tone: 'urgent',
    exclusionGroup: 'cf.cashflow_direction',
    condition: (d) => d.netCashflow < 0,
    generateTip: (d) => ({
      text: `ההוצאות עלו על ההכנסות ב-${formatILS(Math.abs(d.netCashflow))} החודש. כדאי לבדוק הוצאות חריגות ולתכנן מחדש.`,
      scoreImpact: 15,
    }),
  },
  {
    id: 'cf.negative_trend_3m',
    domain: 'cash_flow',
    priority: 9,
    tone: 'urgent',
    condition: (d) => {
      const hist = d.historicalData;
      return hist.length >= 2 && hist.every((m) => m.netCashflow < 0) && d.netCashflow < 0;
    },
    generateTip: () => ({
      text: 'זהו החודש השלישי ברציפות עם גירעון בתזרים. מגמה זו דורשת התייחסות מיידית ובניית תקציב מחודש.',
      scoreImpact: 15,
    }),
  },
  {
    id: 'cf.expenses_spike',
    domain: 'cash_flow',
    priority: 8,
    tone: 'urgent',
    condition: (d) => {
      const prev = d.historicalData[0];
      if (!prev || prev.totalExpenses === 0) return false;
      return (d.totalExpenses - prev.totalExpenses) / prev.totalExpenses > 0.3;
    },
    generateTip: (d) => {
      const prev = d.historicalData[0];
      const increase = d.totalExpenses - prev.totalExpenses;
      return {
        text: `ההוצאות עלו ב-${formatILS(increase)} ביחס לחודש הקודם – עלייה של מעל 30%. כדאי לבדוק מה השתנה.`,
        scoreImpact: 10,
      };
    },
  },
  {
    id: 'cf.income_drop',
    domain: 'cash_flow',
    priority: 8,
    tone: 'urgent',
    condition: (d) => {
      const prev = d.historicalData[0];
      if (!prev || prev.totalIncome === 0) return false;
      return (prev.totalIncome - d.totalIncome) / prev.totalIncome > 0.2;
    },
    generateTip: (d) => {
      const prev = d.historicalData[0];
      const drop = prev.totalIncome - d.totalIncome;
      return {
        text: `ההכנסות ירדו ב-${formatILS(drop)} ביחס לחודש הקודם. אם זה זמני, ודאו שיש כרית מזומנים מספקת.`,
        scoreImpact: 10,
      };
    },
  },

  // ── RECOMMENDATION ─────────────────────────────────────────────────────

  {
    id: 'cf.high_variable_ratio',
    domain: 'cash_flow',
    priority: 6,
    tone: 'recommendation',
    condition: (d) =>
      d.totalExpenses > 0 && d.variableExpenses / d.totalExpenses > 0.6,
    generateTip: (d) => ({
      text: `${wrapLtr(`${Math.round((d.variableExpenses / d.totalExpenses) * 100)}%`)} מההוצאות שלך הן משתנות. ניתן לשפר שליטה תקציבית ע"י קיבוע חלק מההוצאות.`,
    }),
  },
  {
    id: 'cf.fixed_too_high',
    domain: 'cash_flow',
    priority: 6,
    tone: 'recommendation',
    exclusionGroup: 'cf.fixed_variable_ratio',
    condition: (d) =>
      d.totalIncome > 0 && d.fixedExpenses / d.totalIncome > 0.7,
    generateTip: (d) => ({
      text: `ההוצאות הקבועות מהוות ${wrapLtr(`${Math.round((d.fixedExpenses / d.totalIncome) * 100)}%`)} מההכנסה. זה גבוה – כדאי לבדוק אפשרויות לצמצום.`,
    }),
  },
  {
    id: 'cf.marginal_positive',
    domain: 'cash_flow',
    priority: 5,
    tone: 'recommendation',
    exclusionGroup: 'cf.cashflow_direction',
    condition: (d) =>
      d.totalIncome > 0 &&
      d.netCashflow > 0 &&
      d.netCashflow / d.totalIncome < 0.05,
    generateTip: () => ({
      text: 'התזרים חיובי אבל ברווח מינימלי. כדאי ליצור מרווח ביטחון גדול יותר כדי להתמודד עם הוצאות בלתי צפויות.',
    }),
  },
  {
    id: 'cf.no_income',
    domain: 'cash_flow',
    priority: 7,
    tone: 'urgent',
    condition: (d) => d.totalIncome === 0 && d.totalExpenses > 0,
    generateTip: () => ({
      text: 'לא נרשמו הכנסות החודש, אך ישנן הוצאות. ודאו שכל ההכנסות מוזנות במערכת.',
      scoreImpact: 10,
    }),
  },

  // ── POSITIVE ───────────────────────────────────────────────────────────

  {
    id: 'cf.positive_streak_3m',
    domain: 'cash_flow',
    priority: 6,
    tone: 'positive',
    exclusionGroup: 'cf.cashflow_streak',
    condition: (d) => {
      const hist = d.historicalData;
      return d.netCashflow > 0 && hist.length >= 2 && hist.every((m) => m.netCashflow > 0);
    },
    generateTip: () => ({
      text: 'כל הכבוד! זהו החודש השלישי ברציפות עם תזרים חיובי. המשיכו כך!',
    }),
  },
  {
    id: 'cf.positive_streak_2m',
    domain: 'cash_flow',
    priority: 5,
    tone: 'positive',
    exclusionGroup: 'cf.cashflow_streak',
    condition: (d) => {
      const hist = d.historicalData;
      return d.netCashflow > 0 && hist.length >= 1 && hist[0].netCashflow > 0;
    },
    generateTip: () => ({
      text: 'יפה! חודש שני ברציפות עם תזרים חיובי – מגמה מבורכת.',
    }),
  },
  {
    id: 'cf.healthy_surplus',
    domain: 'cash_flow',
    priority: 5,
    tone: 'positive',
    exclusionGroup: 'cf.cashflow_direction',
    condition: (d) =>
      d.totalIncome > 0 && d.netCashflow / d.totalIncome >= 0.2,
    generateTip: (d) => ({
      text: `חסכתם ${wrapLtr(`${Math.round((d.netCashflow / d.totalIncome) * 100)}%`)} מההכנסה החודשית – ביצוע מעולה!`,
    }),
  },
  {
    id: 'cf.expenses_decreased',
    domain: 'cash_flow',
    priority: 4,
    tone: 'positive',
    condition: (d) => {
      const prev = d.historicalData[0];
      if (!prev || prev.totalExpenses === 0) return false;
      return (prev.totalExpenses - d.totalExpenses) / prev.totalExpenses > 0.1;
    },
    generateTip: (d) => {
      const prev = d.historicalData[0];
      const decrease = prev.totalExpenses - d.totalExpenses;
      return {
        text: `ההוצאות ירדו ב-${formatILS(decrease)} ביחס לחודש הקודם – צמצום מוצלח!`,
      };
    },
  },
  {
    id: 'cf.income_increased',
    domain: 'cash_flow',
    priority: 4,
    tone: 'positive',
    condition: (d) => {
      const prev = d.historicalData[0];
      if (!prev || prev.totalIncome === 0) return false;
      return (d.totalIncome - prev.totalIncome) / prev.totalIncome > 0.1;
    },
    generateTip: (d) => {
      const prev = d.historicalData[0];
      const increase = d.totalIncome - prev.totalIncome;
      return {
        text: `ההכנסות עלו ב-${formatILS(increase)} ביחס לחודש הקודם – נהדר!`,
      };
    },
  },
  {
    id: 'cf.balanced_cashflow',
    domain: 'cash_flow',
    priority: 3,
    tone: 'positive',
    exclusionGroup: 'cf.cashflow_direction',
    condition: (d) =>
      d.totalIncome > 0 &&
      d.netCashflow >= 0 &&
      d.netCashflow / d.totalIncome >= 0.05 &&
      d.netCashflow / d.totalIncome < 0.2,
    generateTip: () => ({
      text: 'התזרים החודשי מאוזן וחיובי – המשיכו לשמור על הקו.',
    }),
  },
];
