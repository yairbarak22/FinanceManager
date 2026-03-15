import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSegmentUsers, type SegmentFilter } from '@/lib/marketing/segment';
import { sendBatchEmails } from '@/lib/marketing/resend';

/**
 * GET /api/cron/evaluate-ab-tests
 *
 * Evaluates A/B test campaigns whose testing window has expired.
 * Determines the winning variant, sends it to the remaining users,
 * and marks the campaign as COMPLETED.
 *
 * Protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = Date.now();

    const testingCampaigns = await prisma.marketingCampaign.findMany({
      where: { status: 'TESTING' },
    });

    if (testingCampaigns.length === 0) {
      return NextResponse.json({ success: true, evaluated: 0 });
    }

    let evaluated = 0;
    let errors = 0;

    for (const campaign of testingCampaigns) {
      try {
        if (!campaign.startedAt) {
          console.warn(`[A/B Eval] Campaign ${campaign.id} has no startedAt, skipping`);
          continue;
        }

        const durationMs = (campaign.abTestDurationHours ?? 0) * 60 * 60 * 1000;
        const expiresAt = campaign.startedAt.getTime() + durationMs;

        if (now < expiresAt) continue; // Not yet expired

        const variants = campaign.variants as Array<{ id: string; subject: string; htmlContent: string }> | null;
        if (!variants || variants.length !== 2) {
          console.error(`[A/B Eval] Campaign ${campaign.id} has invalid variants`);
          errors++;
          continue;
        }

        // Fetch all events for this campaign
        const events = await prisma.marketingEvent.findMany({
          where: { campaignId: campaign.id },
          select: { eventType: true, emailId: true, metadata: true },
        });

        // Group events by variant
        const variantStats: Record<string, { sent: Set<string>; opened: Set<string>; clicked: Set<string> }> = {
          A: { sent: new Set(), opened: new Set(), clicked: new Set() },
          B: { sent: new Set(), opened: new Set(), clicked: new Set() },
        };

        for (const ev of events) {
          const meta = ev.metadata as Record<string, unknown> | null;
          const vid = meta?.variantId as string | undefined;
          if (!vid || !variantStats[vid]) continue;

          const eid = ev.emailId;
          if (ev.eventType === 'SENT') variantStats[vid].sent.add(eid);
          else if (ev.eventType === 'OPENED') variantStats[vid].opened.add(eid);
          else if (ev.eventType === 'CLICKED') variantStats[vid].clicked.add(eid);
        }

        const metric = campaign.abTestWinningMetric ?? 'OPEN_RATE';

        const score = (vid: string): number => {
          const stats = variantStats[vid];
          const sentCount = stats.sent.size;
          if (sentCount === 0) return 0;
          if (metric === 'CLICK_RATE') return (stats.clicked.size / sentCount) * 100;
          return (stats.opened.size / sentCount) * 100;
        };

        const scoreA = score('A');
        const scoreB = score('B');
        const winningVariantId = scoreA >= scoreB ? 'A' : 'B';
        const winningVariant = variants.find((v) => v.id === winningVariantId)!;

        console.log(`[A/B Eval] Campaign ${campaign.id}: A=${scoreA.toFixed(1)}%, B=${scoreB.toFixed(1)}%, winner=${winningVariantId}`);

        // Get remaining users who haven't received the email yet
        if (!campaign.segmentFilter) {
          console.error(`[A/B Eval] Campaign ${campaign.id} has no segmentFilter`);
          errors++;
          continue;
        }

        const allUsers = await getSegmentUsers(campaign.segmentFilter as unknown as SegmentFilter);

        const sentEvents = await prisma.marketingEvent.findMany({
          where: { campaignId: campaign.id, eventType: 'SENT' },
          select: { userId: true },
        });
        const sentUserIds = new Set(sentEvents.map((e) => e.userId));

        const remainingUsers = allUsers.filter(
          (u) => !sentUserIds.has(u.id) && !u.id.startsWith('external-'),
        );

        if (remainingUsers.length > 0) {
          const emails = remainingUsers.map((user) => {
            const displayName = user.name || 'משתמש';
            return {
              to: user.email,
              subject: winningVariant.subject.replace(/\[שם המשתמש\]/g, displayName),
              html: winningVariant.htmlContent.replace(/\[שם המשתמש\]/g, displayName),
              campaignId: campaign.id,
              userId: user.id,
            };
          });

          const results = await sendBatchEmails(emails);

          const eventsToCreate: Array<{
            campaignId: string;
            userId: string;
            emailId: string;
            eventType: 'SENT';
          }> = [];

          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (!result.id) continue;
            eventsToCreate.push({
              campaignId: campaign.id,
              userId: remainingUsers[i].id,
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

          const successful = results.filter((r) => r.id).length;
          console.log(`[A/B Eval] Campaign ${campaign.id}: Sent winning variant to ${successful}/${remainingUsers.length} remaining users`);
        }

        // Finalize campaign
        const totalSent = await prisma.marketingEvent.count({
          where: { campaignId: campaign.id, eventType: 'SENT' },
        });

        await prisma.marketingCampaign.update({
          where: { id: campaign.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            winningVariantId,
            sentCount: totalSent,
          },
        });

        evaluated++;
        console.log(`[A/B Eval] Campaign ${campaign.id} completed. Winner: ${winningVariantId}`);
      } catch (err) {
        errors++;
        console.error(`[A/B Eval] Error evaluating campaign ${campaign.id}:`, err);
      }
    }

    return NextResponse.json({ success: true, evaluated, errors });
  } catch (error) {
    console.error('[A/B Eval] Cron error:', error);
    return NextResponse.json({ error: 'Failed to evaluate A/B tests' }, { status: 500 });
  }
}
