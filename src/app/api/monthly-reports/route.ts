import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { calculateMonthlyReport, calculateUpcomingObligations } from '@/lib/monthlyReport/calculations';
import { canCreateReport } from '@/lib/monthlyReport/validation';
import { generateMonthlyInsights } from '@/lib/ai/monthlyInsights';

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const reports = await prisma.monthlyReport.findMany({
      where: { userId },
      select: {
        id: true,
        monthKey: true,
        netCashflow: true,
        totalIncome: true,
        totalExpenses: true,
        netWorth: true,
        createdAt: true,
      },
      orderBy: { monthKey: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (err) {
    console.error('Error fetching monthly reports:', err);
    return NextResponse.json(
      { error: 'Failed to fetch monthly reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const body = await request.json();
    const { monthKey } = body;

    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return NextResponse.json(
        { error: 'monthKey is required (format: YYYY-MM)' },
        { status: 400 }
      );
    }

    // Check if report already exists
    const { canCreate, existingReportId } = await canCreateReport(userId, monthKey);
    if (!canCreate) {
      return NextResponse.json(
        { error: 'כבר קיים דוח לחודש זה', existingReportId },
        { status: 409 }
      );
    }

    // Calculate all report data
    const reportData = await calculateMonthlyReport(userId, monthKey);

    // Calculate upcoming obligations
    const obligations = await calculateUpcomingObligations(userId, monthKey);

    // Generate AI insights asynchronously - don't block report creation on failure
    const aiInsights = await generateMonthlyInsights({
      monthKey: reportData.monthKey,
      totalIncome: reportData.totalIncome,
      totalExpenses: reportData.totalExpenses,
      netCashflow: reportData.netCashflow,
      categoryBreakdown: reportData.categoryBreakdown,
      goalsProgress: reportData.goalsProgress,
      netWorth: reportData.netWorth,
      isFirstMonth: reportData.isFirstMonth,
    });

    // Save report to DB
    const report = await prisma.monthlyReport.create({
      data: {
        userId,
        monthKey,
        netCashflow: reportData.netCashflow,
        totalIncome: reportData.totalIncome,
        totalExpenses: reportData.totalExpenses,
        aiInsights: aiInsights as object,
        categoryBreakdown: JSON.parse(JSON.stringify(reportData.categoryBreakdown)),
        goalsProgress: JSON.parse(JSON.stringify(reportData.goalsProgress)),
        netWorth: reportData.netWorth,
        totalAssets: reportData.totalAssets,
        totalLiabilities: reportData.totalLiabilities,
        upcomingObligations: JSON.parse(JSON.stringify(obligations)),
      },
    });

    return NextResponse.json({
      ...report,
      transactions: reportData.transactions,
      isFirstMonth: reportData.isFirstMonth,
    });
  } catch (err) {
    console.error('Error creating monthly report:', err);
    return NextResponse.json(
      { error: 'Failed to create monthly report' },
      { status: 500 }
    );
  }
}
