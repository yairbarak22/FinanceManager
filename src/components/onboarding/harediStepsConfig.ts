/**
 * Haredi Onboarding Steps Configuration
 * הגדרת השלבים של תהליך ה-Onboarding לקהל החרדי
 */

import { OnboardingStep, StepField } from './stepsConfig';

/**
 * Steps of the Haredi Onboarding Wizard
 * מבנה שלבים שונה לקהל החרדי - פשוט יותר, מותאם לקהל
 */
export const harediOnboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'ברוכים הבאים!',
    description: 'בוא נתחיל להגדיר את המערכת שלך. תוכל להזין את הנתונים שלך בצורה מהירה ופשוטה, או להתחיל מיד עם נתוני דמה שתוכל לערוך בהמשך.',
    icon: 'sparkles',
    autopilotTargetId: '',
    stepType: 'choice',
    fields: [],
  },
  {
    id: 'profile',
    title: 'קצת עליך',
    description: 'נתחיל בהכרות קצרה. המידע הזה יעזור לנו להתאים את ההמלצות הפיננסיות עבורך.',
    icon: 'user',
    autopilotTargetId: 'nav-profile-btn',
    fields: [
      {
        key: 'ageRange',
        label: 'טווח גילאים',
        type: 'select',
        required: true,
        options: [
          { value: '18-25', label: '18-25' },
          { value: '26-35', label: '26-35' },
          { value: '36-45', label: '36-45' },
          { value: '46-55', label: '46-55' },
          { value: '56-65', label: '56-65' },
          { value: '65+', label: '65+' },
        ],
      },
      {
        key: 'employmentType',
        label: 'סוג תעסוקה',
        type: 'select',
        required: true,
        options: [
          { value: 'employee', label: 'שכיר' },
          { value: 'self_employed', label: 'עצמאי' },
          { value: 'both', label: 'שכיר + עצמאי' },
          { value: 'student', label: 'סטודנט' },
        ],
      },
    ],
  },
  {
    id: 'assets',
    title: 'הנכסים שלך',
    description: 'נכסים הם כל מה ששווה כסף ושייך לך: חסכונות בבנק, השקעות, נדל"ן, רכב ועוד. בוא נוסיף ביחד את הנכס הראשון שלך!',
    icon: 'trending-up',
    autopilotTargetId: 'btn-add-asset',
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
  {
    id: 'income',
    title: 'הכנסות חודשיות',
    description: 'עסקאות קבועות הן דברים שחוזרים כל חודש: משכורת, חשבונות, שכירות ועוד. מיפוי שלהם יאפשר לנו לחשב כמה כסף נשאר לך כל חודש להשקיע או לחסוך. בוא נוסיף את המשכורת שלך או הכנסה קבועה אחרת!',
    icon: 'wallet',
    autopilotTargetId: 'btn-add-recurring',
    fields: [
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
    ],
  },
  {
    id: 'expenses',
    title: 'הוצאות שוטפות',
    description: 'כאן תעקוב אחרי כל ההוצאות של היום יום. המערכת מחלקת את ההוצאות לקטגוריות כדי שתדע בדיוק על מה אתה מוציא את הכסף שלך. בוא נוסיף את ההוצאה הראשונה שלך!',
    icon: 'trending-down',
    autopilotTargetId: 'btn-global-add',
    fields: [
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

