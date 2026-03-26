import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getSharedUserIds } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { z } from 'zod';
import {
  matchImportedRows,
  type ImportedRow,
  type ExistingTransaction,
  type ActiveRecurring,
} from '@/lib/workspace/importMatching';

const rowSchema = z.object({
  date: z.string(),
  amount: z.number(),
  type: z.enum(['income', 'expense']),
  description: z.string().min(1),
  suggestedCategory: z.string().nullable(),
});

const bodySchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  rows: z.array(rowSchema).min(1).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(userId, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות. אנא המתן.' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 });
    }

    const { monthKey, rows } = parsed.data;
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const userIds = await getSharedUserIds(userId);

    // Abandon any existing open session for this user/month
    await prisma.workspaceImportSession.updateMany({
      where: { userId, monthKey, status: 'OPEN' },
      data: { status: 'ABANDONED' },
    });

    // Fetch existing transactions and active recurrings in parallel
    const [existingTxs, recurrings] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: { in: userIds }, date: { gte: startDate, lt: endDate } },
        select: { id: true, date: true, amount: true, type: true, description: true },
      }),
      prisma.recurringTransaction.findMany({
        where: { userId: { in: userIds }, isActive: true },
        select: {
          id: true, name: true, amount: true, type: true,
          category: true, isActive: true, activeMonths: true,
        },
      }),
    ]);

    const importedRows: ImportedRow[] = rows.map((r, idx) => ({
      idx,
      date: new Date(r.date),
      amount: r.amount,
      type: r.type,
      description: r.description,
      suggestedCategory: r.suggestedCategory,
    }));

    const existingMapped: ExistingTransaction[] = existingTxs.map(tx => ({
      id: tx.id,
      date: tx.date,
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
    }));

    const recurringsMapped: ActiveRecurring[] = recurrings.map(r => ({
      id: r.id,
      name: r.name,
      amount: r.amount,
      type: r.type,
      category: r.category,
      isActive: r.isActive,
      activeMonths: r.activeMonths as string[] | null,
    }));

    const matchResults = matchImportedRows(importedRows, existingMapped, recurringsMapped, monthKey);

    // Create session + rows in a single transaction
    const session = await prisma.workspaceImportSession.create({
      data: {
        userId,
        monthKey,
        status: 'OPEN',
        rows: {
          create: matchResults.map(m => {
            const row = rows[m.idx];
            return {
              date: new Date(row.date),
              amount: row.amount,
              type: row.type,
              description: row.description,
              suggestedCategory: row.suggestedCategory,
              matchKind: m.matchKind === 'exact_duplicate' ? 'EXACT_DUPLICATE'
                       : m.matchKind === 'recurring_candidate' ? 'RECURRING_CANDIDATE'
                       : 'NEW',
              matchedTransactionId: m.matchedTransactionId,
              matchedRecurringId: m.matchedRecurringId,
              userResolution: m.matchKind === 'exact_duplicate' ? 'SKIP_DUPLICATE'
                            : m.matchKind === 'recurring_candidate' ? 'PENDING'
                            : 'IMPORT_AS_TX',
            };
          }),
        },
      },
      include: {
        rows: true,
      },
    });

    // Build counts for the UI status bar
    const counts = {
      total: session.rows.length,
      new: session.rows.filter(r => r.matchKind === 'NEW').length,
      exactDuplicates: session.rows.filter(r => r.matchKind === 'EXACT_DUPLICATE').length,
      recurringCandidates: session.rows.filter(r => r.matchKind === 'RECURRING_CANDIDATE').length,
    };

    // Build recurring info for UI (name + category for each candidate)
    const recurringInfoMap = new Map(recurrings.map(r => [r.id, { name: r.name, category: r.category }]));

    const rowsForClient = session.rows.map(r => ({
      id: r.id,
      date: r.date.toISOString(),
      amount: r.amount,
      type: r.type,
      description: r.description,
      suggestedCategory: r.suggestedCategory,
      matchKind: r.matchKind,
      matchedTransactionId: r.matchedTransactionId,
      matchedRecurringId: r.matchedRecurringId,
      matchedRecurringName: r.matchedRecurringId
        ? recurringInfoMap.get(r.matchedRecurringId)?.name ?? null
        : null,
      matchedRecurringCategory: r.matchedRecurringId
        ? recurringInfoMap.get(r.matchedRecurringId)?.category ?? null
        : null,
      userResolution: r.userResolution,
    }));

    return NextResponse.json({
      sessionId: session.id,
      monthKey,
      rows: rowsForClient,
      counts,
    });
  } catch (err) {
    console.error('[Workspace Import Stage] Error:', err);
    return NextResponse.json({ error: 'שגיאה בהכנת הייבוא' }, { status: 500 });
  }
}
