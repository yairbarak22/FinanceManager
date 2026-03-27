// ---------------------------------------------------------------------------
// Lifestyle & Spending Pattern Tips (~20 tips)
// ---------------------------------------------------------------------------

import type { TipDefinition } from '../types';
import { wrapLtr } from '@/lib/periodicReport/rtlUtils';

export const lifestyleTips: TipDefinition[] = [
  // ── URGENT ──────────────────────────────────────────────────────────────

  {
    id: 'ls.lifestyle_inflation',
    domain: 'lifestyle',
    priority: 8,
    tone: 'urgent',
    condition: (d) => {
      const hist = d.historicalData;
      if (hist.length < 2) return false;
      // Expenses grew faster than income over last 2 months
      const prevExpGrowth = hist.length >= 2
        ? (hist[0].totalExpenses - hist[1].totalExpenses) / (hist[1].totalExpenses || 1)
        : 0;
      const currExpGrowth = d.totalExpenses > 0 && hist[0].totalExpenses > 0
        ? (d.totalExpenses - hist[0].totalExpenses) / hist[0].totalExpenses
        : 0;
      const incGrowth = d.totalIncome > 0 && hist[0].totalIncome > 0
        ? (d.totalIncome - hist[0].totalIncome) / hist[0].totalIncome
        : 0;
      return currExpGrowth > 0.1 && prevExpGrowth > 0.1 && currExpGrowth > incGrowth;
    },
    generateTip: () => ({
      text: 'ההוצאות גדלות מהר יותר מההכנסות – סימן לאינפלציית סגנון חיים. כדאי לעצור ולבחון.',
      scoreImpact: 10,
    }),
  },
  {
    id: 'ls.entertainment_high',
    domain: 'lifestyle',
    priority: 6,
    tone: 'urgent',
    condition: (d) =>
      d.totalExpenses > 0 && d.variableExpenses / d.totalExpenses > 0.7,
    generateTip: () => ({
      text: 'מעל 70% מההוצאות הן משתנות. עודף הוצאות שאינן קבועות מקשה על תכנון ארוך טווח.',
      scoreImpact: 5,
    }),
  },

  // ── RECOMMENDATION ─────────────────────────────────────────────────────

  {
    id: 'ls.subscription_review',
    domain: 'lifestyle',
    priority: 5,
    tone: 'recommendation',
    condition: (d) => d.fixedExpenses > 0 && d.totalIncome > 0 && d.fixedExpenses / d.totalIncome > 0.5,
    generateTip: () => ({
      text: 'ההוצאות הקבועות תופסות מעל 50% מההכנסה. כדאי לסקור מנויים והוראות קבע ולבטל מיותרים.',
    }),
  },
  {
    id: 'ls.50_30_20_rule',
    domain: 'lifestyle',
    priority: 4,
    tone: 'recommendation',
    condition: (d) => {
      if (d.totalIncome === 0) return false;
      const needs = d.fixedExpenses / d.totalIncome;
      const wants = d.variableExpenses / d.totalIncome;
      // Check if far from 50/30/20 rule
      return needs > 0.6 || wants > 0.4;
    },
    generateTip: (d) => {
      const needs = Math.round((d.fixedExpenses / d.totalIncome) * 100);
      const wants = Math.round((d.variableExpenses / d.totalIncome) * 100);
      return {
        text: `הוצאות קבועות ${wrapLtr(`${needs}%`)}, משתנות ${wrapLtr(`${wants}%`)}. כלל 50/30/20 מציע: 50% צרכים, 30% רצונות, 20% חיסכון.`,
      };
    },
  },
  {
    id: 'ls.reduce_variable',
    domain: 'lifestyle',
    priority: 3,
    tone: 'recommendation',
    condition: (d) => {
      const prev = d.historicalData[0];
      if (!prev) return false;
      return d.variableExpenses > prev.totalExpenses * 0.4;
    },
    generateTip: () => ({
      text: 'ההוצאות המשתנות גבוהות. ניסו להגדיר תקרה חודשית לקטגוריות כמו בילויים וקניות.',
    }),
  },
  {
    id: 'ls.track_small',
    domain: 'lifestyle',
    priority: 2,
    tone: 'recommendation',
    condition: (d) => d.totalExpenses > 0 && d.totalIncome > 0 && d.savingsRate < 0.05,
    generateTip: () => ({
      text: 'שיעור החיסכון נמוך. לעתים הוצאות קטנות רבות מצטברות – נסו לעקוב אחרי כל הוצאה לשבוע.',
    }),
  },
  {
    id: 'ls.spending_pattern',
    domain: 'lifestyle',
    priority: 3,
    tone: 'recommendation',
    condition: (d) => {
      // High total expenses relative to income but not negative cashflow
      return d.totalIncome > 0 && d.netCashflow >= 0 && d.totalExpenses / d.totalIncome > 0.85;
    },
    generateTip: () => ({
      text: 'ההוצאות קרובות מאוד להכנסות. אין הרבה מרווח לביטחון – כדאי ליצור כרית.',
    }),
  },

  // ── POSITIVE ───────────────────────────────────────────────────────────

  {
    id: 'ls.balanced_spending',
    domain: 'lifestyle',
    priority: 5,
    tone: 'positive',
    condition: (d) => {
      if (d.totalIncome === 0) return false;
      const needs = d.fixedExpenses / d.totalIncome;
      const wants = d.variableExpenses / d.totalIncome;
      return needs <= 0.55 && wants <= 0.35 && d.savingsRate >= 0.15;
    },
    generateTip: () => ({
      text: 'חלוקת ההוצאות מאוזנת – צרכים, רצונות וחיסכון ביחס בריא. כל הכבוד!',
    }),
  },
  {
    id: 'ls.expenses_stable',
    domain: 'lifestyle',
    priority: 3,
    tone: 'positive',
    condition: (d) => {
      const hist = d.historicalData;
      if (hist.length < 2) return false;
      const changes = hist.map((m) =>
        Math.abs(d.totalExpenses - m.totalExpenses) / (m.totalExpenses || 1)
      );
      return changes.every((c) => c < 0.1);
    },
    generateTip: () => ({
      text: 'ההוצאות יציבות לאורך החודשים האחרונים – סימן לתכנון פיננסי טוב.',
    }),
  },
  {
    id: 'ls.reduced_variable',
    domain: 'lifestyle',
    priority: 4,
    tone: 'positive',
    condition: (d) => {
      const prev = d.historicalData[0];
      if (!prev) return false;
      return d.variableExpenses < d.totalExpenses * 0.3 && d.totalExpenses > 0;
    },
    generateTip: () => ({
      text: 'ההוצאות המשתנות מהוות פחות מ-30% מסך ההוצאות – שליטה מצוינת!',
    }),
  },
  {
    id: 'ls.spending_decreased',
    domain: 'lifestyle',
    priority: 3,
    tone: 'positive',
    condition: (d) => {
      const hist = d.historicalData;
      if (hist.length < 2) return false;
      return d.totalExpenses < hist[0].totalExpenses && hist[0].totalExpenses < hist[1].totalExpenses;
    },
    generateTip: () => ({
      text: 'ההוצאות יורדות כבר שלושה חודשים ברציפות – מגמה חיובית מאוד!',
    }),
  },
];
