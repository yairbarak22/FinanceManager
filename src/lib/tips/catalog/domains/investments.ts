// ---------------------------------------------------------------------------
// Investments Tips (~20 tips)
// ---------------------------------------------------------------------------

import type { TipDefinition } from '../types';
import { formatILS, wrapLtr } from '@/lib/periodicReport/rtlUtils';

export const investmentsTips: TipDefinition[] = [
  // ── URGENT ──────────────────────────────────────────────────────────────

  {
    id: 'inv.no_investments',
    domain: 'investments',
    priority: 7,
    tone: 'urgent',
    exclusionGroup: 'inv.portfolio_level',
    condition: (d) =>
      d.investmentPortfolio === 0 &&
      d.totalIncome > 0 &&
      d.cashBalance > d.totalExpenses * 3,
    generateTip: () => ({
      text: 'יש כרית מזומנים מספקת אבל אין השקעות כלל. כסף שלא מושקע מאבד ערך עם הזמן בגלל אינפלציה.',
      scoreImpact: 8,
    }),
  },
  {
    id: 'inv.no_hishtalmut',
    domain: 'investments',
    priority: 9,
    tone: 'urgent',
    condition: (d) => !d.assets.hasActiveHishtalmut && d.totalIncome > 0,
    generateTip: () => ({
      text: 'אין קרן השתלמות פעילה. זוהי הטבת מס משמעותית שמומלץ מאוד לנצל.',
      scoreImpact: 12,
    }),
  },
  {
    id: 'inv.high_fees',
    domain: 'investments',
    priority: 8,
    tone: 'urgent',
    condition: (d) =>
      d.fees.tradingManagementFee !== undefined &&
      d.fees.tradingManagementFee > 0.01,
    generateTip: (d) => ({
      text: `דמי הניהול בתיק ההשקעות גבוהים (${wrapLtr(`${((d.fees.tradingManagementFee ?? 0) * 100).toFixed(1)}%`)}). משא ומתן או מעבר לפלטפורמה זולה יותר יכולים לחסוך אלפי שקלים בשנה.`,
      scoreImpact: 8,
    }),
  },

  // ── RECOMMENDATION ─────────────────────────────────────────────────────

  {
    id: 'inv.open_trading',
    domain: 'investments',
    priority: 6,
    tone: 'recommendation',
    condition: (d) =>
      !d.assets.hasTradingAccount &&
      d.freeCashFlow > 0 &&
      d.cashBalance > d.totalExpenses * 6,
    generateTip: () => ({
      text: 'יש לכם כרית מזומנים חזקה ותזרים חיובי. שווה לשקול פתיחת חשבון מסחר עצמאי.',
    }),
  },
  {
    id: 'inv.diversify',
    domain: 'investments',
    priority: 5,
    tone: 'recommendation',
    condition: (d) =>
      d.investmentPortfolio > 0 &&
      d.totalAssets > 0 &&
      d.investmentPortfolio / d.totalAssets > 0.7,
    generateTip: () => ({
      text: 'רוב הנכסים מרוכזים בהשקעות. פיזור לנכסים אחרים (נדל"ן, חיסכון) יפחית סיכון.',
    }),
  },
  {
    id: 'inv.cash_heavy',
    domain: 'investments',
    priority: 4,
    tone: 'recommendation',
    condition: (d) =>
      d.totalAssets > 0 &&
      d.cashBalance / d.totalAssets > 0.5 &&
      d.cashBalance > d.totalExpenses * 6,
    generateTip: (d) => {
      const investable = d.cashBalance - d.totalExpenses * 6;
      return {
        text: `יותר מ-50% מהנכסים הם במזומן. ניתן להשקיע כ-${formatILS(investable)} מעבר לכרית הביטחון.`,
      };
    },
  },
  {
    id: 'inv.capital_gains_maaser',
    domain: 'investments',
    priority: 6,
    tone: 'recommendation',
    condition: (d) => d.assets.realizedCapitalGainsYTD > 0,
    generateTip: (d) => ({
      text: `יש רווחי הון ממומשים של ${formatILS(d.assets.realizedCapitalGainsYTD)} השנה. יש לחשב מעשר גם על רווחים אלו.`,
    }),
  },
  {
    id: 'inv.commission_review',
    domain: 'investments',
    priority: 4,
    tone: 'recommendation',
    condition: (d) =>
      d.fees.tradingPurchaseCommission !== undefined &&
      d.fees.tradingPurchaseCommission > 0.005,
    generateTip: () => ({
      text: 'עמלות הקנייה בתיק ההשקעות גבוהות יחסית. כדאי להשוות מול ברוקרים אחרים.',
    }),
  },
  {
    id: 'inv.regular_investing',
    domain: 'investments',
    priority: 3,
    tone: 'recommendation',
    condition: (d) =>
      d.assets.hasTradingAccount &&
      d.freeCashFlow > 1000 &&
      d.investmentPortfolio > 0,
    generateTip: () => ({
      text: 'שקלו השקעה קבועה חודשית (DCA) בתיק ההשקעות. שיטה זו מפחיתה סיכון תזמון.',
    }),
  },

  // ── POSITIVE ───────────────────────────────────────────────────────────

  {
    id: 'inv.has_hishtalmut',
    domain: 'investments',
    priority: 4,
    tone: 'positive',
    condition: (d) => d.assets.hasActiveHishtalmut,
    generateTip: () => ({
      text: 'קרן השתלמות פעילה – ניצול חכם של הטבת מס!',
    }),
  },
  {
    id: 'inv.portfolio_growing',
    domain: 'investments',
    priority: 4,
    tone: 'positive',
    condition: (d) => {
      const prev = d.historicalData[0];
      if (!prev) return false;
      return d.investmentPortfolio > 0 && d.totalAssets > prev.totalAssets;
    },
    generateTip: () => ({
      text: 'תיק ההשקעות ממשיך לצמוח – עקביות בהשקעות משתלמת לאורך זמן.',
    }),
  },
  {
    id: 'inv.diversified',
    domain: 'investments',
    priority: 3,
    tone: 'positive',
    condition: (d) =>
      d.investmentPortfolio > 0 &&
      d.cashBalance > 0 &&
      d.totalAssets > 0 &&
      d.investmentPortfolio / d.totalAssets >= 0.2 &&
      d.investmentPortfolio / d.totalAssets <= 0.7,
    generateTip: () => ({
      text: 'התיק מפוזר היטב בין מזומן, השקעות ונכסים אחרים – ניהול סיכונים מאוזן.',
    }),
  },
  {
    id: 'inv.low_fees',
    domain: 'investments',
    priority: 3,
    tone: 'positive',
    condition: (d) =>
      d.fees.tradingManagementFee !== undefined &&
      d.fees.tradingManagementFee <= 0.005 &&
      d.fees.tradingManagementFee > 0,
    generateTip: () => ({
      text: 'דמי ניהול נמוכים בתיק – חיסכון שמצטבר לסכומים משמעותיים לאורך שנים.',
    }),
  },
];
