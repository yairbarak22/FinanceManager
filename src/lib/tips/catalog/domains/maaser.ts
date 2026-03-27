// ---------------------------------------------------------------------------
// Maaser (Charity) Tips (~15 tips)
// ---------------------------------------------------------------------------

import type { TipDefinition } from '../types';
import { formatILS, wrapLtr } from '@/lib/periodicReport/rtlUtils';

export const maaserTips: TipDefinition[] = [
  // ── URGENT ──────────────────────────────────────────────────────────────

  {
    id: 'msr.no_maaser',
    domain: 'maaser',
    priority: 8,
    tone: 'urgent',
    exclusionGroup: 'msr.compliance_level',
    condition: (d) => d.netIncome > 0 && d.maaserExpenses === 0,
    generateTip: () => ({
      text: 'לא נרשמו הוצאות מעשר/צדקה החודש. אם יש הוצאות כאלו, כדאי לסווג אותן נכון במערכת.',
      scoreImpact: 8,
    }),
  },
  {
    id: 'msr.below_5pct',
    domain: 'maaser',
    priority: 7,
    tone: 'urgent',
    exclusionGroup: 'msr.compliance_level',
    condition: (d) => {
      if (d.netIncome <= 0) return false;
      const rate = d.maaserExpenses / d.netIncome;
      return rate > 0 && rate < 0.05;
    },
    generateTip: (d) => {
      const pct = Math.round((d.maaserExpenses / d.netIncome) * 100);
      return {
        text: `המעשר הנוכחי הוא ${wrapLtr(`${pct}%`)} מההכנסה נטו – פחות מהמינימום ההלכתי. יש להשלים לפחות ל-10%.`,
        scoreImpact: 8,
      };
    },
  },

  // ── RECOMMENDATION ─────────────────────────────────────────────────────

  {
    id: 'msr.below_10pct',
    domain: 'maaser',
    priority: 6,
    tone: 'recommendation',
    exclusionGroup: 'msr.compliance_level',
    condition: (d) => {
      if (d.netIncome <= 0) return false;
      const rate = d.maaserExpenses / d.netIncome;
      return rate >= 0.05 && rate < 0.1;
    },
    generateTip: (d) => {
      const missing = d.netIncome * 0.1 - d.maaserExpenses;
      return {
        text: `חסרים ${formatILS(missing)} להשלמת 10% מעשר. אפשר לפצל את ההשלמה על פני מספר חודשים.`,
      };
    },
  },
  {
    id: 'msr.consider_chomesh',
    domain: 'maaser',
    priority: 3,
    tone: 'recommendation',
    condition: (d) => {
      if (d.netIncome <= 0) return false;
      const rate = d.maaserExpenses / d.netIncome;
      return rate >= 0.1 && rate < 0.2 && d.savingsRate >= 0.15;
    },
    generateTip: () => ({
      text: 'המעשר ברמת 10% ויש מרווח חיסכון – אפשר לשקול חומש (20%) כהידור.',
    }),
  },
  {
    id: 'msr.track_all_sources',
    domain: 'maaser',
    priority: 4,
    tone: 'recommendation',
    condition: (d) =>
      d.netIncome > 0 && d.maaserExpenses > 0 && d.assets.realizedCapitalGainsYTD > 0,
    generateTip: () => ({
      text: 'יש רווחי הון – חשוב לוודא שגם עליהם מחושב מעשר בהתאם להלכה.',
    }),
  },

  // ── POSITIVE ───────────────────────────────────────────────────────────

  {
    id: 'msr.on_track',
    domain: 'maaser',
    priority: 5,
    tone: 'positive',
    exclusionGroup: 'msr.compliance_level',
    condition: (d) => {
      if (d.netIncome <= 0) return false;
      const rate = d.maaserExpenses / d.netIncome;
      return rate >= 0.1 && rate < 0.2;
    },
    generateTip: (d) => {
      const pct = Math.round((d.maaserExpenses / d.netIncome) * 100);
      return {
        text: `נתתם ${wrapLtr(`${pct}%`)} מעשר מההכנסה – עומדים בחובת המעשר. יישר כוח!`,
      };
    },
  },
  {
    id: 'msr.chomesh',
    domain: 'maaser',
    priority: 6,
    tone: 'positive',
    exclusionGroup: 'msr.compliance_level',
    condition: (d) => {
      if (d.netIncome <= 0) return false;
      return d.maaserExpenses / d.netIncome >= 0.2;
    },
    generateTip: () => ({
      text: 'נתינת חומש (20%+) – מידת חסידות! מעשה מופלא של צדקה וחסד.',
    }),
  },
  {
    id: 'msr.maaser_increased',
    domain: 'maaser',
    priority: 3,
    tone: 'positive',
    condition: (d) => {
      const prev = d.historicalData[0];
      if (!prev || prev.totalIncome === 0) return false;
      // Rough proxy: if maaser expenses grew relative to income
      return d.maaserExpenses > 0 && d.netIncome > 0;
    },
    generateTip: () => ({
      text: 'הנתינה לצדקה ממשיכה – כל שקל עושה הבדל.',
    }),
  },
];
