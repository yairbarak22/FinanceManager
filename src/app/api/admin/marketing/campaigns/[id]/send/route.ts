import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { getSegmentUsers, validateSegmentFilter, type SegmentFilter } from '@/lib/marketing/segment';
import { config } from '@/lib/config';

/**
 * POST - Queue campaign for sending.
 *
 * Validates the campaign and marks it as SENDING (or TESTING / SMART_QUEUED).
 * Actual email delivery is handled by the cron at /api/cron/smart-send which
 * picks up campaigns in SENDING / SMART_QUEUED / TESTING status and sends
 * them in small batches across multiple invocations (serverless-safe).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Get campaign
    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'קמפיין לא נמצא' },
        { status: 404 }
      );
    }

    // Check status
    if (campaign.status === 'SENDING' || campaign.status === 'TESTING' || campaign.status === 'SMART_QUEUED') {
      return NextResponse.json(
        { error: 'הקמפיין כבר בשליחה' },
        { status: 400 }
      );
    }

    if (campaign.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'הקמפיין כבר הושלם' },
        { status: 400 }
      );
    }

    // Check Resend API key
    if (!config.resendApiKey) {
      console.error('[Campaign Send] Resend API key not configured');
      return NextResponse.json(
        { error: 'Resend API key לא מוגדר. נא להגדיר RESEND_API_KEY במשתני הסביבה.' },
        { status: 500 }
      );
    }

    // Validate segment filter
    if (!campaign.segmentFilter) {
      console.error('[Campaign Send] Campaign segmentFilter is null', { campaignId: id });
      return NextResponse.json(
        { error: 'פילטר קהל לא מוגדר לקמפיין' },
        { status: 400 }
      );
    }

    if (!validateSegmentFilter(campaign.segmentFilter)) {
      console.error('[Campaign Send] Invalid segment filter', {
        campaignId: id,
        segmentFilter: campaign.segmentFilter,
      });
      return NextResponse.json(
        { error: 'פילטר קהל לא תקין' },
        { status: 400 }
      );
    }

    // Verify there are matching users
    let users;
    try {
      users = await getSegmentUsers(campaign.segmentFilter as unknown as SegmentFilter);
    } catch (error) {
      console.error('[Campaign Send] Error getting segment users', {
        campaignId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return NextResponse.json(
        { error: 'שגיאה בקבלת רשימת המשתמשים' },
        { status: 500 }
      );
    }

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'לא נמצאו משתמשים מתאימים לקמפיין' },
        { status: 400 }
      );
    }

    // ─── A/B Test Path ────────────────────────────────────────────────
    if (campaign.isAbTest) {
      if (!campaign.abTestPercentage || !campaign.abTestDurationHours || !campaign.abTestWinningMetric || !campaign.variants) {
        return NextResponse.json(
          { error: 'שדות A/B חסרים בקמפיין' },
          { status: 400 }
        );
      }

      const variants = campaign.variants as Array<{ id: string; subject: string; htmlContent: string }>;
      if (variants.length !== 2) {
        return NextResponse.json(
          { error: 'בדיקת A/B דורשת בדיוק 2 וריאנטים' },
          { status: 400 }
        );
      }

      const testGroupSize = Math.floor(users.length * (campaign.abTestPercentage / 100));
      if (testGroupSize < 2) {
        return NextResponse.json(
          { error: 'קבוצת הבדיקה קטנה מדי. נדרשים לפחות 2 משתמשים.' },
          { status: 400 }
        );
      }

      await prisma.marketingCampaign.update({
        where: { id },
        data: { status: 'TESTING', startedAt: new Date() },
      });

      console.log('[Campaign Send] A/B test queued for cron processing', { campaignId: id, userCount: users.length });

      return NextResponse.json({
        success: true,
        message: `בדיקת A/B נכנסה לתור — ${users.length} משתמשים`,
        totalUsers: users.length,
      });
    }

    // ─── Smart Send Path ───────────────────────────────────────────────
    if (body.sendMode === 'smart') {
      await prisma.marketingCampaign.update({
        where: { id },
        data: {
          status: 'SMART_QUEUED',
          sendMode: 'smart',
          startedAt: new Date(),
        },
      });

      console.log('[Campaign Send] Smart Send queued', { campaignId: id, userCount: users.length });

      return NextResponse.json({
        success: true,
        message: `הקמפיין ישלח בהדרגה לפי שעות פתיחה אישיות ל-${users.length} משתמשים`,
        userCount: users.length,
      });
    }

    // ─── Standard Send Path (cron-driven) ────────────────────────────
    await prisma.marketingCampaign.update({
      where: { id },
      data: {
        status: 'SENDING',
        sendMode: 'instant',
        startedAt: new Date(),
      },
    });

    console.log('[Campaign Send] Campaign queued for cron batch sending', {
      campaignId: id,
      userCount: users.length,
    });

    return NextResponse.json({
      success: true,
      message: `הקמפיין נכנס לתור שליחה — ${users.length} נמענים`,
      userCount: users.length,
    });
  } catch (error) {
    let campaignId = 'unknown';
    try {
      const { id } = await params;
      campaignId = id;
    } catch {
      // params might not be available in error case
    }
    
    console.error('[Campaign Send] Unexpected error', {
      campaignId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'שגיאה בשליחת הקמפיין',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

