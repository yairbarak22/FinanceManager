import { expenseCategories, harediExpenseCategories } from '@/lib/categories';

const GOAL_CATEGORY_COLOR = '#0DBACC';

const allDefaultExpense = [...expenseCategories, ...harediExpenseCategories];

/**
 * Resolves an expense category ID for a goal based on the goal's **name**.
 *
 * 1. If the name matches a default expense category (by `id` or `nameHe`),
 *    return that category's `id`.
 * 2. If the user already has a CustomCategory with this name, return its `id`.
 * 3. Otherwise, upsert a new CustomCategory with the goal name and return its `id`.
 */
export async function resolveExpenseCategoryForGoalName(
  goalName: string,
  userId: string,
  icon: string | null | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
): Promise<string> {
  const trimmed = goalName.trim();

  const defaultMatch = allDefaultExpense.find(
    (c) => c.id === trimmed || c.nameHe === trimmed,
  );
  if (defaultMatch) return defaultMatch.id;

  const existing = await tx.customCategory.findFirst({
    where: { userId, name: trimmed, type: 'expense' },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await tx.customCategory.create({
    data: {
      userId,
      name: trimmed,
      type: 'expense',
      color: GOAL_CATEGORY_COLOR,
      icon: icon || 'Target',
    },
    select: { id: true },
  });
  return created.id;
}
