export interface TourStep {
  id: string;
  target: string | null; // null for centered modals (welcome/final)
  title: string;
  description: string;
  tips?: string[];
}

export const tourSteps: TourStep[] = [
  // Step 1: Welcome
  {
    id: 'welcome',
    target: null,
    title: 'ברוכים הבאים למנהל הכספים! 🎉',
    description:
      'אנחנו שמחים שבחרת להשתמש במערכת שלנו לניהול הכספים האישיים. בסיור הקצר הזה נלמד אותך איך להשתמש בכל הכלים שלנו.',
    tips: [
      'הסיור לוקח כ-2 דקות',
      'תוכל לדלג בכל שלב',
      'אפשר להפעיל את הסיור מחדש מתפריט המשתמש',
    ],
  },

  // Step 2: Navigation tabs
  {
    id: 'navigation',
    target: '[data-tour="navigation-tabs"]',
    title: 'ניווט ראשי',
    description:
      'כאן תוכל לעבור בין שני המסכים העיקריים: הדאשבורד הראשי שמציג סקירה כללית של מצבך הפיננסי, וטאב ההשקעות לניהול תיק ההשקעות שלך.',
    tips: ['הדאשבורד מציג את כל המידע הפיננסי שלך', 'טאב ההשקעות מאפשר ניהול ופיזור תיק'],
  },

  // Step 3: Month filter
  {
    id: 'month-filter',
    target: '[data-tour="month-filter"]',
    title: 'סינון לפי חודש',
    description:
      'בחר חודש ספציפי כדי לראות את ההכנסות וההוצאות של אותו חודש. בחירה ב"הכל" תציג סיכום של כל התקופה.',
    tips: ['נקודה ירוקה מציינת חודש עם נתונים', 'אפשר לבחור גם חודשים עתידיים לתכנון'],
  },

  // Step 4: Summary cards
  {
    id: 'summary-cards',
    target: '[data-tour="summary-cards"]',
    title: 'סיכום פיננסי',
    description:
      'שלוש כרטיסיות שמציגות במבט מהיר את המצב הפיננסי שלך: סך ההכנסות, סך ההוצאות, והמאזן הכולל (הכנסות פחות הוצאות).',
    tips: ['ירוק = מצב חיובי', 'אדום/ורוד = מצב שלילי', 'הנתונים כוללים עסקאות קבועות'],
  },

  // Step 5: Net worth section
  {
    id: 'net-worth',
    target: '[data-tour="net-worth-section"]',
    title: 'שווי נקי',
    description:
      'השווי הנקי שלך = סך הנכסים פחות סך ההתחייבויות. כאן תראה גם את הפירוט של הכנסות והוצאות קבועות חודשיות.',
    tips: [
      'עקוב אחרי השווי הנקי לאורך זמן',
      'המטרה היא להגדיל את השווי הנקי בהדרגה',
    ],
  },

  // Step 6: Add transaction button
  {
    id: 'add-transaction',
    target: '[data-tour="add-transaction-btn"]',
    title: 'הוספת עסקה',
    description:
      'לחץ כאן כדי להוסיף עסקה חדשה - הכנסה או הוצאה. תוכל לבחור קטגוריה, להזין סכום ותאריך, ולהוסיף תיאור.',
    tips: [
      'אפשר גם לייבא עסקאות מאקסל',
      'קטגוריות מותאמות אישית? הוסף דרך התפריט',
    ],
  },

  // Step 7: Recurring transactions
  {
    id: 'recurring',
    target: '[data-tour="recurring-transactions"]',
    title: 'עסקאות קבועות',
    description:
      'הגדר כאן הכנסות והוצאות שחוזרות כל חודש - משכורת, שכר דירה, מנויים וכו\'. הסכומים יתווספו אוטומטית לחישובים החודשיים.',
    tips: [
      'אפשר להפעיל ולכבות כל עסקה קבועה',
      'עסקאות כבויות לא נכללות בחישובים',
    ],
  },

  // Step 8: Assets section
  {
    id: 'assets',
    target: '[data-tour="assets-section"]',
    title: 'ניהול נכסים',
    description:
      'הוסף את כל הנכסים שלך - חסכונות, השקעות, נדל"ן, קרנות פנסיה וכו\'. לכל נכס אפשר להעלות מסמכים רלוונטיים.',
    tips: [
      'לחץ על אייקון התיקייה כדי להעלות מסמכים',
      'עדכן את שווי הנכסים מעת לעת',
    ],
  },

  // Step 9: Liabilities section
  {
    id: 'liabilities',
    target: '[data-tour="liabilities-section"]',
    title: 'ניהול התחייבויות',
    description:
      'הוסף את כל ההלוואות וההתחייבויות שלך. המערכת תחשב את לוח הסילוקין ותציג כמה נשאר לשלם.',
    tips: [
      'לחץ על "לוח סילוקין" לראות פירוט תשלומים',
      'אפשר לציין זיכוי על ריבית (להלוואת דיור)',
    ],
  },

  // Step 10: Expenses pie chart
  {
    id: 'expenses-chart',
    target: '[data-tour="expenses-chart"]',
    title: 'גרף הוצאות',
    description:
      'הגרף מציג את פילוח ההוצאות שלך לפי קטגוריות. זה עוזר להבין לאן הכסף הולך ואיפה אפשר לחסוך.',
    tips: ['רחף על הפרוסות לראות פרטים', 'זהה את הקטגוריות הגדולות ביותר'],
  },

  // Step 11: Investments tab
  {
    id: 'investments',
    target: '[data-tour="investments-tab"]',
    title: 'טאב השקעות',
    description:
      'עבור לטאב ההשקעות כדי לנהל את תיק ההשקעות שלך. הגדר יעדי פיזור והמערכת תחשב כמה להשקיע בכל נכס.',
    tips: [
      'הגדר יעדי אחוזים לכל השקעה',
      'המחשבון יעזור לך לשמור על הפיזור הרצוי',
    ],
  },

  // Step 12: Final
  {
    id: 'final',
    target: null,
    title: 'מוכנים להתחיל! 🚀',
    description:
      'עכשיו אתה מכיר את כל הכלים של מנהל הכספים. התחל להוסיף את הנתונים שלך ותראה איך המערכת עוזרת לך לנהל את הכספים בצורה חכמה.',
    tips: [
      'התחל מהוספת הכנסות והוצאות קבועות',
      'אחר כך הוסף את הנכסים וההתחייבויות',
      'צריך עזרה? לחץ על "הצג סיור" בתפריט המשתמש',
    ],
  },
];

