import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';
import { mergeDashboardLayout } from '@/lib/dashboardLayout';
import { DEFAULT_DASHBOARD_CONFIG } from '@/types/dashboardConfig';

const SECTION_IDS = DEFAULT_DASHBOARD_CONFIG.map((c) => c.id);

const layoutItemSchema = z.object({
  id: z.enum(SECTION_IDS as [string, ...string[]]),
  isVisible: z.boolean(),
  order: z.number().int().min(0),
});

const layoutSchema = z
  .array(layoutItemSchema)
  .refine(
    (arr) => {
      const ids = arr.map((a) => a.id);
      return new Set(ids).size === ids.length && ids.length === SECTION_IDS.length;
    },
    { message: 'Must include every section exactly once' },
  );

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dashboardLayout: true },
    });

    const layout = mergeDashboardLayout(user?.dashboardLayout);
    return NextResponse.json({ layout });
  } catch {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = layoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { dashboardLayout: parsed.data },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'שגיאת שרת פנימית' }, { status: 500 });
  }
}
