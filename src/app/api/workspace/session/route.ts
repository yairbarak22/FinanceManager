import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getSharedUserIds } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { expenseCategories, incomeCategories } from '@/lib/categories';
import { z } from 'zod';
import type { WorkspaceTransaction, WorkspaceCategory } from '@/lib/workspace/types';

const querySchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/, 'monthKey must be YYYY-MM'),
  importSessionId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(userId, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות. אנא המתן.' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      monthKey: searchParams.get('monthKey'),
      importSessionId: searchParams.get('importSessionId') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'monthKey חסר או לא תקין (פורמט: YYYY-MM)' },
        { status: 400 }
      );
    }

    const { monthKey, importSessionId } = parsed.data;
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const userIds = await getSharedUserIds(userId);

    const [user, transactions, customCategories, budgets] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { signupSource: true },
      }),
      prisma.transaction.findMany({
        where: { userId: { in: userIds }, date: { gte: startDate, lt: endDate } },
        orderBy: { date: 'desc' },
      }),
      prisma.customCategory.findMany({ where: { userId: { in: userIds } } }),
      prisma.budget.findMany({ where: { userId: { in: userIds }, month, year } }),
    ]);

    const isHaredi = user?.signupSource === 'prog';
    const budgetMap = new Map(budgets.map((b) => [b.categoryId, b.amount]));

    const allExpenseCategories = isHaredi
      ? expenseCategories
      : expenseCategories.filter((c) => !c.harediOnly);

    const spentMap = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type === 'expense') {
        spentMap.set(tx.category, (spentMap.get(tx.category) || 0) + Math.abs(tx.amount));
      }
    }

    const workspaceTransactions: WorkspaceTransaction[] = transactions.map((tx) => {
      const hasRealCategory =
        tx.category && tx.category !== 'other' && tx.category !== 'uncategorized';

      return {
        id: tx.id,
        date: tx.date.toISOString(),
        description: tx.description,
        amount: Math.abs(tx.amount),
        type: tx.type as 'income' | 'expense',
        currency: (tx.currency as 'ILS' | 'USD') || 'ILS',
        categoryId: hasRealCategory ? tx.category : null,
        status: hasRealCategory ? 'CONFIRMED' : 'UNCATEGORIZED',
        aiConfidence: 'NONE',
      };
    });

    const seenIds = new Set<string>();
    const workspaceCategories: WorkspaceCategory[] = [];

    for (const cat of [...allExpenseCategories, ...incomeCategories]) {
      if (seenIds.has(cat.id)) continue;
      seenIds.add(cat.id);

      const assigned = workspaceTransactions.filter(
        (tx) => tx.status === 'CONFIRMED' && tx.categoryId === cat.id
      );
      const pending = workspaceTransactions.filter(
        (tx) => tx.status === 'AI_SUGGESTED' && tx.aiSuggestedCategoryId === cat.id
      );

      workspaceCategories.push({
        id: cat.id,
        name: cat.name,
        nameHe: cat.nameHe,
        icon: cat.icon?.displayName || cat.icon?.name || 'Circle',
        colorTheme: cat.color,
        bgColor: cat.bgColor,
        textColor: cat.textColor,
        isCustom: false,
        monthlyBudget: budgetMap.get(cat.id) || 0,
        currentSpent: spentMap.get(cat.id) || 0,
        assignedTransactions: assigned,
        pendingAiTransactions: pending,
      });
    }

    for (const cc of customCategories) {
      if (seenIds.has(cc.id)) continue;
      seenIds.add(cc.id);

      const assigned = workspaceTransactions.filter(
        (tx) => tx.status === 'CONFIRMED' && tx.categoryId === cc.id
      );
      const pending = workspaceTransactions.filter(
        (tx) => tx.status === 'AI_SUGGESTED' && tx.aiSuggestedCategoryId === cc.id
      );

      workspaceCategories.push({
        id: cc.id,
        name: cc.name,
        nameHe: cc.name,
        icon: cc.icon || 'Circle',
        colorTheme: cc.color || '#7E7F90',
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-700',
        isCustom: true,
        monthlyBudget: budgetMap.get(cc.id) || 0,
        currentSpent: spentMap.get(cc.id) || 0,
        assignedTransactions: assigned,
        pendingAiTransactions: pending,
      });
    }

    // If an import session is specified, load its draft rows
    let importDraftRows: {
      id: string;
      date: string;
      amount: number;
      type: string;
      description: string;
      suggestedCategory: string | null;
      matchKind: string;
      matchedTransactionId: string | null;
      matchedRecurringId: string | null;
      userResolution: string;
      finalCategory: string | null;
    }[] | undefined;

    if (importSessionId) {
      const session = await prisma.workspaceImportSession.findUnique({
        where: { id: importSessionId },
        include: { rows: true },
      });

      if (session && session.userId === userId && session.status === 'OPEN') {
        importDraftRows = session.rows.map(r => ({
          id: r.id,
          date: r.date.toISOString(),
          amount: r.amount,
          type: r.type,
          description: r.description,
          suggestedCategory: r.suggestedCategory,
          matchKind: r.matchKind,
          matchedTransactionId: r.matchedTransactionId,
          matchedRecurringId: r.matchedRecurringId,
          userResolution: r.userResolution,
          finalCategory: r.finalCategory,
        }));
      }
    }

    return NextResponse.json({
      transactions: workspaceTransactions,
      categories: workspaceCategories,
      monthKey,
      ...(importDraftRows ? { importDraftRows } : {}),
    });
  } catch (err) {
    console.error('[Workspace Session] Error:', err);
    return NextResponse.json({ error: 'שגיאה בטעינת נתוני הסיווג' }, { status: 500 });
  }
}
