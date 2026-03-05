import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { validateRequest } from '@/lib/validateRequest';
import { copyBudgetSchema } from '@/lib/validationSchemas';

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' }, { status: 429 });
    }

    const { data, errorResponse } = await validateRequest(request, copyBudgetSchema);
    if (errorResponse) return errorResponse;

    if (data.fromMonth === data.toMonth && data.fromYear === data.toYear) {
      return NextResponse.json({ error: 'Source and target month cannot be the same' }, { status: 400 });
    }

    const sourceBudgets = await prisma.budget.findMany({
      where: {
        userId,
        month: data.fromMonth,
        year: data.fromYear,
      },
    });

    if (sourceBudgets.length === 0) {
      return NextResponse.json({ error: 'לא נמצאו תקציבים בחודש המקור' }, { status: 404 });
    }

    const result = await prisma.budget.createMany({
      data: sourceBudgets.map(b => ({
        userId,
        categoryId: b.categoryId,
        amount: b.amount,
        month: data.toMonth,
        year: data.toYear,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ copied: result.count });
  } catch (error) {
    console.error('Error copying budgets:', error);
    return NextResponse.json({ error: 'Failed to copy budgets' }, { status: 500 });
  }
}
