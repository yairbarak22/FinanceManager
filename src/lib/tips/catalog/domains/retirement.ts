// ---------------------------------------------------------------------------
// Retirement & Long-Term Planning Tips (~15 tips)
// ---------------------------------------------------------------------------

import type { TipDefinition } from '../types';
export const retirementTips: TipDefinition[] = [
  // ── URGENT ──────────────────────────────────────────────────────────────

  {
    id: 'ret.no_pension_no_hishtalmut',
    domain: 'retirement',
    priority: 9,
    tone: 'urgent',
    condition: (d) =>
      !d.assets.hasActiveHishtalmut &&
      d.totalIncome > 0 &&
      d.investmentPortfolio === 0 &&
      d.cashBalance > d.totalExpenses * 2,
    generateTip: () => ({
      text: 'אין קרן השתלמות ואין השקעות – חשוב לדאוג לעתיד הפיננסי ולנצל הטבות מס.',
      scoreImpact: 12,
    }),
  },
  {
    id: 'ret.no_long_term_savings',
    domain: 'retirement',
    priority: 8,
    tone: 'urgent',
    condition: (d) =>
      d.totalIncome > 0 &&
      d.investmentPortfolio === 0 &&
      d.cashBalance <= d.totalExpenses * 3,
    generateTip: () => ({
      text: 'אין חיסכון ארוך טווח ואין כרית מזומנים חזקה. כדאי להתחיל עם כרית חירום ואז לעבור לחיסכון פנסיוני.',
      scoreImpact: 10,
    }),
  },

  // ── RECOMMENDATION ─────────────────────────────────────────────────────

  {
    id: 'ret.check_pension_fees',
    domain: 'retirement',
    priority: 5,
    tone: 'recommendation',
    condition: (d) => d.totalAssets > 100000 && d.totalIncome > 0,
    generateTip: () => ({
      text: 'שווה לבדוק את דמי הניהול בקרן הפנסיה. הפרש קטן בדמי ניהול מצטבר למאות אלפי שקלים לאורך שנים.',
    }),
  },
  {
    id: 'ret.hishtalmut_max',
    domain: 'retirement',
    priority: 4,
    tone: 'recommendation',
    condition: (d) =>
      d.assets.hasActiveHishtalmut && d.freeCashFlow > 2000,
    generateTip: () => ({
      text: 'בדקו שמפרישים את המקסימום לקרן ההשתלמות – ניצול מלא של הטבת המס.',
    }),
  },
  {
    id: 'ret.diversify_long_term',
    domain: 'retirement',
    priority: 3,
    tone: 'recommendation',
    condition: (d) =>
      d.totalAssets > 0 &&
      d.investmentPortfolio > 0 &&
      d.cashBalance / d.totalAssets > 0.6,
    generateTip: () => ({
      text: 'רוב הנכסים נזילים. לטווח ארוך, פיזור בין חיסכון פנסיוני, השקעות ונדל"ן יניב תשואה טובה יותר.',
    }),
  },
  {
    id: 'ret.annual_review',
    domain: 'retirement',
    priority: 2,
    tone: 'recommendation',
    condition: (d) => d.totalAssets > 200000,
    generateTip: () => ({
      text: 'עם היקף נכסים משמעותי, כדאי לערוך סקירה שנתית של כל ההשקעות והחיסכונות מול יועץ מקצועי.',
    }),
  },
  {
    id: 'ret.education_fund',
    domain: 'retirement',
    priority: 4,
    tone: 'recommendation',
    condition: (d) =>
      d.profile.childrenCount > 0 &&
      d.freeCashFlow > 1000 &&
      d.totalIncome > 0,
    generateTip: () => ({
      text: 'יש ילדים ותזרים חיובי. קרן חינוך לילדים היא כלי חיסכון מצוין עם הטבות מס.',
    }),
  },

  // ── POSITIVE ───────────────────────────────────────────────────────────

  {
    id: 'ret.has_hishtalmut',
    domain: 'retirement',
    priority: 4,
    tone: 'positive',
    condition: (d) => d.assets.hasActiveHishtalmut,
    generateTip: () => ({
      text: 'קרן השתלמות פעילה – חיסכון חכם עם הטבת מס משמעותית.',
    }),
  },
  {
    id: 'ret.diversified_portfolio',
    domain: 'retirement',
    priority: 4,
    tone: 'positive',
    condition: (d) =>
      d.investmentPortfolio > 0 &&
      d.cashBalance > 0 &&
      d.totalAssets > 0 &&
      d.investmentPortfolio / d.totalAssets >= 0.15 &&
      d.investmentPortfolio / d.totalAssets <= 0.6 &&
      d.cashBalance / d.totalAssets >= 0.1,
    generateTip: () => ({
      text: 'פיזור מאוזן בין מזומן, השקעות וחיסכון – יסודות חזקים לעתיד פיננסי.',
    }),
  },
  {
    id: 'ret.growing_assets',
    domain: 'retirement',
    priority: 3,
    tone: 'positive',
    condition: (d) => {
      const hist = d.historicalData;
      if (hist.length < 2) return false;
      return (
        d.totalAssets > hist[0].totalAssets &&
        hist[0].totalAssets > hist[1].totalAssets
      );
    },
    generateTip: () => ({
      text: 'הנכסים צומחים כבר שלושה חודשים – בניית עושר עקבית.',
    }),
  },
  {
    id: 'ret.strong_foundation',
    domain: 'retirement',
    priority: 3,
    tone: 'positive',
    condition: (d) =>
      d.cashBalance > d.totalExpenses * 3 &&
      d.investmentPortfolio > 0 &&
      d.assets.hasActiveHishtalmut &&
      d.savingsRate >= 0.1,
    generateTip: () => ({
      text: 'כרית מזומנים, השקעות, קרן השתלמות וחיסכון קבוע – תשתית פיננסית מעולה!',
    }),
  },
];
