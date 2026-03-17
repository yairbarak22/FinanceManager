import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { validateRequest } from '@/lib/validateRequest';
import { bulkCreatePassoverSectionsSchema } from '@/lib/validationSchemas';

const HOSTING_TEMPLATE = [
  'קניות לסופר וחד-פעמי',
  'בשר, עופות ודגים',
  'מצות ויין',
  'ביגוד והנעלה',
  'עזרה וניקיונות לפסח',
  'מתנות לפסח',
  'נסיעות וטיולים בחוה"מ',
];

const GUEST_TEMPLATE = [
  'ביגוד והנעלה',
  'מתנות למארחים',
  'נסיעות',
  'מצות ומתנות',
  'ביגוד ילדים',
  'אחר',
];

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות.' }, { status: 429 });
    }

    const result = await validateRequest(request, bulkCreatePassoverSectionsSchema);
    if (result.errorResponse) return result.errorResponse;

    const { template, month, year } = result.data;
    const names = template === 'hosting' ? HOSTING_TEMPLATE : GUEST_TEMPLATE;

    const existingSections = await prisma.passoverSection.findMany({
      where: { userId, month, year },
      select: { categoryId: true },
    });

    const existingCategoryIds = new Set(existingSections.map(s => s.categoryId));

    const existingPassoverCats = await prisma.customCategory.findMany({
      where: { userId, type: 'passover', name: { in: names } },
      select: { id: true, name: true },
    });
    const existingCatNameMap = new Map(existingPassoverCats.map(c => [c.name, c.id]));

    let newCount = 0;
    const startIndex = existingSections.length;

    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      let categoryId = existingCatNameMap.get(name);

      if (!categoryId) {
        const newCat = await prisma.customCategory.create({
          data: { userId, name, type: 'passover' },
        });
        categoryId = newCat.id;
      }

      if (existingCategoryIds.has(categoryId)) continue;

      await prisma.passoverSection.create({
        data: {
          userId,
          month,
          year,
          categoryId,
          plannedAmount: 0,
          orderIndex: startIndex + newCount,
        },
      });
      newCount++;
    }

    const sections = await prisma.passoverSection.findMany({
      where: { userId, month, year },
      orderBy: { orderIndex: 'asc' },
    });

    const allCategoryIds = sections.map(s => s.categoryId);
    const categories = await prisma.customCategory.findMany({
      where: { id: { in: allCategoryIds } },
      select: { id: true, name: true, icon: true, color: true },
    });
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const enrichedSections = sections.map(s => {
      const cat = categoryMap.get(s.categoryId);
      return {
        id: s.id,
        categoryId: s.categoryId,
        categoryName: cat?.name || s.categoryId,
        categoryIcon: cat?.icon || null,
        categoryColor: cat?.color || null,
        plannedAmount: s.plannedAmount,
        spent: 0,
        remaining: s.plannedAmount,
        percentage: 0,
        orderIndex: s.orderIndex,
      };
    });

    return NextResponse.json({ created: newCount, sections: enrichedSections });
  } catch (err) {
    console.error('POST /api/passover-budget/sections error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
