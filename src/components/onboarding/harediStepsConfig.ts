/**
 * Haredi Onboarding Steps Configuration
 * הגדרת השלבים של תהליך ה-Onboarding לקהל החרדי
 *
 * 6 שלבים:
 * 1. הסבר ראשוני (choice, לא ניתן לסגור) - עם אפשרות נתוני דמה
 * 2. הוספת נכס אחד (form)
 * 3. הוספת הלוואה אחת (form)
 * 4. הוספת הכנסה קבועה + הוצאה לדוגמה (form, מסך כפול)
 * 5. הוספת יעד פיננסי (form)
 * 6. משימות להמשך (tasks)
 */

import { OnboardingStep } from './stepsConfig';

/**
 * Steps of the Haredi Onboarding Wizard
 */
export const harediOnboardingSteps: OnboardingStep[] = [
  // ====================================
  // שלב 1: הסבר ראשוני + בחירה (לא ניתן לסגור)
  // ====================================
  {
    id: 'haredi-intro',
    title: 'ברוכים הבאים!',
    description: 'המערכת שתעזור לך לנהל את הכספים של המשפחה בצורה חכמה ומסודרת.',
    icon: 'sparkles',
    autopilotTargetId: '',
    stepType: 'choice',
    isClosable: false,
    fields: [],
    infoSections: [
      {
        title: 'מיפוי מצב פיננסי',
        content: 'הכנסות, הוצאות, נכסים והלוואות — נמפה הכל במקום אחד.',
      },
      {
        title: 'הגדרת יעדים',
        content: 'נגדיר כמה צריך לחסוך כל חודש כדי להגיע ליעד.',
      },
      {
        title: 'השקעות כשרות',
        content: 'פתיחת תיק מסחר עצמאי וקניית קרן עוקבת מדד כשרה.',
      },
    ],
  },

  // ====================================
  // שלב 2: הוספת נכס אחד
  // ====================================
  {
    id: 'haredi-asset',
    title: 'בואו נתחיל עם הנכס הראשון שלך',
    description:
      'נכסים הם כל מה ששווה כסף ושייך לך: חסכונות בבנק, השקעות, נדל"ן, רכב ועוד',
    icon: 'trending-up',
    autopilotTargetId: 'btn-add-asset',
    stepType: 'form',
    fields: [
      {
        key: 'assetCategory',
        label: 'סוג הנכס',
        type: 'select',
        required: true,
        useDynamicOptions: true,
      },
      {
        key: 'assetName',
        label: 'שם הנכס',
        type: 'text',
        required: true,
        placeholder: 'לדוגמה: חשבון חסכון בבנק לאומי',
      },
      {
        key: 'assetValue',
        label: 'שווי הנכס',
        type: 'currency',
        required: true,
        placeholder: '50,000',
        helperText: 'הערך הנוכחי של הנכס בשקלים',
      },
    ],
  },

  // ====================================
  // שלב 3: הוספת הלוואה אחת
  // ====================================
  {
    id: 'haredi-liability',
    title: 'הלוואות והתחייבויות',
    description:
      'הלוואות הן חובות קבועים כמו משכנתא או הלוואות - חשוב לדעת כמה אתה חייב כדי לחשב את השווי הנקי שלך',
    icon: 'credit-card',
    autopilotTargetId: 'btn-add-liability',
    stepType: 'form',
    fields: [
      {
        key: 'liabilityType',
        label: 'סוג ההלוואה',
        type: 'select',
        required: true,
        useDynamicOptions: true,
      },
      {
        key: 'liabilityAmount',
        label: 'סכום ההלוואה',
        type: 'currency',
        required: true,
        placeholder: '500,000',
        helperText: 'הסכום שנותר לתשלום',
      },
      {
        key: 'liabilityInterest',
        label: 'ריבית שנתית (%)',
        type: 'number',
        required: true,
        placeholder: '4.5',
        helperText: 'אחוז הריבית השנתית',
      },
      {
        key: 'liabilityTerm',
        label: 'תקופה (חודשים)',
        type: 'number',
        required: true,
        placeholder: '240',
        helperText: 'מספר החודשים שנותרו',
      },
    ],
  },

  // ====================================
  // שלב 4: הכנסה קבועה + הוצאה לדוגמה (מסך כפול)
  // ====================================
  {
    id: 'haredi-income-expense',
    title: 'הכנסות והוצאות חודשיות',
    description:
      'כדי להבין כמה כסף נשאר לך כל חודש, צריך לדעת כמה נכנס וכמה יוצא. בואו נוסיף את המשכורת שלך והוצאה אחת לדוגמה',
    icon: 'wallet',
    autopilotTargetId: 'btn-add-recurring',
    stepType: 'form',
    fields: [
      // --- שדות הכנסה ---
      {
        key: 'incomeCategory',
        label: 'סוג הכנסה',
        type: 'select',
        required: true,
        useDynamicOptions: true,
      },
      {
        key: 'incomeName',
        label: 'שם ההכנסה',
        type: 'text',
        required: true,
        placeholder: 'לדוגמה: משכורת',
      },
      {
        key: 'incomeAmount',
        label: 'סכום חודשי',
        type: 'currency',
        required: true,
        placeholder: '15,000',
        helperText: 'הסכום שנכנס כל חודש',
      },
      // --- שדות הוצאה ---
      {
        key: 'expenseName',
        label: 'שם ההוצאה',
        type: 'text',
        required: true,
        placeholder: 'לדוגמה: קניות בסופר',
      },
      {
        key: 'expenseCategory',
        label: 'קטגוריה',
        type: 'select',
        required: true,
        useDynamicOptions: true,
      },
      {
        key: 'expenseAmount',
        label: 'סכום ההוצאה',
        type: 'currency',
        required: true,
        placeholder: '150',
        helperText: 'כמה עלתה ההוצאה?',
      },
    ],
  },

  // ====================================
  // שלב 5: הוספת יעד פיננסי
  // ====================================
  {
    id: 'haredi-goal',
    title: 'בואו נגדיר יעד פיננסי',
    description:
      'יעדים עוזרים לנו לדעת כמה צריך לחסוך כל חודש. בואו נגדיר יעד ראשון - למשל חיסכון לילדים, קניית דירה, או כל יעד אחר שחשוב לך',
    icon: 'target',
    autopilotTargetId: '',
    stepType: 'form',
    fields: [
      {
        key: 'goalName',
        label: 'שם היעד',
        type: 'text',
        required: true,
        placeholder: 'לדוגמה: חיסכון לילדים, קניית דירה',
      },
      {
        key: 'goalTargetAmount',
        label: 'סכום היעד',
        type: 'currency',
        required: true,
        placeholder: '100,000',
        helperText: 'כמה רוצים לחסוך',
      },
      {
        key: 'goalDeadline',
        label: 'תאריך יעד',
        type: 'date',
        required: true,
        helperText: 'מתי רוצים להגיע ליעד',
      },
      {
        key: 'goalCurrentAmount',
        label: 'סכום נוכחי (אופציונלי)',
        type: 'currency',
        required: false,
        placeholder: '0',
        helperText: 'כמה כבר נחסך עד כה',
      },
    ],
  },

  // ====================================
  // שלב 6: משימות להמשך
  // ====================================
  {
    id: 'haredi-tasks',
    title: 'מעולה! מה הלאה?',
    description: 'סיימת את ההגדרה הבסיסית. הנה מה שכדאי לעשות הלאה:',
    icon: 'sparkles',
    autopilotTargetId: '',
    stepType: 'tasks',
    fields: [],
    tasks: [
      'הוספת נכסים נוספים (אם יש)',
      'הוספת הלוואות נוספות (אם יש)',
      'הוספת כל ההכנסות החודשיות הקבועות',
      'מעקב אחרי הוצאות יומיומיות',
      'הגדרת יעדים נוספים',
      'פתיחת תיק מסחר עצמאי וכשר',
    ],
  },
];

/**
 * Get step by ID
 */
export function getHarediStepById(stepId: string): OnboardingStep | undefined {
  return harediOnboardingSteps.find((step) => step.id === stepId);
}

/**
 * Get step index by ID
 */
export function getHarediStepIndex(stepId: string): number {
  return harediOnboardingSteps.findIndex((step) => step.id === stepId);
}

/**
 * Get next step
 */
export function getHarediNextStep(currentStepId: string): OnboardingStep | null {
  const currentIndex = getHarediStepIndex(currentStepId);
  if (currentIndex === -1 || currentIndex >= harediOnboardingSteps.length - 1) {
    return null;
  }
  return harediOnboardingSteps[currentIndex + 1];
}

/**
 * Get previous step
 */
export function getHarediPreviousStep(currentStepId: string): OnboardingStep | null {
  const currentIndex = getHarediStepIndex(currentStepId);
  if (currentIndex <= 0) {
    return null;
  }
  return harediOnboardingSteps[currentIndex - 1];
}
