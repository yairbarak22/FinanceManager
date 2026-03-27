// ---------------------------------------------------------------------------
// Emergency Fund Tips (~15 tips)
// ---------------------------------------------------------------------------

import type { TipDefinition } from '../types';
import { formatILS, formatNumber } from '@/lib/periodicReport/rtlUtils';

export const emergencyFundTips: TipDefinition[] = [
  // ── URGENT ──────────────────────────────────────────────────────────────

  {
    id: 'ef.no_fund',
    domain: 'emergency_fund',
    priority: 10,
    tone: 'urgent',
    exclusionGroup: 'ef.level',
    condition: (d) => d.cashBalance <= 0 && d.totalExpenses > 0,
    generateTip: () => ({
      text: 'אין לכם כרית מזומנים כלל. חיסכון של אפילו סכום קטן בחודש יכול לעשות הבדל משמעותי במצב חירום.',
      scoreImpact: 20,
    }),
  },
  {
    id: 'ef.under_1_month',
    domain: 'emergency_fund',
    priority: 9,
    tone: 'urgent',
    exclusionGroup: 'ef.level',
    condition: (d) =>
      d.totalExpenses > 0 &&
      d.cashBalance > 0 &&
      d.cashBalance < d.totalExpenses,
    generateTip: (d) => {
      const months = d.cashBalance / d.totalExpenses;
      return {
        text: `כרית המזומנים מכסה ${formatNumber(months, 1)} חודשים בלבד. המטרה המינימלית היא 3 חודשי הוצאות.`,
        scoreImpact: 15,
      };
    },
  },
  {
    id: 'ef.under_2_months',
    domain: 'emergency_fund',
    priority: 7,
    tone: 'urgent',
    exclusionGroup: 'ef.level',
    condition: (d) =>
      d.totalExpenses > 0 &&
      d.cashBalance >= d.totalExpenses &&
      d.cashBalance < d.totalExpenses * 2,
    generateTip: () => ({
      text: 'כרית המזומנים מכסה 1-2 חודשים. עדיין מתחת ליעד המומלץ של 3 חודשים – כדאי להמשיך לחסוך.',
      scoreImpact: 8,
    }),
  },

  // ── RECOMMENDATION ─────────────────────────────────────────────────────

  {
    id: 'ef.under_3_months',
    domain: 'emergency_fund',
    priority: 6,
    tone: 'recommendation',
    exclusionGroup: 'ef.level',
    condition: (d) =>
      d.totalExpenses > 0 &&
      d.cashBalance >= d.totalExpenses * 2 &&
      d.cashBalance < d.totalExpenses * 3,
    generateTip: (d) => {
      const needed = d.totalExpenses * 3 - d.cashBalance;
      return {
        text: `כרית המזומנים כמעט ביעד – חסרים ${formatILS(needed)} ל-3 חודשי הוצאות.`,
      };
    },
  },
  {
    id: 'ef.over_12_months',
    domain: 'emergency_fund',
    priority: 4,
    tone: 'recommendation',
    exclusionGroup: 'ef.excess',
    condition: (d) =>
      d.totalExpenses > 0 && d.cashBalance > d.totalExpenses * 12,
    generateTip: (d) => {
      const excess = d.cashBalance - d.totalExpenses * 6;
      return {
        text: `כרית המזומנים מכסה מעל 12 חודשים. כדאי לשקול להשקיע ${formatILS(excess)} כדי שהכסף לא ייאכל ע"י אינפלציה.`,
      };
    },
  },
  {
    id: 'ef.over_9_months',
    domain: 'emergency_fund',
    priority: 3,
    tone: 'recommendation',
    exclusionGroup: 'ef.excess',
    condition: (d) =>
      d.totalExpenses > 0 &&
      d.cashBalance > d.totalExpenses * 9 &&
      d.cashBalance <= d.totalExpenses * 12,
    generateTip: () => ({
      text: 'כרית המזומנים גבוהה יחסית (9-12 חודשים). שווה לבדוק אם חלק מהכסף יכול לעבוד בצורה טובה יותר בהשקעות.',
    }),
  },
  {
    id: 'ef.cash_decreased',
    domain: 'emergency_fund',
    priority: 5,
    tone: 'recommendation',
    condition: (d) => {
      const prev = d.historicalData[0];
      if (!prev) return false;
      return (
        d.totalExpenses > 0 &&
        d.cashBalance < d.totalExpenses * 3 &&
        prev.totalAssets > d.totalAssets
      );
    },
    generateTip: () => ({
      text: 'רמת הנזילות ירדה והיא מתחת ל-3 חודשי הוצאות. כדאי לעצור הוצאות לא הכרחיות ולחזק את הכרית.',
    }),
  },

  // ── POSITIVE ───────────────────────────────────────────────────────────

  {
    id: 'ef.healthy_3m',
    domain: 'emergency_fund',
    priority: 4,
    tone: 'positive',
    exclusionGroup: 'ef.level',
    condition: (d) =>
      d.totalExpenses > 0 &&
      d.cashBalance >= d.totalExpenses * 3 &&
      d.cashBalance < d.totalExpenses * 6,
    generateTip: (d) => {
      const months = Math.round(d.cashBalance / d.totalExpenses);
      return {
        text: `כרית המזומנים מכסה ${formatNumber(months)} חודשי הוצאות – רמה בריאה!`,
      };
    },
  },
  {
    id: 'ef.excellent_6m',
    domain: 'emergency_fund',
    priority: 5,
    tone: 'positive',
    exclusionGroup: 'ef.level',
    condition: (d) =>
      d.totalExpenses > 0 &&
      d.cashBalance >= d.totalExpenses * 6 &&
      d.cashBalance <= d.totalExpenses * 9,
    generateTip: (d) => {
      const months = Math.round(d.cashBalance / d.totalExpenses);
      return {
        text: `מעולה! כרית מזומנים של ${formatNumber(months)} חודשים – ביטחון פיננסי ברמה גבוהה.`,
      };
    },
  },
  {
    id: 'ef.cash_grew',
    domain: 'emergency_fund',
    priority: 3,
    tone: 'positive',
    condition: (d) => {
      const prev = d.historicalData[0];
      if (!prev) return false;
      return d.cashBalance > 0 && d.totalAssets > prev.totalAssets;
    },
    generateTip: () => ({
      text: 'הנזילות עלתה ביחס לחודש שעבר – המשיכו לבנות את הכרית.',
    }),
  },
];
