import { expenseCategories, incomeCategories } from '@/lib/categories';

// DTMF key (0-9) -> Hebrew category name
export const expenseCategoriesMap: Record<number, string> = {
  1: 'אחר',
  2: 'מזון',
  3: 'קניות',
  4: 'תחבורה',
  5: 'בילויים',
  6: 'חשבונות',
  7: 'בריאות',
  8: 'חינוך',
  9: 'דיור',
  0: 'פסח',
};

export const incomeCategoriesMap: Record<number, string> = {
  1: 'אחר',
  2: 'משכורת',
  3: 'פרילנס',
  4: 'קצבת ילדים',
  5: 'שכירות',
  6: 'השקעות',
  7: 'בונוס',
  8: 'פנסיה',
};

/**
 * Resolve a DTMF key to a category ID for Transaction storage.
 * Looks up the Hebrew name from the appropriate map, then finds the
 * matching category ID from the canonical categories list.
 */
export function getCategoryIdForIvr(
  txType: 'expense' | 'income',
  key: number
): string {
  const map = txType === 'income' ? incomeCategoriesMap : expenseCategoriesMap;
  const nameHe = map[key] ?? 'אחר';

  const categories = txType === 'income' ? incomeCategories : expenseCategories;
  const match = categories.find((c) => c.nameHe === nameHe);

  return match?.id ?? 'other';
}
