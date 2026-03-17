import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { validateRequest } from '@/lib/validateRequest';
import { upsertPassoverSectionSchema, deletePassoverSectionSchema } from '@/lib/validationSchemas';

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    if (!monthParam || !yearParam) {
      return NextResponse.json({ error: 'month and year are required' }, { status: 400 });
    }

    const month = parseInt(monthParam, 10);
    const year = parseInt(yearParam, 10);

    if (month < 1 || month > 12 || year < 2020 || year > 2100) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }

    const sectionWhere = await withSharedAccount(userId, { month, year });

    const sections = await prisma.passoverSection.findMany({
      where: sectionWhere,
      orderBy: { orderIndex: 'asc' },
    });

    if (sections.length === 0) {
      return NextResponse.json({
        sections: [],
        totalPlanned: 0,
        totalSpent: 0,
        totalRemaining: 0,
        overallPercentage: 0,
      });
    }

    const categoryIds = sections.map(s => s.categoryId);

    const [categories, expenseAggregation] = await Promise.all([
      prisma.customCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, icon: true, color: true },
      }),
      prisma.transaction.groupBy({
        by: ['category'],
        where: await withSharedAccount(userId, {
          type: 'expense',
          category: { in: categoryIds },
        }),
        _sum: { amount: true },
      }),
    ]);

    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const spendingMap = new Map<string, number>();
    for (const row of expenseAggregation) {
      spendingMap.set(row.category, row._sum.amount || 0);
    }

    const sectionsWithSpending = sections.map(section => {
      const cat = categoryMap.get(section.categoryId);
      const spent = spendingMap.get(section.categoryId) || 0;
      const remaining = section.plannedAmount - spent;
      const percentage = section.plannedAmount > 0 ? (spent / section.plannedAmount) * 100 : 0;
      return {
        id: section.id,
        categoryId: section.categoryId,
        categoryName: cat?.name || section.categoryId,
        categoryIcon: cat?.icon || null,
        categoryColor: cat?.color || null,
        plannedAmount: section.plannedAmount,
        spent,
        remaining,
        percentage: Math.round(percentage * 10) / 10,
        orderIndex: section.orderIndex,
      };
    });

    const totalPlanned = sections.reduce((sum, s) => sum + s.plannedAmount, 0);
    const totalSpent = sectionsWithSpending.reduce((sum, s) => sum + s.spent, 0);
    const totalRemaining = totalPlanned - totalSpent;
    const overallPercentage = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 1000) / 10 : 0;

    return NextResponse.json({
      sections: sectionsWithSpending,
      totalPlanned,
      totalSpent,
      totalRemaining,
      overallPercentage,
    });
  } catch (err) {
    console.error('GET /api/passover-budget error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות.' }, { status: 429 });
    }

    const result = await validateRequest(request, upsertPassoverSectionSchema);
    if (result.errorResponse) return result.errorResponse;

    const { categoryId, categoryName, plannedAmount, orderIndex, month, year } = result.data;

    let finalCategoryId = categoryId;

    if (categoryId === '__new__' && categoryName) {
      const existingCat = await prisma.customCategory.findFirst({
        where: { userId, name: categoryName, type: 'passover' },
      });
      if (existingCat) {
        finalCategoryId = existingCat.id;
      } else {
        const newCat = await prisma.customCategory.create({
          data: { userId, name: categoryName, type: 'passover' },
        });
        finalCategoryId = newCat.id;
      }
    }

    const section = await prisma.passoverSection.upsert({
      where: {
        userId_month_year_categoryId: {
          userId,
          month,
          year,
          categoryId: finalCategoryId,
        },
      },
      update: {
        ...(plannedAmount !== undefined && { plannedAmount }),
        ...(orderIndex !== undefined && { orderIndex }),
      },
      create: {
        userId,
        month,
        year,
        categoryId: finalCategoryId,
        plannedAmount: plannedAmount ?? 0,
        orderIndex: orderIndex ?? 0,
      },
    });

    return NextResponse.json(section);
  } catch (err) {
    console.error('POST /api/passover-budget error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות.' }, { status: 429 });
    }

    const result = await validateRequest(request, deletePassoverSectionSchema);
    if (result.errorResponse) return result.errorResponse;

    const { sectionId } = result.data;

    const section = await prisma.passoverSection.findFirst({
      where: { id: sectionId, userId },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const { categoryId } = section;

    const userIds = [userId];

    await prisma.$transaction([
      prisma.transaction.updateMany({
        where: { userId: { in: userIds }, category: categoryId, type: 'expense' },
        data: { category: 'other' },
      }),
      prisma.passoverSection.delete({ where: { id: sectionId } }),
      prisma.customCategory.deleteMany({ where: { id: categoryId, userId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/passover-budget error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
