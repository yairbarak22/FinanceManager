import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { saveCurrentMonthNetWorth } from '@/lib/netWorthHistory';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'שם הגמ"ח נדרש' }, { status: 400 });
    }

    if (body.name.length > 100) {
      return NextResponse.json({ error: 'שם ארוך מדי (מקסימום 100 תווים)' }, { status: 400 });
    }

    if (typeof body.monthlyDeposit !== 'number' || body.monthlyDeposit <= 0) {
      return NextResponse.json({ error: 'סכום חודשי חייב להיות מספר חיובי' }, { status: 400 });
    }

    if (typeof body.totalMonths !== 'number' || body.totalMonths <= 0 || !Number.isInteger(body.totalMonths)) {
      return NextResponse.json({ error: 'מספר חודשים כולל חייב להיות מספר שלם חיובי' }, { status: 400 });
    }

    if (typeof body.monthsAlreadyPaid !== 'number' || body.monthsAlreadyPaid < 0 || !Number.isInteger(body.monthsAlreadyPaid)) {
      return NextResponse.json({ error: 'מספר חודשים ששולמו חייב להיות מספר שלם לא-שלילי' }, { status: 400 });
    }

    if (body.monthsAlreadyPaid > body.totalMonths) {
      return NextResponse.json({ error: 'מספר חודשים ששולמו לא יכול לעלות על מספר החודשים הכולל' }, { status: 400 });
    }

    const { name, monthlyDeposit, totalMonths, monthsAlreadyPaid } = body;
    const gemachId = randomUUID();

    // Calculate values
    const assetValue = monthsAlreadyPaid * monthlyDeposit;
    const liabilityValue = (totalMonths - monthsAlreadyPaid) * monthlyDeposit;
    const totalAmount = totalMonths * monthlyDeposit;
    const gemachName = `${name.trim()} (גמ"ח)`;

    // Use Prisma transaction to atomically create both records
    const [asset, liability] = await prisma.$transaction([
      prisma.asset.create({
        data: {
          userId,
          name: gemachName,
          category: 'gemach',
          value: assetValue,
          liquidity: 'locked',
          gemachId,
        },
      }),
      prisma.liability.create({
        data: {
          userId,
          name: gemachName,
          type: 'gemach',
          totalAmount,
          monthlyPayment: monthlyDeposit,
          remainingAmount: liabilityValue,
          interestRate: 0,
          loanTermMonths: totalMonths,
          loanMethod: 'spitzer',
          hasInterestRebate: false,
          isActiveInCashFlow: true,
          gemachId,
        },
      }),
    ]);

    // Update net worth history for current month
    await saveCurrentMonthNetWorth(userId);

    // Audit log: gemach created
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.CREATE,
      entityType: 'GemachPlan',
      entityId: gemachId,
      metadata: {
        assetId: asset.id,
        liabilityId: liability.id,
        assetValue,
        liabilityValue,
        totalAmount,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      gemachId,
      asset,
      liability,
    });
  } catch (error) {
    console.error('Error creating gemach plan:', error);
    return NextResponse.json({ error: 'שגיאה ביצירת תוכנית גמ"ח' }, { status: 500 });
  }
}

