// ---------------------------------------------------------------------------
// Budget Compliance Tips (~20 tips)
// ---------------------------------------------------------------------------

import type { TipDefinition } from '../types';
import { formatILS, formatNumber, wrapLtr } from '@/lib/periodicReport/rtlUtils';

export const budgetComplianceTips: TipDefinition[] = [
  // ── URGENT ──────────────────────────────────────────────────────────────

  {
    id: 'bgt.no_budget',
    domain: 'budget_compliance',
    priority: 7,
    tone: 'urgent',
    condition: (d) => d.budgetStatuses.length === 0 && d.totalExpenses > 0,
    generateTip: () => ({
      text: 'לא הוגדר תקציב לאף קטגוריה. הגדרת תקציב היא הכלי היעיל ביותר לשליטה בהוצאות.',
      scoreImpact: 8,
    }),
  },
  {
    id: 'bgt.many_over',
    domain: 'budget_compliance',
    priority: 9,
    tone: 'urgent',
    exclusionGroup: 'bgt.compliance_level',
    condition: (d) => {
      if (d.budgetStatuses.length === 0) return false;
      return d.categoriesOverBudget / d.budgetStatuses.length > 0.5;
    },
    generateTip: (d) => ({
      text: `${formatNumber(d.categoriesOverBudget)} מתוך ${formatNumber(d.budgetStatuses.length)} קטגוריות חרגו מהתקציב. יש צורך בכיול מחדש של התקציב או צמצום הוצאות.`,
      scoreImpact: 12,
    }),
  },
  {
    id: 'bgt.extreme_overrun',
    domain: 'budget_compliance',
    priority: 8,
    tone: 'urgent',
    condition: (d) =>
      d.budgetStatuses.some((b) => b.utilizationRatio > 2.0),
    generateTip: (d) => {
      const worst = d.budgetStatuses
        .filter((b) => b.utilizationRatio > 2.0)
        .sort((a, b) => b.utilizationRatio - a.utilizationRatio)[0];
      return {
        text: `הקטגוריה "${worst.categoryName}" חרגה ב-${wrapLtr(`${Math.round(worst.utilizationRatio * 100)}%`)} מהתקציב (${formatILS(worst.overBudgetAmount)} מעל). דורש בדיקה מיידית.`,
        scoreImpact: 10,
      };
    },
  },
  {
    id: 'bgt.total_over_120',
    domain: 'budget_compliance',
    priority: 7,
    tone: 'urgent',
    condition: (d) =>
      d.budgetStatuses.length > 0 && d.totalBudgetUtilization > 1.2,
    generateTip: (d) => ({
      text: `סך ההוצאות גבוה ב-${wrapLtr(`${Math.round((d.totalBudgetUtilization - 1) * 100)}%`)} מסך התקציבות. חריגה כוללת מצריכה עדכון תקציב או צמצום.`,
      scoreImpact: 8,
    }),
  },

  // ── RECOMMENDATION ─────────────────────────────────────────────────────

  {
    id: 'bgt.few_over',
    domain: 'budget_compliance',
    priority: 5,
    tone: 'recommendation',
    exclusionGroup: 'bgt.compliance_level',
    condition: (d) => {
      if (d.budgetStatuses.length === 0) return false;
      return (
        d.categoriesOverBudget > 0 &&
        d.categoriesOverBudget / d.budgetStatuses.length <= 0.5
      );
    },
    generateTip: (d) => ({
      text: `${formatNumber(d.categoriesOverBudget)} קטגוריות חרגו מהתקציב. בדקו אם מדובר בהוצאות חד-פעמיות או בתבנית חוזרת.`,
    }),
  },
  {
    id: 'bgt.partial_coverage',
    domain: 'budget_compliance',
    priority: 4,
    tone: 'recommendation',
    condition: (d) =>
      d.budgetStatuses.length > 0 && d.budgetStatuses.length < 5 && d.totalExpenses > 0,
    generateTip: () => ({
      text: 'התקציב מוגדר למספר קטן של קטגוריות. הרחבת התקציב לקטגוריות נוספות תשפר את השליטה.',
    }),
  },
  {
    id: 'bgt.nearly_over',
    domain: 'budget_compliance',
    priority: 4,
    tone: 'recommendation',
    condition: (d) =>
      d.budgetStatuses.some(
        (b) => b.utilizationRatio > 0.9 && b.utilizationRatio <= 1.0
      ),
    generateTip: (d) => {
      const nearly = d.budgetStatuses.filter(
        (b) => b.utilizationRatio > 0.9 && b.utilizationRatio <= 1.0
      );
      return {
        text: `${formatNumber(nearly.length)} קטגוריות קרובות לתקרת התקציב (90%+). שימו לב בימים הנותרים בחודש.`,
      };
    },
  },
  {
    id: 'bgt.adjust_unrealistic',
    domain: 'budget_compliance',
    priority: 3,
    tone: 'recommendation',
    condition: (d) =>
      d.budgetStatuses.filter((b) => b.utilizationRatio > 1.5).length >= 3,
    generateTip: () => ({
      text: 'מספר קטגוריות חורגות בעקביות. ייתכן שהתקציבים לא ריאליסטיים – כדאי לעדכן אותם.',
    }),
  },

  // ── POSITIVE ───────────────────────────────────────────────────────────

  {
    id: 'bgt.all_within',
    domain: 'budget_compliance',
    priority: 6,
    tone: 'positive',
    exclusionGroup: 'bgt.compliance_level',
    condition: (d) =>
      d.budgetStatuses.length > 0 && d.categoriesOverBudget === 0,
    generateTip: () => ({
      text: 'כל הקטגוריות בתוך התקציב – משמעת תקציבית מעולה!',
    }),
  },
  {
    id: 'bgt.total_under_80',
    domain: 'budget_compliance',
    priority: 5,
    tone: 'positive',
    condition: (d) =>
      d.budgetStatuses.length > 0 && d.totalBudgetUtilization <= 0.8,
    generateTip: (d) => ({
      text: `ניצולת תקציב כוללת של ${wrapLtr(`${Math.round(d.totalBudgetUtilization * 100)}%`)} – חסכתם מתוך התקציב!`,
    }),
  },
  {
    id: 'bgt.improved',
    domain: 'budget_compliance',
    priority: 3,
    tone: 'positive',
    condition: (d) => {
      // Can't compare to previous budget directly, but check if over-budget count is low
      return (
        d.budgetStatuses.length >= 5 &&
        d.categoriesOverBudget <= 1 &&
        d.totalBudgetUtilization <= 1.0
      );
    },
    generateTip: () => ({
      text: 'עמידה מצוינת בתקציב ברוב הקטגוריות – ניהול פיננסי אחראי.',
    }),
  },
  {
    id: 'bgt.category_saved',
    domain: 'budget_compliance',
    priority: 3,
    tone: 'positive',
    condition: (d) =>
      d.budgetStatuses.some((b) => b.utilizationRatio < 0.5 && b.budgeted > 0),
    generateTip: (d) => {
      const saved = d.budgetStatuses.filter(
        (b) => b.utilizationRatio < 0.5 && b.budgeted > 0
      );
      return {
        text: `${formatNumber(saved.length)} קטגוריות עם ניצולת מתחת ל-50% – חיסכון מרשים!`,
      };
    },
  },
];
