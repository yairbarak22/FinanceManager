import type { InvestCategoryId } from './categories';
import type { LucideIcon } from 'lucide-react';
import {
  TrendingUp,
  BarChart3,
  Play,
  Gift,
  ArrowRightLeft,
  HelpCircle,
} from 'lucide-react';

export interface InvestArticle {
  slug: string;
  title: string;
  subtitle: string;
  category: Exclude<InvestCategoryId, 'all'>;
  icon: LucideIcon;
  readingTime: number;
  keywords: string[];
}

export const investArticles: InvestArticle[] = [
  // ── יסודות ההשקעה ─────────────────────────────────
  {
    slug: 'why-invest',
    title: 'למה כדאי להשקיע?',
    subtitle:
      'אינפלציה, ריבית דריבית, השוואה בין אפיקי חיסכון — ולמה לשים כסף בצד זה כבר לא מספיק.',
    category: 'invest-basics',
    icon: TrendingUp,
    readingTime: 7,
    keywords: [
      'השקעה',
      'ריבית דריבית',
      'חיסכון',
      'תשואה',
      'בנק',
      'גמל',
      'מסחר עצמאי',
      'אינפלציה',
    ],
  },
  {
    slug: 'what-is-investing',
    title: 'מה זה השקעה? — מדריך מקיף',
    subtitle:
      'S&P 500, השקעה פסיבית, כשרות הלכתית, DCA ו-3 צעדים מעשיים להתחלה.',
    category: 'invest-basics',
    icon: BarChart3,
    readingTime: 15,
    keywords: [
      'השקעה',
      'אינפלציה',
      'ריבית דריבית',
      'S&P 500',
      'כשרות',
      'הלכה',
      'פסיבי',
      'מדד',
      'מתחילים',
      'DCA',
    ],
  },

  // ── קורס מעשי ─────────────────────────────────────
  {
    slug: 'video-course',
    title: 'קורס השקעות בוידאו',
    subtitle:
      '4 סרטונים קצרים שילמדו אותך מאפס: למה להשקיע, S&P 500, פתיחת חשבון והוראת קבע.',
    category: 'invest-course',
    icon: Play,
    readingTime: 14,
    keywords: [
      'קורס',
      'וידאו',
      'סרטון',
      'לימוד',
      'השקעה',
      'S&P',
      'חשבון מסחר',
      'הוראת קבע',
    ],
  },

  // ── התחל להשקיע ───────────────────────────────────
  {
    slug: 'open-account',
    title: 'פתיחת חשבון מסחר',
    subtitle:
      '0₪ דמי ניהול לכל החיים, 200₪ מתנת הצטרפות, מסלולים הלכתיים ופתיחה ב-3 דקות.',
    category: 'invest-action',
    icon: Gift,
    readingTime: 6,
    keywords: [
      'חשבון',
      'מסחר',
      'פתיחה',
      'דמי ניהול',
      'מתנה',
      'אלטשולר',
      'הטבות',
      'כשר',
    ],
  },
  {
    slug: 'transfer-portfolio',
    title: 'העברת תיק השקעות קיים',
    subtitle:
      'מדריך צעד אחר צעד להעברת תיק — חיסכון של אלפי שקלים בדמי ניהול.',
    category: 'invest-action',
    icon: ArrowRightLeft,
    readingTime: 10,
    keywords: [
      'העברה',
      'תיק',
      'קיים',
      'דמי ניהול',
      'חיסכון',
      'מעבר',
      'ברוקר',
    ],
  },

  // ── שאלות נפוצות ──────────────────────────────────
  {
    slug: 'invest-faq',
    title: 'שאלות נפוצות על השקעות',
    subtitle:
      'תשובות לשאלות הכי נפוצות: איך מתחילים, כשרות הלכתית, מיסוי, העברת תיק ועוד.',
    category: 'invest-faq',
    icon: HelpCircle,
    readingTime: 8,
    keywords: [
      'שאלות',
      'נפוצות',
      'FAQ',
      'השקעה',
      'כשרות',
      'מיסוי',
      'חשבון',
      'העברה',
      'מתחילים',
    ],
  },
];

export function getInvestArticleBySlug(
  slug: string
): InvestArticle | undefined {
  return investArticles.find((a) => a.slug === slug);
}

export function getRelatedInvestArticles(
  slug: string,
  limit = 3
): InvestArticle[] {
  const article = getInvestArticleBySlug(slug);
  if (!article) return [];
  const sameCategory = investArticles.filter(
    (a) => a.category === article.category && a.slug !== slug
  );
  const others = investArticles.filter(
    (a) => a.category !== article.category && a.slug !== slug
  );
  return [...sameCategory, ...others].slice(0, limit);
}
