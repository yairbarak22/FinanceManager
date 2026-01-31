/**
 * Onboarding Steps Configuration
 * הגדרת השלבים של תהליך ה-Onboarding
 */

export type FieldType = 'text' | 'number' | 'select' | 'currency' | 'feature-demos';

/** Step type - regular form step or choice step */
export type StepType = 'form' | 'choice';

export interface StepField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  helperText?: string;
  /** For feature-demos type: the demo ID to trigger */
  demoId?: string;
  /** For feature-demos type: icon name */
  featureIcon?: 'sparkles' | 'bot' | 'upload';
  /** 
   * When true, options are generated dynamically from categories.ts 
   * This ensures synchronization with regular modals (AssetModal, TransactionModal, etc.)
   */
  useDynamicOptions?: boolean;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  fields: StepField[];
  autopilotTargetId: string;
  icon: 'user' | 'wallet' | 'credit-card' | 'trending-up' | 'trending-down' | 'sparkles';
  /** Step type - defaults to 'form' */
  stepType?: StepType;
}

/**
 * Steps of the Onboarding Wizard
 */
export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'ברוכים הבאים!',
    description: 'בוא נתחיל להגדיר את המערכת שלך. תוכל להזין את הנתונים שלך בצורה מהירה ופשוטה (כ-3 דקות), או להתחיל מיד עם נתוני דמה שתוכל לערוך בהמשך.',
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
        useDynamicOptions: true, // Uses categories from categories.ts - synchronized with AssetModal
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
    id: 'liabilities',
    title: 'ההתחייבויות שלך',
    description: 'התחייבויות הן חובות קבועים כמו משכנתא או הלוואות - לא הוצאות שוטפות כמו חשמל או קניות. מיפוי החובות שלך יעזור לנו לחשב את השווי הנקי שלך ולתכנן את הדרך לחופש כלכלי. בוא נוסיף ביחד את ההתחייבות הראשונה שלך!',
    icon: 'credit-card',
    autopilotTargetId: 'btn-add-liability',
    fields: [
      {
        key: 'liabilityType',
        label: 'סוג התחייבות',
        type: 'select',
        required: true,
        useDynamicOptions: true, // Uses categories from categories.ts - synchronized with LiabilityModal
      },
      {
        key: 'liabilityAmount',
        label: 'סכום ההתחייבות',
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
  {
    id: 'income',
    title: 'עסקאות קבועות',
    description: 'עסקאות קבועות הן דברים שחוזרים כל חודש: משכורת, חשבונות, שכירות ועוד. מיפוי שלהם יאפשר לנו לחשב כמה כסף נשאר לך כל חודש להשקיע או לחסוך. בוא נוסיף את המשכורת שלך או הכנסה קבועה אחרת!',
    icon: 'wallet',
    autopilotTargetId: 'btn-add-recurring',
    fields: [
      {
        key: 'incomeCategory',
        label: 'סוג הכנסה',
        type: 'select',
        required: true,
        useDynamicOptions: true, // Uses categories from categories.ts - synchronized with RecurringModal
      },
      {
        key: 'incomeName',
        label: 'שם ההכנסה',
        type: 'text',
        required: true,
        placeholder: 'לדוגמה: משכורת מחברת הייטק',
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
        useDynamicOptions: true, // Uses categories from categories.ts - synchronized with TransactionModal
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
  {
    id: 'features',
    title: 'עוד כלים שימושיים',
    description: 'לפני שמסיימים, הנה עוד כמה כלים שיעזרו לך לנהל את הכספים בצורה חכמה יותר:',
    icon: 'trending-up',
    autopilotTargetId: 'btn-global-add',
    fields: [
      {
        key: 'demo-import',
        label: 'ייבוא עסקאות מהבנק',
        type: 'feature-demos',
        helperText: 'במקום להזין עסקאות ידנית, תוכל לייבא את כל העסקאות שלך ישירות מקובץ אקסל או CSV שהורדת מאתר הבנק. המערכת תזהה אוטומטית את הקטגוריות ותסווג את ההוצאות וההכנסות עבורך.',
        demoId: 'import',
        featureIcon: 'upload',
      },
    ],
  },
];

/**
 * Get step by ID
 */
export function getStepById(stepId: string): OnboardingStep | undefined {
  return onboardingSteps.find((step) => step.id === stepId);
}

/**
 * Get step index by ID
 */
export function getStepIndex(stepId: string): number {
  return onboardingSteps.findIndex((step) => step.id === stepId);
}

/**
 * Get next step
 */
export function getNextStep(currentStepId: string): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStepId);
  if (currentIndex === -1 || currentIndex >= onboardingSteps.length - 1) {
    return null;
  }
  return onboardingSteps[currentIndex + 1];
}

/**
 * Get previous step
 */
export function getPreviousStep(currentStepId: string): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStepId);
  if (currentIndex <= 0) {
    return null;
  }
  return onboardingSteps[currentIndex - 1];
}
