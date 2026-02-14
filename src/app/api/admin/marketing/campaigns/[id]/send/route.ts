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
    if (campaign.status === 'SENDING') {
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

    // Update campaign status to SENDING
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

    // Prepare emails
    // Handle both regular users and external emails (from CSV)
    const emails = users.map((user) => ({
      to: user.email,
      subject: campaign.subject,
      html: campaign.content,
      campaignId: campaign.id,
      userId: user.id.startsWith('external-') ? null : user.id, // null for external emails
    }));

    // Send emails in background (don't wait for completion)
    // This allows the API to return quickly
    void (async () => {
      try {
        const results = await sendBatchEmails(emails);

        // Count successful sends
        const successful = results.filter((r) => r.id).length;
        const failed = results.filter((r) => r.error).length;

        // Create marketing events for sent emails
        // IMPORTANT: results[i] corresponds to emails[i] which corresponds to users[i]
        // We iterate WITH the original index to keep the correct user mapping
        const eventsToCreate: Array<{
          campaignId: string;
          userId: string;
          emailId: string;
          eventType: 'SENT';
        }> = [];

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const user = users[i];

          // Skip failed sends (no Resend email ID)
          if (!result.id) continue;

          // Skip events for external emails (they don't have a real userId in the DB)
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

        // Update campaign statistics with real count
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
        // Update status to allow retry
        await prisma.marketingCampaign.update({
          where: { id: campaign.id },
          data: {
            status: 'DRAFT', // Reset to draft so it can be retried
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

