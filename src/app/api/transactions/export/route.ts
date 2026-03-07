import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, getSharedUserIds } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { buildTransactionsWorkbook } from '@/lib/excel/buildTransactionsWorkbook';

const MAX_RANGE_DAYS = 366;

const querySchema = z.object({
  startDate: z.string().refine((s) => !isNaN(Date.parse(s)), 'תאריך התחלה לא תקין'),
  endDate: z.string().refine((s) => !isNaN(Date.parse(s)), 'תאריך סיום לא תקין'),
  includeRecurring: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
});

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`export:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות, נסה שוב בעוד דקה' }, { status: 429 });
    }

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join(', ');
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const startDate = new Date(parsed.data.startDate);
    const endDate = new Date(parsed.data.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (endDate < startDate) {
      return NextResponse.json({ error: 'תאריך סיום חייב להיות אחרי תאריך התחלה' }, { status: 400 });
    }

    const rangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (rangeDays > MAX_RANGE_DAYS) {
      return NextResponse.json(
        { error: `טווח התאריכים לא יכול לעלות על ${MAX_RANGE_DAYS} ימים` },
        { status: 400 }
      );
    }

    const userIds = await getSharedUserIds(userId);

    const [transactions, recurringTransactions, customCategories] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: { in: userIds },
          date: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          type: true,
          amount: true,
          category: true,
          description: true,
          date: true,
        },
        orderBy: { date: 'desc' },
      }),
      parsed.data.includeRecurring
        ? prisma.recurringTransaction.findMany({
            where: {
              userId: { in: userIds },
            },
            select: {
              id: true,
              type: true,
              amount: true,
              category: true,
              name: true,
              isActive: true,
              activeMonths: true,
            },
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([]),
      prisma.customCategory.findMany({
        where: { userId: { in: userIds } },
        select: { id: true, name: true, type: true, icon: true, color: true },
      }),
    ]);

    const recurringParsed = recurringTransactions.map((r) => ({
      ...r,
      activeMonths: Array.isArray(r.activeMonths) ? (r.activeMonths as string[]) : null,
    }));

    const wb = buildTransactionsWorkbook({
      transactions,
      recurringTransactions: recurringParsed,
      customCategories,
      startDate,
      endDate,
    });

    const buf = await wb.xlsx.writeBuffer();

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const filename = `myneto-export-${startStr}-to-${endStr}.xlsx`;

    return new NextResponse(Buffer.from(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Error exporting transactions:', err);
    return NextResponse.json({ error: 'שגיאה בייצוא הנתונים' }, { status: 500 });
  }
}
