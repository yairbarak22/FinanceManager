import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSegmentUsers, type SegmentFilter } from '@/lib/marketing/segment';
import { sendBatchEmails } from '@/lib/marketing/resend';
import { getSenderDisplay } from '@/lib/inbox/constants';

const ISRAEL_TZ = 'Asia/Jerusalem';
const DEFAULT_SEND_HOUR = 10;

function getIsraelHour(date: Date): number {
  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: ISRAEL_TZ,
    hour: 'numeric',
    hour12: false,
  }).format(date);
  return parseInt(hourStr, 10) % 24;
}

function getIsraelDayOfWeek(date: Date): number {
  const dayName = new Intl.DateTimeFormat('en-US', {
    timeZone: ISRAEL_TZ,
    weekday: 'long',
  }).format(date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.indexOf(dayName);
}

/**
 * GET /api/cron/smart-send
 *
 * Processes SMART_QUEUED campaigns: for each campaign, finds users whose
 * preferredSendHour matches the current Israel hour and sends them the email.
 * Users without preferredSendHour get sent at DEFAULT_SEND_HOUR (10:00).
 * Skips Friday/Saturday (Israel time).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const israelDay = getIsraelDayOfWeek(now);

    if (israelDay === 5 || israelDay === 6) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'שישי/שבת — לא נשלחים מיילים',
      });
    }

    const currentHour = getIsraelHour(now);

    const campaigns = await prisma.marketingCampaign.findMany({
      where: { status: 'SMART_QUEUED' },
    });

    if (campaigns.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    let totalSent = 0;
    let campaignsCompleted = 0;

    for (const campaign of campaigns) {
      try {
        if (!campaign.segmentFilter) continue;

        const allUsers = await getSegmentUsers(
          campaign.segmentFilter as unknown as SegmentFilter,
        );

        const sentEvents = await prisma.marketingEvent.findMany({
          where: { campaignId: campaign.id, eventType: 'SENT' },
          select: { userId: true },
        });
        const sentUserIds = new Set(sentEvents.map((e) => e.userId));

        const unsent = allUsers.filter(
          (u) => !sentUserIds.has(u.id) && !u.id.startsWith('external-'),
        );

        if (unsent.length === 0) {
          const totalSentCount = await prisma.marketingEvent.count({
            where: { campaignId: campaign.id, eventType: 'SENT' },
          });
          await prisma.marketingCampaign.update({
            where: { id: campaign.id },
            data: { status: 'COMPLETED', completedAt: new Date(), sentCount: totalSentCount },
          });
          campaignsCompleted++;
          continue;
        }

        const userIds = unsent.map((u) => u.id);
        const usersWithPref = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, preferredSendHour: true },
        });
        const prefMap = new Map(usersWithPref.map((u) => [u.id, u.preferredSendHour]));

        const usersToSendNow = unsent.filter((u) => {
          const pref = prefMap.get(u.id);
          const targetHour = pref ?? DEFAULT_SEND_HOUR;
          return targetHour === currentHour;
        });

        if (usersToSendNow.length === 0) continue;

        const fromDisplay = campaign.senderEmail
          ? getSenderDisplay(campaign.senderEmail)
          : undefined;

        const emails = usersToSendNow.map((user) => {
          const displayName = user.name || 'משתמש';
          return {
            to: user.email,
            subject: campaign.subject.replace(/\[שם המשתמש\]/g, displayName),
            html: campaign.content.replace(/\[שם המשתמש\]/g, displayName),
            campaignId: campaign.id,
            userId: user.id,
          };
        });

        const results = await sendBatchEmails(emails, {
          spreadDurationMinutes: 5,
          from: fromDisplay,
        });

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
            userId: usersToSendNow[i].id,
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

        const batchSent = results.filter((r) => r.id).length;
        totalSent += batchSent;

        const totalSentCount = await prisma.marketingEvent.count({
          where: { campaignId: campaign.id, eventType: 'SENT' },
        });
        const allDone = totalSentCount >= allUsers.filter((u) => !u.id.startsWith('external-')).length;

        await prisma.marketingCampaign.update({
          where: { id: campaign.id },
          data: {
            sentCount: totalSentCount,
            ...(allDone ? { status: 'COMPLETED', completedAt: new Date() } : {}),
          },
        });

        if (allDone) campaignsCompleted++;

        console.log(
          `[Smart Send] Campaign ${campaign.id}: sent ${batchSent} at hour ${currentHour}` +
          (allDone ? ' — COMPLETED' : ` — ${unsent.length - batchSent} remaining`),
        );
      } catch (err) {
        console.error(`[Smart Send] Error processing campaign ${campaign.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      currentHour,
      campaignsProcessed: campaigns.length,
      campaignsCompleted,
      totalSent,
    });
  } catch (error) {
    console.error('[Smart Send] Cron error:', error);
    return NextResponse.json({ error: 'Failed to process smart send' }, { status: 500 });
  }
}
