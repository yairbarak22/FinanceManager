/**
 * Maps goal category keys (from GoalSimulator / GoalQuickTemplates)
 * to expense category IDs (from expenseCategories in categories.ts).
 *
 * Goal categories that don't have an exact 1:1 match use the closest
 * semantically appropriate expense category.
 */
const GOAL_TO_EXPENSE: Record<string, string> = {
  saving: 'savings',
  home: 'housing',
  car: 'transport',
  travel: 'entertainment',
  education: 'education',
  vacation: 'entertainment',
  emergency: 'savings',
  wedding: 'gifts',
  holidays: 'gifts',
};

const KNOWN_GOAL_KEYS = new Set(Object.keys(GOAL_TO_EXPENSE));

export function isKnownGoalCategory(goalCategory: string): boolean {
  return KNOWN_GOAL_KEYS.has(goalCategory);
}

/**
 * Returns the expense category ID for a known goal category key.
 * For custom / unknown keys returns `undefined` — the caller should
 * resolve via CustomCategory instead.
 */
export function goalCategoryToExpenseId(goalCategory: string): string | undefined {
  return GOAL_TO_EXPENSE[goalCategory];
}

/**
 * Reverse lookup: given an expense category ID, returns all goal category
 * keys that map to it (used for matching transactions → goals).
 */
export function expenseIdToGoalCategories(expenseId: string): string[] {
  return Object.entries(GOAL_TO_EXPENSE)
    .filter(([, eid]) => eid === expenseId)
    .map(([goalKey]) => goalKey);
}
