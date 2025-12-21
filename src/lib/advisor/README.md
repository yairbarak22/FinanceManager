# מנוע הייעוץ הפיננסי - מדריך להוספת הטבות

מערכת המלצות חכמה שמנתחת את הנתונים הפיננסיים של המשתמש ומציעה הטבות נסתרות והמלצות מותאמות אישית.

---

## 📁 מבנה התיקייה

```
src/lib/advisor/
├── README.md           # המדריך הזה
├── types.ts            # טיפוסים וממשקים
├── constants.ts        # קבועים (ספי ריבית, מילות מפתח, קישורים)
├── helpers.ts          # פונקציות עזר לבדיקת תנאים
├── ruleFactory.ts      # יוצר החוקים
├── context.ts          # טוען נתוני המשתמש מ-Prisma
├── engine.ts           # המנוע הראשי שמריץ את החוקים
└── rules/              # תיקיית החוקים
    ├── _template.ts    # תבנית להעתקה
    ├── careerHousing.ts
    ├── ogenLoans.ts
    ├── donations46.ts
    ├── reserveBonus.ts
    └── arbitrage.ts
```

---

## 🚀 הוספת הטבה חדשה - 3 צעדים פשוטים

### צעד 1: צור קובץ חדש

העתק את התבנית:
```bash
cp src/lib/advisor/rules/_template.ts src/lib/advisor/rules/myNewRule.ts
```

### צעד 2: ערוך את הקובץ

```typescript
// src/lib/advisor/rules/myNewRule.ts
import { createRule } from '../ruleFactory';
import { isStudent, isInAgeRange } from '../helpers';

export default createRule({
  // מזהה ייחודי (באנגלית, עם מקפים)
  id: 'student-discount-example',
  
  // שם החוק (לשימוש פנימי)
  name: 'הנחת סטודנטים',
  
  // התנאי - מתי להציג את ההמלצה?
  condition: (ctx) => {
    return isStudent(ctx) && isInAgeRange(ctx, 18, 30);
  },
  
  // ההמלצה שתוצג למשתמש
  recommendation: {
    title: 'הנחת סטודנטים בתחבורה ציבורית',
    description: 'כסטודנט/ית את/ה זכאי/ת להנחה של 33% בתחבורה הציבורית. ניתן להנפיק כרטיס רב-קו מוזל.',
    type: 'savings',
    priority: 'medium',
    actionUrl: 'https://www.rail.co.il/student',
    potentialValue: 1200, // חיסכון שנתי משוער
  },
});
```

### צעד 3: רשום את החוק במנוע

פתח את `src/lib/advisor/engine.ts` והוסף:

```typescript
// בראש הקובץ - הוסף import
import myNewRule from './rules/myNewRule';

// במערך ALL_RULES - הוסף את החוק
const ALL_RULES: FinancialRule[] = [
  careerHousingRule,
  ogenLoansRule,
  donations46Rule,
  reserveBonusRule,
  arbitrageRule,
  myNewRule,  // <-- הוסף כאן
];
```

**זהו! ההטבה תופיע אוטומטית כשהתנאים מתקיימים.**

---

## 📋 מבנה החוק

```typescript
createRule({
  id: string,                    // מזהה ייחודי (חובה)
  name: string,                  // שם לשימוש פנימי (חובה)
  condition: (ctx) => boolean,   // פונקציית תנאי (חובה)
  recommendation: {
    title: string,               // כותרת ההמלצה (חובה)
    description: string,         // תיאור מפורט (חובה)
    type: RecommendationType,    // סוג ההמלצה (חובה)
    priority: Priority,          // עדיפות (חובה)
    actionUrl?: string,          // קישור לפעולה (אופציונלי)
    potentialValue?: number,     // ערך כספי משוער (אופציונלי)
  }
})
```

### סוגי המלצות (type)

| ערך | תיאור | אייקון |
|-----|-------|--------|
| `'tax_benefit'` | הטבת מס | 🧾 |
| `'savings'` | חיסכון | 🐷 |
| `'insurance'` | ביטוח | 🛡️ |
| `'banking'` | בנקאות | 🏛️ |
| `'general'` | כללי | ℹ️ |

### עדיפויות (priority)

| ערך | תיאור | צבע |
|-----|-------|-----|
| `'high'` | גבוהה | אדום |
| `'medium'` | בינונית | כתום |
| `'low'` | נמוכה | אפור |

---

## 🔧 פונקציות עזר (helpers)

### בדיקות פרופיל

```typescript
import { 
  hasProfile,      // יש פרופיל מלא?
  isCareer,        // איש/אשת קבע?
  isReservist,     // מילואימניק/ית?
  isSelfEmployed,  // עצמאי/ת?
  isEmployee,      // שכיר/ה?
  isStudent,       // סטודנט/ית?
  isMarried,       // נשוי/אה?
  hasChildren,     // יש ילדים?
  isInAgeRange,    // בטווח גילאים?
  getEstimatedAge, // גיל משוער
} from '../helpers';

// דוגמאות שימוש
condition: (ctx) => {
  return isCareer(ctx);                    // איש קבע
  return isReservist(ctx) && isSelfEmployed(ctx);  // מילואימניק עצמאי
  return isInAgeRange(ctx, 24, 45);        // בגילאי 24-45
  return hasChildren(ctx) && isMarried(ctx);       // נשוי עם ילדים
}
```

### בדיקות פיננסיות

```typescript
import {
  hasHighInterestDebt,      // יש חוב בריבית גבוהה?
  getHighInterestDebtAmount, // סכום החוב בריבית גבוהה
  getHighestInterestRate,   // הריבית הגבוהה ביותר
  hasLiquidAssets,          // יש נכסים נזילים?
  getLiquidAssetsValue,     // סכום הנכסים הנזילים
  hasNoRealEstate,          // אין נדל"ן?
  hasRealEstate,            // יש נדל"ן?
  hasNegativeCashFlow,      // תזרים שלילי?
  getMonthlyCashFlow,       // תזרים חודשי
  hasMortgage,              // יש משכנתא?
  hasLiabilities,           // יש התחייבויות?
} from '../helpers';

// דוגמאות שימוש
condition: (ctx) => {
  return hasHighInterestDebt(ctx, 6);      // חוב בריבית מעל 6%
  return hasHighInterestDebt(ctx, 10);     // חוב בריבית מעל 10%
  return hasLiquidAssets(ctx) && hasMortgage(ctx);  // יש נזילים ומשכנתא
  return ctx.metrics.netWorth > 1000000;   // שווי נקי מעל מיליון
}
```

### בדיקות עסקאות

```typescript
import {
  findTransactionsByKeywords,  // מצא עסקאות לפי מילות מפתח
  sumTransactionsByKeywords,   // סכום עסקאות לפי מילות מפתח
  getTotalIncome,              // סה"כ הכנסות
  getTotalExpenses,            // סה"כ הוצאות
  getRecurringIncome,          // הכנסה קבועה חודשית
  getRecurringExpenses,        // הוצאות קבועות חודשיות
} from '../helpers';

// דוגמאות שימוש
condition: (ctx) => {
  // בדוק תרומות
  const donations = sumTransactionsByKeywords(ctx, ['תרומה', 'עמותת', 'צדקה']);
  return donations > 500;
  
  // בדוק עסקאות ספציפיות
  const gymTransactions = findTransactionsByKeywords(ctx, ['חדר כושר', 'הולמס']);
  return gymTransactions.length > 0;
}
```

---

## 📊 הקונטקסט המלא (ctx)

הפונקציה `condition` מקבלת את כל הנתונים של המשתמש:

```typescript
interface FinancialContext {
  user: {
    id: string;
    name?: string;
    email: string;
    profile?: {
      militaryStatus?: 'none' | 'reserve' | 'career';
      maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
      employmentType?: 'employee' | 'self_employed' | 'both' | 'student';
      hasChildren: boolean;
      childrenCount: number;
      ageRange?: '18-25' | '26-35' | '36-45' | '46-55' | '56-65' | '65+';
      isStudent: boolean;
      graduationDate?: string;
    };
  };
  
  assets: Asset[];           // כל הנכסים
  liabilities: Liability[];  // כל ההתחייבויות
  transactions: Transaction[]; // עסקאות מ-3 חודשים אחרונים
  recurring: RecurringTransaction[]; // עסקאות קבועות
  
  metrics: {
    netWorth: number;        // שווי נקי
    totalAssets: number;     // סה"כ נכסים
    totalLiabilities: number; // סה"כ התחייבויות
    savingsRate: number;     // שיעור חיסכון (%)
    monthlyIncome: number;   // הכנסה חודשית
    monthlyExpenses: number; // הוצאות חודשיות
    monthlyCashFlow: number; // תזרים חודשי
    liquidAssets: number;    // נכסים נזילים
    highInterestDebt: number; // חוב בריבית גבוהה
  };
}
```

### גישה ישירה לנתונים

```typescript
condition: (ctx) => {
  // בדוק שווי נקי
  if (ctx.metrics.netWorth > 500000) return true;
  
  // בדוק נכסים ספציפיים
  const hasStocks = ctx.assets.some(a => a.category === 'stocks');
  
  // בדוק התחייבויות
  const mortgages = ctx.liabilities.filter(l => l.type === 'mortgage');
  const totalMortgage = mortgages.reduce((sum, m) => sum + m.totalAmount, 0);
  
  // בדוק עסקאות
  const bigExpenses = ctx.transactions.filter(t => 
    t.type === 'expense' && t.amount > 5000
  );
  
  return bigExpenses.length > 3;
}
```

---

## 🏷️ הוספת קבועים חדשים

אם יש לך ערכים שחוזרים על עצמם, הוסף אותם ל-`constants.ts`:

```typescript
// src/lib/advisor/constants.ts

// הוסף URL חדש
export const SERVICE_URLS = {
  // ...קיימים...
  MY_NEW_SERVICE: 'https://example.com',
} as const;

// הוסף ספים חדשים
export const MY_THRESHOLDS = {
  MIN_AMOUNT: 1000,
  MAX_AGE: 50,
} as const;

// הוסף מילות מפתח חדשות
export const MY_KEYWORDS = [
  'מילה1',
  'מילה2',
] as const;
```

---

## ✅ רשימת הטבות לדוגמה להוספה

| הטבה | תנאי | עדיפות |
|------|------|--------|
| הנחת ארנונה לנכים | אחוזי נכות > 0 | גבוהה |
| מענק לידה | נשואים + ילדים חדשים | גבוהה |
| קרן השתלמות לעצמאים | עצמאי ללא קה"ש | גבוהה |
| החזר מס על שכר דירה | שכיר + שוכר דירה | בינונית |
| ביטוח חיים דרך העבודה | שכיר ללא ביטוח חיים | בינונית |
| הטבות מס להורים לילדים | ילדים מתחת גיל 18 | בינונית |
| נקודות זיכוי לגרושים | גרוש/ה עם ילדים | בינונית |
| הנחה בגני ילדים | הכנסה נמוכה + ילדים | גבוהה |
| מלגות לסטודנטים | סטודנט + הכנסה נמוכה | בינונית |
| פטור ממס שבח | מכירת דירה יחידה | גבוהה |

---

## 🐛 פתרון בעיות

### החוק לא מופיע
1. וודא שהקובץ נמצא ב-`src/lib/advisor/rules/`
2. וודא שהוספת import ב-`engine.ts`
3. וודא שהוספת לרשימת `ALL_RULES`
4. בדוק שהתנאי מחזיר `true`

### שגיאות TypeScript
1. וודא שהטיפוסים נכונים (`type`, `priority`)
2. וודא ש-`id` הוא מחרוזת ייחודית
3. בדוק שה-imports נכונים

### לבדיקה מקומית
הוסף לוג בתנאי:
```typescript
condition: (ctx) => {
  console.log('Checking rule:', ctx.user.profile);
  const result = isCareer(ctx);
  console.log('Result:', result);
  return result;
}
```

---

## 📝 טיפים

1. **שמות קבצים** - השתמש ב-camelCase באנגלית
2. **מזהים (id)** - ייחודיים, באנגלית עם מקפים
3. **תיאורים** - בעברית, פנייה בלשון זכר/נקבה עם קו נטוי
4. **קישורים** - וודא שהם עובדים ופותחים בטאב חדש
5. **ערכים כספיים** - הערכות שנתיות, לא חודשיות

---

## 📞 עזרה

אם נתקעת, בדוק את החוקים הקיימים ב-`rules/` כדוגמאות.

