import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { z } from 'zod';
import { updateMerchantCache, updateGlobalConsensusBackground } from '@/lib/workspace/postImportLearning';

const resolutionSchema = z.object({
  rowId: z.string().min(1),
  resolution: z.enum(['IMPORT_AS_TX', 'LINK_RECURRING', 'SKIP_DUPLICATE']),
  category: z.string().nullable().optional(),
});

const bodySchema = z.object({
  sessionId: z.string().min(1),
  resolutions: z.array(resolutionSchema),
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

    const { sessionId, resolutions } = parsed.data;

    // Load session with rows, verify ownership
    const session = await prisma.workspaceImportSession.findUnique({
      where: { id: sessionId },
      include: { rows: true },
    });

    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: 'סשן לא נמצא' }, { status: 404 });
    }

    if (session.status !== 'OPEN') {
      return NextResponse.json({ error: 'סשן כבר סגור' }, { status: 409 });
    }

    // Build resolution map (rowId -> resolution+category)
    const resolutionMap = new Map(
      resolutions.map(r => [r.rowId, { resolution: r.resolution, category: r.category ?? null }])
    );

    // Apply resolutions to rows
    const toCreateAsTx: { description: string; amount: number; type: string; date: Date; category: string }[] = [];
    const toLinkRecurring: { recurringId: string; rowId: string }[] = [];
    let skippedDuplicates = 0;

    for (const row of session.rows) {
      const userRes = resolutionMap.get(row.id);
      const resolution = userRes?.resolution ?? row.userResolution;
      const category = userRes?.category ?? row.finalCategory ?? row.suggestedCategory ?? 'uncategorized';

      if (resolution === 'IMPORT_AS_TX') {
        toCreateAsTx.push({
          description: row.description,
          amount: row.amount,
          type: row.type,
          date: row.date,
          category,
        });
      } else if (resolution === 'LINK_RECURRING' && row.matchedRecurringId) {
        toLinkRecurring.push({ recurringId: row.matchedRecurringId, rowId: row.id });
      } else {
        skippedDuplicates++;
      }
    }

    // Execute everything in a single DB transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Transaction records for rows resolved as IMPORT_AS_TX
      let createdCount = 0;
      if (toCreateAsTx.length > 0) {
        const created = await tx.transaction.createMany({
          data: toCreateAsTx.map(t => ({
            userId,
            type: t.type,
            amount: t.amount,
            category: t.category,
            description: t.description,
            date: t.date,
          })),
        });
        createdCount = created.count;
      }

      // 2. Create RecurringMonthlyCoverage for recurring links
      for (const link of toLinkRecurring) {
        await tx.recurringMonthlyCoverage.upsert({
          where: {
            userId_recurringTransactionId_monthKey: {
              userId,
              recurringTransactionId: link.recurringId,
              monthKey: session.monthKey,
            },
          },
          create: {
            userId,
            recurringTransactionId: link.recurringId,
            monthKey: session.monthKey,
            importSessionId: sessionId,
          },
          update: {},
        });
      }

      // 3. Update row resolutions
      for (const row of session.rows) {
        const userRes = resolutionMap.get(row.id);
        if (userRes) {
          await tx.workspaceImportRow.update({
            where: { id: row.id },
            data: {
              userResolution: userRes.resolution,
              finalCategory: userRes.category ?? row.suggestedCategory,
            },
          });
        }
      }

      // 4. Mark session finalized
      await tx.workspaceImportSession.update({
        where: { id: sessionId },
        data: { status: 'FINALIZED' },
      });

      return { createdCount, linkedCount: toLinkRecurring.length };
    });

    // Post-save learning (merchant cache + global consensus) — only for created transactions
    if (toCreateAsTx.length > 0) {
      const savedTxs = toCreateAsTx.map(t => ({
        merchantName: t.description,
        category: t.category,
        isManualCategory: false,
      }));
      await updateMerchantCache(userId, savedTxs);
      updateGlobalConsensusBackground(userId, savedTxs);
    }

    return NextResponse.json({
      success: true,
      created: result.createdCount,
      linked: result.linkedCount,
      skipped: skippedDuplicates,
    });
  } catch (err) {
    console.error('[Workspace Import Finalize] Error:', err);
    return NextResponse.json({ error: 'שגיאה בסיום הייבוא' }, { status: 500 });
  }
}
