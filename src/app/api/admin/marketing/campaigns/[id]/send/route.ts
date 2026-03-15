import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { getSegmentUsers, validateSegmentFilter, type SegmentFilter } from '@/lib/marketing/segment';
import { sendBatchEmails } from '@/lib/marketing/resend';
import { config } from '@/lib/config';

/**
 * POST - Send campaign
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
    if (campaign.status === 'SENDING' || campaign.status === 'TESTING') {
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

    console.log('[Campaign Send] Validating segment filter', {
      campaignId: id,
      segmentFilterType: (campaign.segmentFilter as unknown as SegmentFilter)?.type,
    });

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

    // Get users matching segment
    console.log('[Campaign Send] Getting segment users', {
      campaignId: id,
      segmentFilterType: (campaign.segmentFilter as unknown as SegmentFilter).type,
    });

    let users;
    try {
      users = await getSegmentUsers(campaign.segmentFilter as unknown as SegmentFilter);
      console.log('[Campaign Send] Found users', {
        campaignId: id,
        userCount: users.length,
      });
    } catch (error) {
      console.error('[Campaign Send] Error getting segment users', {
        campaignId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
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

      // Fisher-Yates shuffle for fair randomization
      const shuffledUsers = [...users];
      for (let i = shuffledUsers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledUsers[i], shuffledUsers[j]] = [shuffledUsers[j], shuffledUsers[i]];
      }

      const halfTest = Math.floor(testGroupSize / 2);
      const groupA = shuffledUsers.slice(0, halfTest);
      const groupB = shuffledUsers.slice(halfTest, halfTest * 2);

      // Update campaign status to TESTING
      try {
        await prisma.marketingCampaign.update({
          where: { id },
          data: { status: 'TESTING', startedAt: new Date() },
        });
        console.log('[Campaign Send] A/B test started', { campaignId: id, groupA: groupA.length, groupB: groupB.length });
      } catch (error) {
        console.error('[Campaign Send] Error updating campaign status', {
          campaignId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return NextResponse.json({ error: 'שגיאה בעדכון סטטוס הקמפיין' }, { status: 500 });
      }

      const makeEmails = (
        group: typeof users,
        variant: { id: string; subject: string; htmlContent: string },
      ) =>
        group.map((user) => {
          const displayName = user.name || 'משתמש';
          return {
            to: user.email,
            subject: variant.subject.replace(/\[שם המשתמש\]/g, displayName),
            html: variant.htmlContent.replace(/\[שם המשתמש\]/g, displayName),
            campaignId: campaign.id,
            userId: user.id.startsWith('external-') ? null : user.id,
            variantId: variant.id,
          };
        });

      const emailsA = makeEmails(groupA, variants[0]);
      const emailsB = makeEmails(groupB, variants[1]);

      // Send in background
      void (async () => {
        try {
          const allEmails = [...emailsA, ...emailsB];
          const allUsers = [...groupA, ...groupB];
          const results = await sendBatchEmails(allEmails);

          const successful = results.filter((r) => r.id).length;
          const failed = results.filter((r) => r.error).length;

          const eventsToCreate: Array<{
            campaignId: string;
            userId: string;
            emailId: string;
            eventType: 'SENT';
            metadata: Record<string, string>;
          }> = [];

          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const user = allUsers[i];
            const email = allEmails[i];

            if (!result.id) continue;
            if (user.id.startsWith('external-')) continue;

            eventsToCreate.push({
              campaignId: campaign.id,
              userId: user.id,
              emailId: result.id,
              eventType: 'SENT' as const,
              metadata: { variantId: email.variantId },
            });
          }

          if (eventsToCreate.length > 0) {
            await prisma.marketingEvent.createMany({
              data: eventsToCreate,
              skipDuplicates: true,
            });
          }

          await prisma.marketingCampaign.update({
            where: { id: campaign.id },
            data: { sentCount: successful },
          });

          console.log(`[Campaign A/B] ${campaign.id} test sent: ${successful} successful, ${failed} failed`);
        } catch (error) {
          console.error(`[Campaign A/B] Error sending ${campaign.id}:`, error);
          await prisma.marketingCampaign.update({
            where: { id: campaign.id },
            data: { status: 'DRAFT' },
          });
        }
      })();

      return NextResponse.json({
        success: true,
        message: `בדיקת A/B התחילה: ${groupA.length} משתמשים קיבלו וריאנט A, ${groupB.length} קיבלו וריאנט B`,
        testGroupSize: groupA.length + groupB.length,
        totalUsers: users.length,
      });
    }

    // ─── Standard Send Path ──────────────────────────────────────────
    try {
      await prisma.marketingCampaign.update({
        where: { id },
        data: {
          status: 'SENDING',
          startedAt: new Date(),
        },
      });
      console.log('[Campaign Send] Campaign status updated to SENDING', { campaignId: id });
    } catch (error) {
      console.error('[Campaign Send] Error updating campaign status', {
        campaignId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return NextResponse.json(
        { error: 'שגיאה בעדכון סטטוס הקמפיין' },
        { status: 500 }
      );
    }

    const emails = users.map((user) => {
      const displayName = user.name || 'משתמש';
      return {
        to: user.email,
        subject: campaign.subject.replace(/\[שם המשתמש\]/g, displayName),
        html: campaign.content.replace(/\[שם המשתמש\]/g, displayName),
        campaignId: campaign.id,
        userId: user.id.startsWith('external-') ? null : user.id,
      };
    });

    void (async () => {
      try {
        const results = await sendBatchEmails(emails);

        const successful = results.filter((r) => r.id).length;
        const failed = results.filter((r) => r.error).length;

        const eventsToCreate: Array<{
          campaignId: string;
          userId: string;
          emailId: string;
          eventType: 'SENT';
        }> = [];

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const user = users[i];

          if (!result.id) continue;
          if (user.id.startsWith('external-')) continue;

          eventsToCreate.push({
            campaignId: campaign.id,
            userId: user.id,
            emailId: result.id,
            eventType: 'SENT' as const,
          });
        }

        if (eventsToCreate.length > 0) {
          await prisma.marketingEvent.createMany({
            data: eventsToCreate,
            skipDuplicates: true,
          });
        }

        await prisma.marketingCampaign.update({
          where: { id: campaign.id },
          data: {
            sentCount: successful,
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        console.log(`[Campaign] ${campaign.id} sent: ${successful} successful, ${failed} failed`);
      } catch (error) {
        console.error(`[Campaign] Error sending ${campaign.id}:`, error);
        await prisma.marketingCampaign.update({
          where: { id: campaign.id },
          data: {
            status: 'DRAFT',
          },
        });
      }
    })();

    return NextResponse.json({
      success: true,
      message: `הקמפיין התחיל להישלח ל-${users.length} משתמשים`,
      userCount: users.length,
    });
  } catch (error) {
    // Try to get id from params if available, otherwise use 'unknown'
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

