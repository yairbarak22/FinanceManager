import type { CategoryId } from './categories';
import type { LucideIcon } from 'lucide-react';
import {
  Upload,
  PieChart,
  Target,
  TrendingUp,
  Users,
  FileText,
  Calculator,
  ShieldCheck,
  Wallet,
  Umbrella,
  Percent,
  BarChart3,
  Lightbulb,
  Home,
  Building2,
  RefreshCw,
  Shield,
  Heart,
  Briefcase,
  CreditCard,
  Brain,
  LayoutDashboard,
  Repeat,
  Settings,
  Scale,
  Play,
  Gift,
  ArrowRightLeft,
  HelpCircle,
} from 'lucide-react';

export interface Article {
  slug: string;
  title: string;
  subtitle: string;
  category: Exclude<CategoryId, 'all'>;
  icon: LucideIcon;
  readingTime: number; // minutes
  keywords: string[];
}

export const articles: Article[] = [
  // ── מדריכי המערכת ─────────────────────────────────
  {
    slug: 'dashboard-overview',
    title: 'הדשבורד',
    subtitle: 'הכרת 8 הסקשנים בדשבורד, התאמה אישית של התצוגה ומעבר בין חודשים.',
    category: 'system-guides',
    icon: LayoutDashboard,
    readingTime: 5,
    keywords: ['דשבורד', 'סקירה', 'ווידג\'טים', 'תצוגה', 'התאמה', 'מצב פיננסי', 'תזרים'],
  },
  {
    slug: 'upload-transactions',
    title: 'איך מעלים עסקאות למערכת',
    subtitle: 'מדריך מלא: מהורדת הקובץ מחברת האשראי ועד סיווג אוטומטי ב-AI.',
    category: 'system-guides',
    icon: Upload,
    readingTime: 6,
    keywords: ['העלאה', 'עסקאות', 'CSV', 'אקסל', 'אשראי', 'קובץ', 'סיווג', 'AI', 'ייבוא', 'לאומי', 'פועלים', 'ישראכרט', 'מקס'],
  },
  {
    slug: 'setup-budget',
    title: 'איך בונים תקציב חודשי',
    subtitle: 'הגדרת קטגוריות, תקרות הוצאה, מעקב עם אינדיקטורים ויזואליים והעתקה בין חודשים.',
    category: 'system-guides',
    icon: PieChart,
    readingTime: 5,
    keywords: ['תקציב', 'קטגוריות', 'הוצאות', 'חודשי', 'תקרה', 'מעקב', 'חריגה', 'העתקה'],
  },
  {
    slug: 'recurring-transactions',
    title: 'הוצאות והכנסות קבועות',
    subtitle: 'ניהול תשלומים חודשיים קבועים כמו שכירות, חשמל, מנויים ומשכורת.',
    category: 'system-guides',
    icon: Repeat,
    readingTime: 4,
    keywords: ['קבועות', 'חוזרות', 'שכירות', 'חשמל', 'מנוי', 'משכורת', 'הכנסה', 'הוצאה', 'חודשי'],
  },
  {
    slug: 'financial-goals',
    title: 'איך מגדירים יעדים פיננסיים',
    subtitle: 'סימולטור יעדים, תבניות מהירות, חישוב ריבית דריבית ומעקב התקדמות.',
    category: 'system-guides',
    icon: Target,
    readingTime: 6,
    keywords: ['יעדים', 'חיסכון', 'הפרשה', 'מעקב', 'התקדמות', 'דירה', 'חתונה', 'סימולטור', 'ריבית'],
  },
  {
    slug: 'investment-portfolio',
    title: 'איך מנהלים תיק השקעות',
    subtitle: 'חיפוש ני"ע, הוספת אחזקות, מד סיכון Beta, פיזור סקטוריאלי וביצועים.',
    category: 'system-guides',
    icon: TrendingUp,
    readingTime: 5,
    keywords: ['תיק', 'השקעות', 'אחזקות', 'מניות', 'קרנות', 'פיזור', 'ביצועים', 'Beta', 'סקטור'],
  },
  {
    slug: 'assets-liabilities',
    title: 'נכסים, התחייבויות ושווי נקי',
    subtitle: 'מעקב חסכונות, נדל"ן, הלוואות ומשכנתאות ותמונת שווי נקי מלאה.',
    category: 'system-guides',
    icon: Scale,
    readingTime: 5,
    keywords: ['נכסים', 'התחייבויות', 'שווי נקי', 'חיסכון', 'נדל"ן', 'הלוואה', 'משכנתא', 'גמ"ח'],
  },
  {
    slug: 'shared-account',
    title: 'חשבון משותף עם בן/בת הזוג',
    subtitle: 'הזמנת בני משפחה, הרשאות Owner/Member ומה בדיוק משותף.',
    category: 'system-guides',
    icon: Users,
    readingTime: 4,
    keywords: ['משותף', 'זוג', 'משפחה', 'הזמנה', 'הרשאות', 'שיתוף', 'חשבון'],
  },
  {
    slug: 'monthly-report',
    title: 'איך קוראים את הדוח החודשי',
    subtitle: 'הבנת 7 חלקי הדוח, ציון בריאות פיננסית (8 ממדים), תובנות AI והורדת PDF.',
    category: 'system-guides',
    icon: FileText,
    readingTime: 6,
    keywords: ['דוח', 'חודשי', 'גרפים', 'בריאות', 'פיננסית', 'ציון', 'טיפים', 'PDF', 'AI'],
  },
  {
    slug: 'calculators-guide',
    title: 'המחשבונים הפיננסיים',
    subtitle: '8 מחשבונים: ריבית דריבית, משכנתא, FIRE, נטו/ברוטו, קנייה מול שכירות ועוד.',
    category: 'system-guides',
    icon: Calculator,
    readingTime: 5,
    keywords: ['מחשבון', 'ריבית', 'משכנתא', 'חיסכון', 'פנסיה', 'כלים', 'FIRE', 'נטו', 'ברוטו'],
  },
  {
    slug: 'settings-profile',
    title: 'הגדרות ופרופיל אישי',
    subtitle: 'פרופיל פיננסי, יום תחילת חודש, התאמת דשבורד, פרטיות ונגישות.',
    category: 'system-guides',
    icon: Settings,
    readingTime: 4,
    keywords: ['הגדרות', 'פרופיל', 'התאמה', 'פרטיות', 'מחיקה', 'נגישות', 'חודש'],
  },
  {
    slug: 'data-security',
    title: 'אבטחת המידע שלך',
    subtitle: 'הצפנת AES-256, התחברות Google OAuth, הגנת CSRF ומה המערכת שומרת (ומה לא).',
    category: 'system-guides',
    icon: ShieldCheck,
    readingTime: 4,
    keywords: ['אבטחה', 'הצפנה', 'פרטיות', 'מידע', 'Google', 'סיסמה', 'CSRF', 'מחיקה'],
  },

  // ── ידע פיננסי בסיסי ──────────────────────────────
  {
    slug: 'budgeting-101',
    title: 'ניהול תקציב',
    subtitle: 'שיטת 50/30/20, מעקב הוצאות וחיתוך חכם של הוצאות מיותרות.',
    category: 'finance-basics',
    icon: Wallet,
    readingTime: 5,
    keywords: ['תקציב', '50/30/20', 'הוצאות', 'חיסכון', 'ניהול', 'כסף'],
  },
  {
    slug: 'emergency-fund',
    title: 'קרן חירום',
    subtitle: 'למה כל אחד חייב 3-6 חודשי הוצאות בצד, ואיפה לשמור אותם.',
    category: 'finance-basics',
    icon: Umbrella,
    readingTime: 4,
    keywords: ['קרן', 'חירום', 'חיסכון', 'ביטחון', 'נזילות', 'חודשים'],
  },
  {
    slug: 'compound-interest',
    title: 'ריבית דריבית',
    subtitle: 'איך כסף קטן הופך לגדול עם הזמן, עם דוגמאות מספריות.',
    category: 'finance-basics',
    icon: Percent,
    readingTime: 4,
    keywords: ['ריבית', 'דריבית', 'חיסכון', 'השקעה', 'זמן', 'תשואה', 'אינפלציה'],
  },
  {
    slug: 'inflation',
    title: 'אינפלציה',
    subtitle: 'כוח הקנייה, מדד המחירים ואיך להגן על הכסף שלך.',
    category: 'finance-basics',
    icon: BarChart3,
    readingTime: 4,
    keywords: ['אינפלציה', 'מדד', 'מחירים', 'כוח', 'קנייה', 'ערך', 'כסף'],
  },
  {
    slug: 'smart-saving',
    title: 'חיסכון חכם',
    subtitle: 'חיסכון אוטומטי, הרגלים יומיומיים ושיטות פשוטות שעובדות.',
    category: 'finance-basics',
    icon: Lightbulb,
    readingTime: 4,
    keywords: ['חיסכון', 'טיפים', 'אוטומטי', 'הרגלים', 'חסכון', 'יומיומי'],
  },

  // ── השקעות ושוק ההון ──────────────────────────────
  {
    slug: 'passive-investing',
    title: 'מסלול ההשקעה הפסיבי',
    subtitle: 'למה השקעה במדד S&P 500 היא אחת הדרכים הטובות ביותר לבנות הון.',
    category: 'investments',
    icon: TrendingUp,
    readingTime: 5,
    keywords: ['פסיבי', 'מדד', 'S&P', 'קרנות', 'מחקות', 'DCA', 'טווח ארוך'],
  },
  {
    slug: 'etf-vs-funds',
    title: 'ETF מול קרנות נאמנות',
    subtitle: 'מה ההבדל, מתי כל אחד עדיף ואיך זה משפיע על המיסוי.',
    category: 'investments',
    icon: BarChart3,
    readingTime: 5,
    keywords: ['ETF', 'קרנות', 'נאמנות', 'מחקות', 'עמלות', 'מיסוי'],
  },
  {
    slug: 'diversification',
    title: 'פיזור השקעות',
    subtitle: 'סקטורים, גאוגרפיה וסוגי נכסים: איך בונים תיק מאוזן.',
    category: 'investments',
    icon: PieChart,
    readingTime: 4,
    keywords: ['פיזור', 'סקטורים', 'נכסים', 'סיכון', 'תיק', 'מאוזן'],
  },
  {
    slug: 'investor-behavior',
    title: 'התנהגות משקיע נבון',
    subtitle: 'הטיות קוגניטיביות, פאניקה ו-FOMO ואיך להישאר רגוע.',
    category: 'investments',
    icon: Brain,
    readingTime: 5,
    keywords: ['התנהגות', 'משקיע', 'פאניקה', 'FOMO', 'קוגניטיבי', 'משמעת'],
  },
  {
    slug: 'management-fees',
    title: 'דמי ניהול',
    subtitle: 'איך עמלות של 1% אוכלות מאות אלפי שקלים לאורך השנים.',
    category: 'investments',
    icon: Percent,
    readingTime: 4,
    keywords: ['דמי', 'ניהול', 'עמלות', 'עלויות', 'חיסכון', 'קרנות'],
  },

  // ── דיור ומשכנתאות ────────────────────────────────
  {
    slug: 'first-apartment',
    title: 'הדירה הראשונה',
    subtitle: 'הון עצמי, החזר חודשי וקרן חירום: מה חייבים לדעת לפני רכישה.',
    category: 'housing',
    icon: Home,
    readingTime: 5,
    keywords: ['דירה', 'ראשונה', 'הון', 'עצמי', 'משכנתא', 'רכישה'],
  },
  {
    slug: 'mortgage-types',
    title: 'מסלולי משכנתא',
    subtitle: 'פריים, קבועה, משתנה ו-CPI: מתי כל מסלול מתאים.',
    category: 'housing',
    icon: Building2,
    readingTime: 5,
    keywords: ['משכנתא', 'פריים', 'קבועה', 'משתנה', 'CPI', 'מסלול', 'ריבית'],
  },
  {
    slug: 'mortgage-refinance',
    title: 'מיחזור משכנתא',
    subtitle: 'מתי כדאי למחזר, איך מחשבים ולאן פונים.',
    category: 'housing',
    icon: RefreshCw,
    readingTime: 4,
    keywords: ['מיחזור', 'משכנתא', 'ריבית', 'חיסכון', 'בנק', 'החזר'],
  },

  // ── פנסיה וביטוח ──────────────────────────────────
  {
    slug: 'pension-basics',
    title: 'פנסיה',
    subtitle: 'הפקדות, דמי ניהול, מסלולי השקעה וזיכוי מס.',
    category: 'pension-insurance',
    icon: Shield,
    readingTime: 5,
    keywords: ['פנסיה', 'הפקדות', 'דמי ניהול', 'מס', 'זיכוי', 'מסלול'],
  },
  {
    slug: 'keren-hishtalmut',
    title: 'קרן השתלמות',
    subtitle: '3 שנים או 6 שנים, הטבות מס ושכירים מול עצמאים.',
    category: 'pension-insurance',
    icon: Briefcase,
    readingTime: 4,
    keywords: ['קרן', 'השתלמות', 'מס', 'פטור', 'שכיר', 'עצמאי', '6 שנים'],
  },
  {
    slug: 'insurance-essentials',
    title: 'ביטוחים חיוניים',
    subtitle: 'חיים, בריאות ואובדן כושר עבודה. מה באמת צריך ומה מיותר.',
    category: 'pension-insurance',
    icon: Heart,
    readingTime: 5,
    keywords: ['ביטוח', 'חיים', 'בריאות', 'אובדן', 'כושר', 'עבודה'],
  },

  // ── חובות ואשראי ──────────────────────────────────
  {
    slug: 'debt-management',
    title: 'ניהול חובות חכם',
    subtitle: 'שיטת שלגית, שיטת מפולת וסדר עדיפויות נכון להיפטר מחובות.',
    category: 'debt-credit',
    icon: CreditCard,
    readingTime: 5,
    keywords: ['חובות', 'הלוואות', 'שלגית', 'מפולת', 'ריבית', 'פירעון'],
  },
  {
    slug: 'credit-cards',
    title: 'כרטיסי אשראי',
    subtitle: 'סוגי אשראי, עמלות, דחיית תשלומים וטיפים לשימוש נבון.',
    category: 'debt-credit',
    icon: CreditCard,
    readingTime: 4,
    keywords: ['אשראי', 'כרטיס', 'עמלות', 'תשלומים', 'דחייה', 'ניקוד'],
  },

  // ── יסודות ההשקעה (merged from invest) ────────────
  {
    slug: 'why-invest',
    title: 'למה כדאי להשקיע?',
    subtitle: 'אינפלציה, ריבית דריבית, השוואה בין אפיקי חיסכון ולמה לשים כסף בצד זה כבר לא מספיק.',
    category: 'invest-basics',
    icon: TrendingUp,
    readingTime: 7,
    keywords: ['השקעה', 'ריבית דריבית', 'חיסכון', 'תשואה', 'בנק', 'גמל', 'מסחר עצמאי', 'אינפלציה'],
  },
  {
    slug: 'what-is-investing',
    title: 'מה זה השקעה?',
    subtitle: 'S&P 500, השקעה פסיבית, כשרות הלכתית, DCA ו-3 צעדים מעשיים להתחלה.',
    category: 'invest-basics',
    icon: BarChart3,
    readingTime: 15,
    keywords: ['השקעה', 'אינפלציה', 'ריבית דריבית', 'S&P 500', 'כשרות', 'הלכה', 'פסיבי', 'מדד', 'מתחילים', 'DCA'],
  },

  // ── קורס מעשי ─────────────────────────────────────
  {
    slug: 'video-course',
    title: 'קורס השקעות בוידאו',
    subtitle: '4 סרטונים קצרים שילמדו אותך מאפס: למה להשקיע, S&P 500, פתיחת חשבון והוראת קבע.',
    category: 'invest-course',
    icon: Play,
    readingTime: 14,
    keywords: ['קורס', 'וידאו', 'סרטון', 'לימוד', 'השקעה', 'S&P', 'חשבון מסחר', 'הוראת קבע'],
  },

  // ── התחל להשקיע ───────────────────────────────────
  {
    slug: 'open-account',
    title: 'פתיחת חשבון מסחר',
    subtitle: '0₪ דמי ניהול לכל החיים, 200₪ מתנת הצטרפות, מסלולים הלכתיים ופתיחה ב-3 דקות.',
    category: 'invest-action',
    icon: Gift,
    readingTime: 6,
    keywords: ['חשבון', 'מסחר', 'פתיחה', 'דמי ניהול', 'מתנה', 'אלטשולר', 'הטבות', 'כשר'],
  },
  {
    slug: 'transfer-portfolio',
    title: 'העברת תיק השקעות קיים',
    subtitle: 'מדריך צעד אחר צעד להעברת תיק וחיסכון של אלפי שקלים בדמי ניהול.',
    category: 'invest-action',
    icon: ArrowRightLeft,
    readingTime: 10,
    keywords: ['העברה', 'תיק', 'קיים', 'דמי ניהול', 'חיסכון', 'מעבר', 'ברוקר'],
  },

  // ── שאלות נפוצות ──────────────────────────────────
  {
    slug: 'invest-faq',
    title: 'שאלות נפוצות על השקעות',
    subtitle: 'תשובות לשאלות הכי נפוצות: איך מתחילים, כשרות הלכתית, מיסוי, העברת תיק ועוד.',
    category: 'invest-faq',
    icon: HelpCircle,
    readingTime: 8,
    keywords: ['שאלות', 'נפוצות', 'FAQ', 'השקעה', 'כשרות', 'מיסוי', 'חשבון', 'העברה', 'מתחילים'],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: Exclude<CategoryId, 'all'>): Article[] {
  return articles.filter((a) => a.category === category);
}

export function getRelatedArticles(slug: string, limit = 3): Article[] {
  const article = getArticleBySlug(slug);
  if (!article) return [];
  // Same category first, then others
  const sameCategory = articles.filter(
    (a) => a.category === article.category && a.slug !== slug
  );
  const others = articles.filter(
    (a) => a.category !== article.category && a.slug !== slug
  );
  return [...sameCategory, ...others].slice(0, limit);
}
