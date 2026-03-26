import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSegmentUsers, type SegmentFilter } from '@/lib/marketing/segment';
import { sendBatchEmails } from '@/lib/marketing/resend';
import { getSenderDisplay } from '@/lib/inbox/constants';
import { isAuthorizedCronRequest } from '@/lib/cronAuth';

const ISRAEL_TZ = 'Asia/Jerusalem';
const DEFAULT_SEND_HOUR = 10;
const BATCH_SIZE = 100;

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

export const maxDuration = 120;

/**
 * GET /api/cron/smart-send
 *
 * Unified cron that processes all queued campaigns:
 *
 * - SENDING:      standard batch — sends up to BATCH_SIZE per invocation
 * - TESTING:      A/B test batch — sends up to BATCH_SIZE per invocation
 * - SMART_QUEUED: sends to users whose preferredSendHour matches the
 *                 current Israel hour (skips Fri/Sat)
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const israelDay = getIsraelDayOfWeek(now);
    const currentHour = getIsraelHour(now);
    const isShabbat = israelDay === 5 || israelDay === 6;

    const campaigns = await prisma.marketingCampaign.findMany({
      where: { status: { in: ['SENDING', 'TESTING', 'SMART_QUEUED'] } },
    });

    if (campaigns.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    let totalSent = 0;
    let campaignsCompleted = 0;

    for (const campaign of campaigns) {
      try {
        if (!campaign.segmentFilter) continue;

        if (campaign.status === 'SMART_QUEUED') {
          if (isShabbat) continue;
          const sent = await processBatchCampaign(campaign, currentHour);
          totalSent += sent.batchSent;
          if (sent.completed) campaignsCompleted++;
        } else if (campaign.status === 'SENDING') {
          const sent = await processBatchCampaign(campaign, null);
          totalSent += sent.batchSent;
          if (sent.completed) campaignsCompleted++;
        } else if (campaign.status === 'TESTING') {
          const sent = await processBatchCampaign(campaign, null);
          totalSent += sent.batchSent;
          if (sent.completed) campaignsCompleted++;
        }
      } catch (err) {
        console.error(`[Cron Send] Error processing campaign ${campaign.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      currentHour,
      isShabbat,
      campaignsProcessed: campaigns.length,
      campaignsCompleted,
      totalSent,
    });
  } catch (error) {
    console.error('[Cron Send] Cron error:', error);
    return NextResponse.json({ error: 'Failed to process send cron' }, { status: 500 });
  }
}

/**
 * Process one campaign: send a batch of unsent emails.
 *
 * @param smartSendHour - if provided, only send to users whose preferredSendHour
 *                        matches (for SMART_QUEUED). null = send to anyone unsent.
 */
async function processBatchCampaign(
  campaign: { id: string; subject: string; content: string; segmentFilter: unknown; senderEmail: string | null; isAbTest: boolean; variants: unknown; status: string },
  smartSendHour: number | null,
): Promise<{ batchSent: number; completed: boolean }> {
  const allUsers = await getSegmentUsers(campaign.segmentFilter as unknown as SegmentFilter);

  const sentEvents = await prisma.marketingEvent.findMany({
    where: { campaignId: campaign.id, eventType: 'SENT' },
    select: { userId: true },
  });
  const sentUserIds = new Set(sentEvents.map((e) => e.userId));

  let unsent = allUsers.filter(
    (u) => !sentUserIds.has(u.id) && !u.id.startsWith('external-'),
  );

  if (smartSendHour !== null) {
    const userIds = unsent.map((u) => u.id);
    const usersWithPref = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, preferredSendHour: true },
        })
      : [];
    const prefMap = new Map(usersWithPref.map((u) => [u.id, u.preferredSendHour]));

    unsent = unsent.filter((u) => {
      const targetHour = prefMap.get(u.id) ?? DEFAULT_SEND_HOUR;
      return targetHour === smartSendHour;
    });
  }

  if (unsent.length === 0) {
    const totalAll = allUsers.filter((u) => !u.id.startsWith('external-')).length;
    const totalSentCount = sentEvents.length;
    const allDone = totalSentCount >= totalAll;

    if (allDone) {
      await prisma.marketingCampaign.update({
        where: { id: campaign.id },
        data: { status: 'COMPLETED', completedAt: new Date(), sentCount: totalSentCount },
      });
      console.log(`[Cron Send] Campaign ${campaign.id} COMPLETED (${totalSentCount} sent)`);
      return { batchSent: 0, completed: true };
    }
    return { batchSent: 0, completed: false };
  }

  const batch = unsent.slice(0, BATCH_SIZE);

  const fromDisplay = campaign.senderEmail
    ? getSenderDisplay(campaign.senderEmail)
    : undefined;

  const isAbTest = campaign.isAbTest && campaign.status === 'TESTING';
  const variants = isAbTest
    ? (campaign.variants as Array<{ id: string; subject: string; htmlContent: string }>)
    : null;

  const emails = batch.map((user, idx) => {
    const displayName = user.name || 'משתמש';

    if (variants && variants.length === 2) {
      const variant = variants[idx % 2];
      return {
        to: user.email,
        subject: variant.subject.replace(/\[שם המשתמש\]/g, displayName),
        html: variant.htmlContent.replace(/\[שם המשתמש\]/g, displayName),
        campaignId: campaign.id,
        userId: user.id,
        variantId: variant.id,
      };
    }

    return {
      to: user.email,
      subject: campaign.subject.replace(/\[שם המשתמש\]/g, displayName),
      html: campaign.content.replace(/\[שם המשתמש\]/g, displayName),
      campaignId: campaign.id,
      userId: user.id,
    };
  });

  const results = await sendBatchEmails(emails, {
    spreadDurationMinutes: 1,
    from: fromDisplay,
  });

  const eventsToCreate: Array<{
    campaignId: string;
    userId: string;
    emailId: string;
    eventType: 'SENT';
    metadata?: Record<string, string>;
  }> = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (!result.id) continue;
    const ev: (typeof eventsToCreate)[number] = {
      campaignId: campaign.id,
      userId: batch[i].id,
      emailId: result.id,
      eventType: 'SENT' as const,
    };
    const email = emails[i];
    if ('variantId' in email && email.variantId) {
      ev.metadata = { variantId: email.variantId };
    }
    eventsToCreate.push(ev);
  }

  if (eventsToCreate.length > 0) {
    await prisma.marketingEvent.createMany({
      data: eventsToCreate,
      skipDuplicates: true,
    });
  }

  const batchSent = results.filter((r) => r.id).length;

  const totalSentCount = await prisma.marketingEvent.count({
    where: { campaignId: campaign.id, eventType: 'SENT' },
  });
  const totalEligible = allUsers.filter((u) => !u.id.startsWith('external-')).length;
  const allDone = totalSentCount >= totalEligible;

  await prisma.marketingCampaign.update({
    where: { id: campaign.id },
    data: {
      sentCount: totalSentCount,
      ...(allDone ? { status: 'COMPLETED', completedAt: new Date() } : {}),
    },
  });

  console.log(
    `[Cron Send] Campaign ${campaign.id}: sent ${batchSent} (total ${totalSentCount}/${totalEligible})` +
    (allDone ? ' — COMPLETED' : ''),
  );

  return { batchSent, completed: allDone };
}
