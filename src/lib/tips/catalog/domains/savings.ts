// ---------------------------------------------------------------------------
// Savings & Goals Tips (~20 tips)
// ---------------------------------------------------------------------------

import type { TipDefinition } from '../types';
import { formatILS, formatNumber, wrapLtr } from '@/lib/periodicReport/rtlUtils';

export const savingsTips: TipDefinition[] = [
  // ── URGENT ──────────────────────────────────────────────────────────────

  {
    id: 'sav.zero_savings',
    domain: 'savings',
    priority: 9,
    tone: 'urgent',
    exclusionGroup: 'sav.rate_level',
    condition: (d) => d.totalIncome > 0 && d.savingsRate <= 0,
    generateTip: () => ({
      text: 'לא נחסך כלום החודש. גם סכום קטן של חיסכון חודשי עושה הבדל לאורך זמן.',
      scoreImpact: 15,
    }),
  },
  {
    id: 'sav.goal_behind_urgent',
    domain: 'savings',
    priority: 8,
    tone: 'urgent',
    condition: (d) =>
      d.goals.some(
        (g) => g.status === 'behind' && g.percentage < 50
      ),
    generateTip: (d) => {
      const behind = d.goals.filter((g) => g.status === 'behind' && g.percentage < 50);
      return {
        text: `${formatNumber(behind.length)} יעדים פיננסיים מתחת ל-50% מהיעד ומאחורים בלוח הזמנים. כדאי לבחון מחדש את ההפרשה החודשית.`,
        scoreImpact: 10,
      };
    },
  },
  {
    id: 'sav.no_goals',
    domain: 'savings',
    priority: 7,
    tone: 'urgent',
    condition: (d) => d.goals.length === 0 && d.totalIncome > 0,
    generateTip: () => ({
      text: 'לא הוגדרו יעדי חיסכון. הגדרת יעדים היא הצעד הראשון לבניית עתיד פיננסי.',
      scoreImpact: 8,
    }),
  },

  // ── RECOMMENDATION ─────────────────────────────────────────────────────

  {
    id: 'sav.low_rate',
    domain: 'savings',
    priority: 6,
    tone: 'recommendation',
    exclusionGroup: 'sav.rate_level',
    condition: (d) => d.savingsRate > 0 && d.savingsRate < 0.1,
    generateTip: (d) => ({
      text: `שיעור החיסכון הוא ${wrapLtr(`${Math.round(d.savingsRate * 100)}%`)} – כדאי לשאוף ל-10% לפחות.`,
    }),
  },
  {
    id: 'sav.moderate_rate',
    domain: 'savings',
    priority: 4,
    tone: 'recommendation',
    exclusionGroup: 'sav.rate_level',
    condition: (d) => d.savingsRate >= 0.1 && d.savingsRate < 0.2,
    generateTip: (d) => ({
      text: `חוסכים ${wrapLtr(`${Math.round(d.savingsRate * 100)}%`)} מההכנסה – טוב! השאיפה ארוכת הטווח היא 20%.`,
    }),
  },
  {
    id: 'sav.goal_behind_mild',
    domain: 'savings',
    priority: 5,
    tone: 'recommendation',
    condition: (d) =>
      d.goals.some(
        (g) => g.status === 'behind' && g.percentage >= 50
      ),
    generateTip: (d) => {
      const behind = d.goals.filter((g) => g.status === 'behind' && g.percentage >= 50);
      return {
        text: `${formatNumber(behind.length)} יעדים מאחורים קלות בלוח הזמנים. הגדלה קטנה בהפרשה תעזור לחזור למסלול.`,
      };
    },
  },
  {
    id: 'sav.goal_no_contribution',
    domain: 'savings',
    priority: 5,
    tone: 'recommendation',
    condition: (d) =>
      d.goals.length > 0 &&
      d.goals.some((g) => g.monthlyContribution === 0 && g.percentage < 100),
    generateTip: () => ({
      text: 'יש יעדים פעילים ללא הפרשה חודשית. הגדרת הוראת קבע תעזור להתקדם באופן אוטומטי.',
    }),
  },
  {
    id: 'sav.increase_by_1pct',
    domain: 'savings',
    priority: 3,
    tone: 'recommendation',
    condition: (d) => d.savingsRate >= 0.05 && d.savingsRate < 0.15 && d.totalIncome > 0,
    generateTip: (d) => {
      const extra = Math.round(d.totalIncome * 0.01);
      return {
        text: `הגדלת החיסכון ב-1% בלבד (${formatILS(extra)} לחודש) תוסיף אלפי שקלים לאורך שנה.`,
      };
    },
  },

  // ── POSITIVE ───────────────────────────────────────────────────────────

  {
    id: 'sav.excellent_rate',
    domain: 'savings',
    priority: 6,
    tone: 'positive',
    exclusionGroup: 'sav.rate_level',
    condition: (d) => d.savingsRate >= 0.25,
    generateTip: (d) => ({
      text: `שיעור חיסכון של ${wrapLtr(`${Math.round(d.savingsRate * 100)}%`)} – ביצוע יוצא דופן!`,
    }),
  },
  {
    id: 'sav.good_rate',
    domain: 'savings',
    priority: 5,
    tone: 'positive',
    exclusionGroup: 'sav.rate_level',
    condition: (d) => d.savingsRate >= 0.2 && d.savingsRate < 0.25,
    generateTip: (d) => ({
      text: `חוסכים ${wrapLtr(`${Math.round(d.savingsRate * 100)}%`)} מההכנסה – מעל ממוצע השוק. כל הכבוד!`,
    }),
  },
  {
    id: 'sav.all_goals_on_track',
    domain: 'savings',
    priority: 5,
    tone: 'positive',
    condition: (d) =>
      d.goals.length > 0 &&
      d.goals.every((g) => g.status === 'on_track' || g.percentage >= 100),
    generateTip: () => ({
      text: 'כל היעדים הפיננסיים במסלול – עקביות שמשתלמת!',
    }),
  },
  {
    id: 'sav.goal_completed',
    domain: 'savings',
    priority: 6,
    tone: 'positive',
    condition: (d) => d.goals.some((g) => g.percentage >= 100),
    generateTip: (d) => {
      const completed = d.goals.filter((g) => g.percentage >= 100);
      return {
        text: `${formatNumber(completed.length)} יעדים הושגו במלואם – הצלחה!`,
      };
    },
  },
  {
    id: 'sav.savings_improved',
    domain: 'savings',
    priority: 3,
    tone: 'positive',
    condition: (d) => {
      const prev = d.historicalData[0];
      if (!prev || prev.totalIncome === 0) return false;
      const prevRate = (prev.totalIncome - prev.totalExpenses) / prev.totalIncome;
      return d.savingsRate > prevRate && d.savingsRate > 0;
    },
    generateTip: () => ({
      text: 'שיעור החיסכון השתפר ביחס לחודש שעבר – מגמה חיובית!',
    }),
  },
];
