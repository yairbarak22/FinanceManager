export type DashboardSectionId =
  | 'financial_status'
  | 'cash_flow'
  | 'activity'
  | 'portfolio'
  | 'trends'
  | 'investment_portfolio'
  | 'goals'
  | 'budgets';

export interface DashboardSectionConfig {
  id: DashboardSectionId;
  isVisible: boolean;
  order: number;
}

export const SECTION_TITLES: Record<DashboardSectionId, string> = {
  financial_status: 'המצב הפיננסי',
  cash_flow: 'תזרים חודשי',
  activity: 'פעילות',
  portfolio: 'פירוט תיק',
  trends: 'מגמות חודשיות',
  investment_portfolio: 'תיק השקעות',
  goals: 'יעדים',
  budgets: 'תקציבים',
};

export const SECTION_DESCRIPTIONS: Record<DashboardSectionId, string> = {
  financial_status: 'שווי נקי, נכסים והתחייבויות',
  cash_flow: 'הכנסות והוצאות לחודש הנבחר',
  activity: 'פעולות אחרונות וקטגוריות',
  portfolio: 'פירוט נכסים, התחייבויות והוצאות קבועות',
  trends: 'גרפים ומגמות לאורך זמן',
  investment_portfolio: 'תיק ההשקעות והתפלגותו',
  goals: 'מעקב אחר היעדים הפיננסיים',
  budgets: 'ניהול ובקרת תקציב חודשי',
};

export const SECTION_WHAT_INCLUDES: Record<DashboardSectionId, string[]> = {
  financial_status: [
    'שווי נקי כולל עם גרף מגמה',
    'סיכום נכסים מול התחייבויות',
    'התפלגות נכסים בתרשים עוגה',
  ],
  cash_flow: [
    'סה״כ הכנסות בחודש הנבחר',
    'סה״כ הוצאות בחודש הנבחר',
    'תזרים חודשי נטו והשוואה לחודש קודם',
  ],
  activity: [
    'תרשים עוגה של הוצאות לפי קטגוריה',
    'רשימת פעולות אחרונות עם סכומים',
    'גישה מהירה לפרטי כל פעולה',
  ],
  portfolio: [
    'פירוט כל הנכסים (חסכונות, השקעות, נדל״ן)',
    'פירוט כל ההתחייבויות (הלוואות, משכנתא)',
    'הוצאות קבועות חודשיות',
  ],
  trends: [
    'גרף עמודות הכנסות מול הוצאות לפי חודש',
    'קו מגמה של תזרים נטו',
    'סיכום חודשי מפורט עם השוואות',
  ],
  investment_portfolio: [
    'שווי תיק השקעות כולל עם גרף מגמה',
    'שינוי יומי ואחוזי',
    'התפלגות לפי סקטור בתרשים עוגה',
  ],
  goals: [
    'כרטיס סיכום עם סה״כ חיסכון ליעדים',
    'רשימת יעדים עם אחוזי התקדמות',
    'תאריכי יעד וסטטוס כל יעד',
  ],
  budgets: [
    'כרטיס דופק עם יתרת תקציב חודשית',
    'פס התקדמות עם סמן "היום"',
    'רשימת תקציבים לפי קטגוריה עם סטטוס',
  ],
};

export const DEFAULT_DASHBOARD_CONFIG: DashboardSectionConfig[] = [
  { id: 'financial_status',      isVisible: true, order: 0 },
  { id: 'cash_flow',             isVisible: true, order: 1 },
  { id: 'activity',              isVisible: true, order: 2 },
  { id: 'portfolio',             isVisible: true, order: 3 },
  { id: 'trends',                isVisible: true, order: 4 },
  { id: 'investment_portfolio',  isVisible: true, order: 5 },
  { id: 'goals',                 isVisible: true, order: 6 },
  { id: 'budgets',               isVisible: true, order: 7 },
];
