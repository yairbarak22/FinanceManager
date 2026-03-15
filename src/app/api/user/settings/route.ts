import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { monthStartDay: true },
    });

    return NextResponse.json({
      monthStartDay: user?.monthStartDay ?? 1,
    });
  } catch (err) {
    console.error('Error fetching user settings:', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' },
        { status: 429 },
      );
    }

    const data = await request.json();

    const monthStartDay = Number(data.monthStartDay);
    if (!Number.isInteger(monthStartDay) || monthStartDay < 1 || monthStartDay > 28) {
      return NextResponse.json(
        { error: 'monthStartDay must be an integer between 1 and 28' },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { monthStartDay },
    });

    return NextResponse.json({ monthStartDay });
  } catch (err) {
    console.error('Error updating user settings:', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
