// ---------------------------------------------------------------------------
// Net Worth Tips (~15 tips)
// ---------------------------------------------------------------------------

import type { TipDefinition } from '../types';
import { formatILS, wrapLtr } from '@/lib/periodicReport/rtlUtils';

export const netWorthTips: TipDefinition[] = [
  // ── URGENT ──────────────────────────────────────────────────────────────

  {
    id: 'nw.negative',
    domain: 'net_worth',
    priority: 9,
    tone: 'urgent',
    exclusionGroup: 'nw.level',
    condition: (d) => d.currentNetWorth < 0,
    generateTip: (d) => ({
      text: `השווי הנקי שלילי (${formatILS(d.currentNetWorth)}). החובות עולים על הנכסים – בניית נכסים וצמצום חובות הם בראש סדר העדיפויות.`,
      scoreImpact: 15,
    }),
  },
  {
    id: 'nw.declining_trend',
    domain: 'net_worth',
    priority: 8,
    tone: 'urgent',
    condition: (d) => {
      const hist = d.historicalData;
      if (hist.length < 2) return false;
      // Both previous months had declining total assets
      return (
        hist[0].totalAssets - hist[0].totalLiabilities <
          (hist[1]?.totalAssets ?? 0) - (hist[1]?.totalLiabilities ?? 0) &&
        d.currentNetWorth <
          hist[0].totalAssets - hist[0].totalLiabilities
      );
    },
    generateTip: () => ({
      text: 'השווי הנקי יורד כבר שלושה חודשים ברציפות. יש לבחון מה גורם לשחיקה – ירידת נכסים או עלייה בחובות.',
      scoreImpact: 12,
    }),
  },
  {
    id: 'nw.sharp_drop',
    domain: 'net_worth',
    priority: 8,
    tone: 'urgent',
    condition: (d) => {
      if (d.previousNetWorth === null || d.previousNetWorth === 0) return false;
      const change = (d.currentNetWorth - d.previousNetWorth) / Math.abs(d.previousNetWorth);
      return change < -0.15;
    },
    generateTip: (d) => {
      const drop = (d.previousNetWorth ?? 0) - d.currentNetWorth;
      return {
        text: `ירידה חדה של ${formatILS(drop)} בשווי הנקי ביחס לחודש שעבר. כדאי לבדוק מה השתנה.`,
        scoreImpact: 10,
      };
    },
  },

  // ── RECOMMENDATION ─────────────────────────────────────────────────────

  {
    id: 'nw.stagnant',
    domain: 'net_worth',
    priority: 5,
    tone: 'recommendation',
    condition: (d) => {
      if (d.previousNetWorth === null || d.previousNetWorth === 0) return false;
      const change = Math.abs(d.currentNetWorth - d.previousNetWorth) / Math.abs(d.previousNetWorth);
      return change < 0.01 && d.totalIncome > 0;
    },
    generateTip: () => ({
      text: 'השווי הנקי כמעט לא השתנה. בדקו אם ניתן להגדיל חיסכון או להפחית חוב כדי ליצור צמיחה.',
    }),
  },
  {
    id: 'nw.liabilities_dominant',
    domain: 'net_worth',
    priority: 6,
    tone: 'recommendation',
    condition: (d) =>
      d.totalAssets > 0 &&
      d.totalLiabilities > 0 &&
      d.totalLiabilities / d.totalAssets > 0.7,
    generateTip: (d) => {
      const ratio = Math.round((d.totalLiabilities / d.totalAssets) * 100);
      return {
        text: `החובות מהווים ${wrapLtr(`${ratio}%`)} מסך הנכסים. יש לשאוף להורדת יחס זה מתחת ל-50%.`,
      };
    },
  },
  {
    id: 'nw.milestone_approaching',
    domain: 'net_worth',
    priority: 3,
    tone: 'recommendation',
    condition: (d) => {
      if (d.currentNetWorth <= 0) return false;
      // Check if within 10% of a milestone (100K, 250K, 500K, 1M)
      const milestones = [100000, 250000, 500000, 1000000];
      return milestones.some(
        (m) => d.currentNetWorth >= m * 0.9 && d.currentNetWorth < m
      );
    },
    generateTip: (d) => {
      const milestones = [100000, 250000, 500000, 1000000];
      const next = milestones.find(
        (m) => d.currentNetWorth >= m * 0.9 && d.currentNetWorth < m
      )!;
      const remaining = next - d.currentNetWorth;
      return {
        text: `קרובים לאבן דרך של ${formatILS(next)} שווי נקי – חסרים רק ${formatILS(remaining)}!`,
      };
    },
  },

  // ── POSITIVE ───────────────────────────────────────────────────────────

  {
    id: 'nw.growing',
    domain: 'net_worth',
    priority: 5,
    tone: 'positive',
    condition: (d) => {
      if (d.previousNetWorth === null || d.previousNetWorth === 0) return false;
      const change = (d.currentNetWorth - d.previousNetWorth) / Math.abs(d.previousNetWorth);
      return change > 0.03;
    },
    generateTip: (d) => {
      const growth = d.currentNetWorth - (d.previousNetWorth ?? 0);
      return {
        text: `השווי הנקי עלה ב-${formatILS(growth)} – צמיחה חודשית מבורכת!`,
      };
    },
  },
  {
    id: 'nw.growing_steady',
    domain: 'net_worth',
    priority: 6,
    tone: 'positive',
    condition: (d) => {
      const hist = d.historicalData;
      if (hist.length < 2) return false;
      const prevNw = hist[0].totalAssets - hist[0].totalLiabilities;
      const prevPrevNw = hist[1].totalAssets - hist[1].totalLiabilities;
      return d.currentNetWorth > prevNw && prevNw > prevPrevNw;
    },
    generateTip: () => ({
      text: 'שלושה חודשים רצופים של צמיחה בשווי הנקי – מגמה מצוינת!',
    }),
  },
  {
    id: 'nw.milestone_reached',
    domain: 'net_worth',
    priority: 7,
    tone: 'positive',
    condition: (d) => {
      if (d.previousNetWorth === null) return false;
      const milestones = [100000, 250000, 500000, 1000000];
      return milestones.some(
        (m) => (d.previousNetWorth ?? 0) < m && d.currentNetWorth >= m
      );
    },
    generateTip: (d) => {
      const milestones = [100000, 250000, 500000, 1000000];
      const reached = milestones.find(
        (m) => (d.previousNetWorth ?? 0) < m && d.currentNetWorth >= m
      )!;
      return {
        text: `הגעתם לאבן דרך של ${formatILS(reached)} שווי נקי! הישג מרשים.`,
      };
    },
  },
  {
    id: 'nw.positive_territory',
    domain: 'net_worth',
    priority: 6,
    tone: 'positive',
    exclusionGroup: 'nw.level',
    condition: (d) =>
      d.currentNetWorth > 0 &&
      d.previousNetWorth !== null &&
      d.previousNetWorth <= 0,
    generateTip: () => ({
      text: 'השווי הנקי חזר לחיובי! אבן דרך חשובה בדרך ליציבות פיננסית.',
    }),
  },
  {
    id: 'nw.healthy',
    domain: 'net_worth',
    priority: 3,
    tone: 'positive',
    exclusionGroup: 'nw.level',
    condition: (d) =>
      d.currentNetWorth > 0 &&
      d.totalAssets > 0 &&
      d.totalLiabilities / d.totalAssets <= 0.3,
    generateTip: () => ({
      text: 'יחס נכסים-חובות בריא – היציבות הפיננסית שלכם חזקה.',
    }),
  },
];
