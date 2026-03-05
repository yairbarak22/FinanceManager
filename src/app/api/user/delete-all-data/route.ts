import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function DELETE() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`delete-all:${userId}`, RATE_LIMITS.auth);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    // Delete in dependency order to avoid FK constraint violations
    await prisma.assetValueHistory.deleteMany({
      where: { asset: { userId } },
    });
    await prisma.financialGoal.deleteMany({ where: { userId } });
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.recurringTransaction.deleteMany({ where: { userId } });
    await prisma.asset.deleteMany({ where: { userId } });
    await prisma.liability.deleteMany({ where: { userId } });
    await prisma.netWorthHistory.deleteMany({ where: { userId } });
    await prisma.holding.deleteMany({ where: { userId } });
    await prisma.document.deleteMany({ where: { userId } });
    await prisma.customCategory.deleteMany({ where: { userId } });
    await prisma.maaserPreference.deleteMany({ where: { userId } });
    await prisma.merchantCategoryMap.deleteMany({ where: { userId } });
    await prisma.monthlyReport.deleteMany({ where: { userId } });
    await prisma.userProfile.deleteMany({ where: { userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting all user data:', error);
    return NextResponse.json({ error: 'שגיאה במחיקת הנתונים' }, { status: 500 });
  }
}
