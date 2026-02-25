import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { CategoryBreakdownItem, GoalProgressItem } from '@/lib/monthlyReport/calculations';

const monthlyInsightsSchema = z.object({
  success: z.string().describe('תובנת הצלחה - משפט אחד קצר וחיובי'),
  attention: z.string().describe('תובנת תשומת לב - משפט אחד קצר ולא מאשים'),
  forecast: z.string().describe('מבט קדימה - משפט אחד קצר עם המלצה מעשית'),
});

export type MonthlyInsights = z.infer<typeof monthlyInsightsSchema>;

const SYSTEM_PROMPT = `אתה היועץ הפיננסי של Myneto – אפליקציית ניהול תקציב אישי.
הסגנון שלך: מינימליסטי, חם, ובגובה העיניים. אתה לא מרצה ולא מאשים.
כללי כתיבה:
- כל תובנה = משפט אחד בלבד (עד 20 מילים).
- השתמש במילים כמו "שלך", "הצלחת", "היעד שלך".
- אל תוסיף הסברים, מספרים שכבר מוצגים בדוח, או סימני פיסוק מוגזמים.
- הימנע מביטויים כמו "בהחלט", "מאוד", "חשוב לציין" – כתוב ישיר.
- אם אין חריגה – אל תמציא בעיה. כתוב משפט חיובי אמיתי.
- אם אין מספיק נתונים ליעד – כתוב "לא הוגדרו יעדים לחודש זה" ותמליץ להגדיר.
- כתוב בעברית בלבד.`;

interface MonthData {
  monthKey: string;
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  categoryBreakdown: CategoryBreakdownItem[];
  goalsProgress: GoalProgressItem[];
  netWorth: number;
  isFirstMonth: boolean;
}

function buildUserPrompt(data: MonthData): string {
  const topCategories = data.categoryBreakdown
    .slice(0, 5)
    .map((c) => `${c.categoryName}: ${Math.round(c.amount)} ₪${c.changeFromPrev !== null ? ` (${c.changeFromPrev > 0 ? '+' : ''}${c.changeFromPrev}% מחודש קודם)` : ''}`)
    .join('\n');

  const goalsText =
    data.goalsProgress.length > 0
      ? data.goalsProgress
          .map((g) => `${g.name}: ${g.percentage}% (${Math.round(g.current)} / ${Math.round(g.target)} ₪)`)
          .join('\n')
      : 'לא הוגדרו יעדים';

  return `נתוני החודש ${data.monthKey}:
${data.isFirstMonth ? '(זהו החודש הראשון של המשתמש – אל תשווה לחודשים קודמים)\n' : ''}
הכנסות: ${Math.round(data.totalIncome)} ₪
הוצאות: ${Math.round(data.totalExpenses)} ₪
מאזן: ${Math.round(data.netCashflow)} ₪
שווי נקי: ${Math.round(data.netWorth)} ₪

הוצאות מובילות:
${topCategories || 'אין נתונים'}

יעדים:
${goalsText}`;
}

/**
 * Generate AI insights for a monthly report using generateObject (type-safe Zod schema)
 */
export async function generateMonthlyInsights(
  data: MonthData
): Promise<MonthlyInsights> {
  try {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: monthlyInsightsSchema,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(data),
    });

    return object;
  } catch (error) {
    console.error('[MonthlyInsights] AI generation failed:', error);
    return {
      success: 'הדוח שלך מוכן – צעד ראשון חשוב בניהול הכספים.',
      attention: 'התובנות יתווספו בקרוב.',
      forecast: 'המשך לעקוב אחרי ההוצאות שלך כדי לראות שיפור.',
    };
  }
}
