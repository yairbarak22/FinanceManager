// ---------------------------------------------------------------------------
// Debt Management Tips (~25 tips)
// ---------------------------------------------------------------------------

import type { TipDefinition } from '../types';
import { formatILS, formatNumber, wrapLtr } from '@/lib/periodicReport/rtlUtils';

export const debtTips: TipDefinition[] = [
  // ── URGENT ──────────────────────────────────────────────────────────────

  {
    id: 'debt.dti_critical',
    domain: 'debt',
    priority: 10,
    tone: 'urgent',
    exclusionGroup: 'debt.dti_level',
    condition: (d) =>
      d.annualIncome > 0 && d.totalLiabilities / d.annualIncome > 1.0,
    generateTip: () => ({
      text: 'סך החובות עולה על ההכנסה השנתית. מצב זה מסוכן ודורש תכנית פירעון מיידית.',
      scoreImpact: 20,
    }),
  },
  {
    id: 'debt.dti_very_high',
    domain: 'debt',
    priority: 9,
    tone: 'urgent',
    exclusionGroup: 'debt.dti_level',
    condition: (d) =>
      d.annualIncome > 0 &&
      d.totalLiabilities / d.annualIncome > 0.8 &&
      d.totalLiabilities / d.annualIncome <= 1.0,
    generateTip: (d) => {
      const ratio = Math.round((d.totalLiabilities / d.annualIncome) * 100);
      return {
        text: `יחס חוב-הכנסה עומד על ${wrapLtr(`${ratio}%`)} – גבוה מאוד. יש לשקול מיחזור או האצת פירעון.`,
        scoreImpact: 15,
      };
    },
  },
  {
    id: 'debt.dti_high',
    domain: 'debt',
    priority: 8,
    tone: 'urgent',
    exclusionGroup: 'debt.dti_level',
    condition: (d) =>
      d.annualIncome > 0 &&
      d.totalLiabilities / d.annualIncome > 0.5 &&
      d.totalLiabilities / d.annualIncome <= 0.8,
    generateTip: (d) => {
      const ratio = Math.round((d.totalLiabilities / d.annualIncome) * 100);
      return {
        text: `יחס חוב-הכנסה עומד על ${wrapLtr(`${ratio}%`)}. כדאי לבנות תכנית לצמצום החוב בהדרגה.`,
        scoreImpact: 10,
      };
    },
  },
  {
    id: 'debt.payments_over_40pct',
    domain: 'debt',
    priority: 9,
    tone: 'urgent',
    condition: (d) =>
      d.totalIncome > 0 &&
      d.totalMonthlyDebtPayments / d.totalIncome > 0.4,
    generateTip: (d) => {
      const pct = Math.round((d.totalMonthlyDebtPayments / d.totalIncome) * 100);
      return {
        text: `תשלומי החוב החודשיים תופסים ${wrapLtr(`${pct}%`)} מההכנסה – מעל הסף המומלץ של 40%. שווה לבדוק אפשרויות מיחזור.`,
        scoreImpact: 12,
      };
    },
  },
  {
    id: 'debt.gemach_no_plan',
    domain: 'debt',
    priority: 7,
    tone: 'urgent',
    condition: (d) =>
      d.gemachLoans.length > 0 &&
      d.gemachLoans.some((g) => g.monthlyPayment === 0),
    generateTip: () => ({
      text: 'יש הלוואות גמ"ח ללא תכנית החזר חודשית. כדאי לקבוע לוח סילוקין כדי לא לפגוע ביחסים.',
      scoreImpact: 5,
    }),
  },
  {
    id: 'debt.multiple_loans',
    domain: 'debt',
    priority: 6,
    tone: 'urgent',
    condition: (d) => d.bankLoans.length + d.gemachLoans.length >= 5,
    generateTip: (d) => ({
      text: `יש ${formatNumber(d.bankLoans.length + d.gemachLoans.length)} הלוואות פעילות. ריכוז ההלוואות עשוי לפשט את הניהול ולחסוך ריבית.`,
    }),
  },

  // ── RECOMMENDATION ─────────────────────────────────────────────────────

  {
    id: 'debt.dti_moderate',
    domain: 'debt',
    priority: 5,
    tone: 'recommendation',
    exclusionGroup: 'debt.dti_level',
    condition: (d) =>
      d.annualIncome > 0 &&
      d.totalLiabilities / d.annualIncome > 0.3 &&
      d.totalLiabilities / d.annualIncome <= 0.5,
    generateTip: () => ({
      text: 'יחס חוב-הכנסה סביר אך ניתן לשיפור. שימו לב לא לקחת התחייבויות נוספות.',
    }),
  },
  {
    id: 'debt.payments_30_40pct',
    domain: 'debt',
    priority: 5,
    tone: 'recommendation',
    condition: (d) =>
      d.totalIncome > 0 &&
      d.totalMonthlyDebtPayments / d.totalIncome > 0.3 &&
      d.totalMonthlyDebtPayments / d.totalIncome <= 0.4,
    generateTip: () => ({
      text: 'תשלומי ההלוואות תופסים 30-40% מההכנסה. כדאי לשאוף לרדת מתחת ל-30%.',
    }),
  },
  {
    id: 'debt.consider_refinance',
    domain: 'debt',
    priority: 4,
    tone: 'recommendation',
    condition: (d) =>
      d.mortgageBalance > 0 &&
      d.bankLoans.some((l) => l.balance > 50000),
    generateTip: () => ({
      text: 'יש הלוואות בנקאיות משמעותיות לצד משכנתא. שווה לבדוק עם יועץ משכנתאות אם ניתן למחזר בתנאים טובים יותר.',
    }),
  },
  {
    id: 'debt.gemach_review',
    domain: 'debt',
    priority: 3,
    tone: 'recommendation',
    condition: (d) => d.gemachLoans.length >= 3,
    generateTip: () => ({
      text: 'ישנן מספר הלוואות גמ"ח פעילות. כדאי לבדוק לוחות סילוקין ולוודא שהכל מתועד ומנוהל.',
    }),
  },

  // ── POSITIVE ───────────────────────────────────────────────────────────

  {
    id: 'debt.no_debt',
    domain: 'debt',
    priority: 6,
    tone: 'positive',
    exclusionGroup: 'debt.dti_level',
    condition: (d) => d.totalLiabilities === 0,
    generateTip: () => ({
      text: 'אין חובות כלל – חופש פיננסי מלא! כל ההכנסה פנויה לחיסכון והשקעות.',
    }),
  },
  {
    id: 'debt.low_dti',
    domain: 'debt',
    priority: 5,
    tone: 'positive',
    exclusionGroup: 'debt.dti_level',
    condition: (d) =>
      d.annualIncome > 0 &&
      d.totalLiabilities > 0 &&
      d.totalLiabilities / d.annualIncome <= 0.3,
    generateTip: (d) => {
      const ratio = Math.round((d.totalLiabilities / d.annualIncome) * 100);
      return {
        text: `יחס חוב-הכנסה של ${wrapLtr(`${ratio}%`)} – רמה בריאה ומנוהלת היטב.`,
      };
    },
  },
  {
    id: 'debt.low_payments',
    domain: 'debt',
    priority: 4,
    tone: 'positive',
    condition: (d) =>
      d.totalIncome > 0 &&
      d.totalMonthlyDebtPayments > 0 &&
      d.totalMonthlyDebtPayments / d.totalIncome <= 0.2,
    generateTip: () => ({
      text: 'תשלומי ההלוואות מהווים פחות מ-20% מההכנסה – רמה נוחה שמשאירה מרווח תמרון.',
    }),
  },
  {
    id: 'debt.liability_decreased',
    domain: 'debt',
    priority: 3,
    tone: 'positive',
    condition: (d) => {
      const prev = d.historicalData[0];
      if (!prev) return false;
      return d.totalLiabilities < prev.totalLiabilities && d.totalLiabilities > 0;
    },
    generateTip: (d) => {
      const prev = d.historicalData[0];
      const decrease = prev.totalLiabilities - d.totalLiabilities;
      return {
        text: `החובות קטנו ב-${formatILS(decrease)} ביחס לחודש שעבר – פירעון מוצלח!`,
      };
    },
  },
  {
    id: 'debt.gemach_repaid',
    domain: 'debt',
    priority: 4,
    tone: 'positive',
    condition: (d) => {
      const prev = d.historicalData[0];
      if (!prev) return false;
      // Check if gemach count decreased (a loan was fully repaid)
      // We use a heuristic: total gemach balance decreased significantly
      const prevGemachTotal = d.gemachLoans.reduce((s, g) => s + g.balance, 0);
      return prevGemachTotal === 0 && d.gemachLoans.length === 0 && prev.totalLiabilities > d.totalLiabilities;
    },
    generateTip: () => ({
      text: 'כל הלוואות הגמ"ח נפרעו – כל הכבוד!',
    }),
  },
];
