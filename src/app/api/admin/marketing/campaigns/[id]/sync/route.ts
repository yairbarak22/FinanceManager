/**
 * Sync Campaign Stats with Resend API
 * Fetches actual email delivery status directly from Resend
 * Works even on localhost (unlike webhooks)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { MarketingEventType } from '@prisma/client';

// Map Resend last_event to our MarketingEventType hierarchy
// Events are ordered: sent → delivered → opened → clicked
// If last_event is "clicked", we know it was also opened & delivered
const EVENT_HIERARCHY: Record<string, MarketingEventType[]> = {
  sent: [MarketingEventType.SENT],
  delivered: [MarketingEventType.SENT, MarketingEventType.DELIVERED],
  opened: [MarketingEventType.SENT, MarketingEventType.DELIVERED, MarketingEventType.OPENED],
  clicked: [MarketingEventType.SENT, MarketingEventType.DELIVERED, MarketingEventType.OPENED, MarketingEventType.CLICKED],
  bounced: [MarketingEventType.SENT, MarketingEventType.BOUNCED],
  complained: [MarketingEventType.SENT, MarketingEventType.DELIVERED, MarketingEventType.COMPLAINED],
  delivery_delayed: [MarketingEventType.SENT],
  failed: [MarketingEventType.SENT],
  queued: [],
  scheduled: [],
  canceled: [],
};

/**
 * POST - Sync campaign stats from Resend API
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

    if (!config.resendApiKey) {
      return NextResponse.json(
        { error: 'Resend API key לא מוגדר' },
        { status: 500 }
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

    // Get all SENT events (these have the Resend emailId)
    const sentEvents = await prisma.marketingEvent.findMany({
      where: {
        campaignId: id,
        eventType: MarketingEventType.SENT,
      },
      select: {
        emailId: true,
        userId: true,
      },
    });

    if (sentEvents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'אין מיילים לסנכרן',
        synced: 0,
      });
    }

    const resend = new Resend(config.resendApiKey);
    let synced = 0;
    let errors = 0;

    // Fetch status for each email from Resend API
    // Process in batches of 10 to avoid rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < sentEvents.length; i += BATCH_SIZE) {
      const batch = sentEvents.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (event) => {
          if (!event.emailId) return;

          try {
            const emailData = await resend.emails.get(event.emailId);

            if (emailData.error || !emailData.data) {
              console.warn(`[Sync] Failed to fetch email ${event.emailId}:`, emailData.error);
              return;
            }

            const lastEvent = emailData.data.last_event;
            const impliedEvents = EVENT_HIERARCHY[lastEvent] || [];

            // Create any missing events based on the last_event hierarchy
            for (const eventType of impliedEvents) {
              // Skip SENT - we already have it
              if (eventType === MarketingEventType.SENT) continue;

              // Check if event already exists
              const existing = await prisma.marketingEvent.findFirst({
                where: {
                  campaignId: id,
                  userId: event.userId,
                  emailId: event.emailId,
                  eventType,
                },
              });

              if (!existing) {
                await prisma.marketingEvent.create({
                  data: {
                    campaignId: id,
                    userId: event.userId,
                    emailId: event.emailId,
                    eventType,
                    metadata: {
                      source: 'api_sync',
                      resendLastEvent: lastEvent,
                    },
                    timestamp: new Date(),
                  },
                });
              }
            }

            synced++;
          } catch (err) {
            console.error(`[Sync] Error fetching email ${event.emailId}:`, err);
            errors++;
          }
        })
      );

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < sentEvents.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Update campaign counters from real event counts
    const eventCounts = await prisma.marketingEvent.groupBy({
      by: ['eventType'],
      where: { campaignId: id },
      _count: { id: true },
    });

    const countMap: Record<string, number> = {};
    for (const ec of eventCounts) {
      countMap[ec.eventType] = ec._count.id;
    }

    await prisma.marketingCampaign.update({
      where: { id },
      data: {
        sentCount: countMap['SENT'] ?? 0,
        openCount: countMap['OPENED'] ?? 0,
        clickCount: countMap['CLICKED'] ?? 0,
        bounceCount: countMap['BOUNCED'] ?? 0,
        complaintCount: countMap['COMPLAINED'] ?? 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: `סונכרנו ${synced} מיילים${errors > 0 ? `, ${errors} שגיאות` : ''}`,
      synced,
      errors,
      stats: {
        sent: countMap['SENT'] ?? 0,
        delivered: countMap['DELIVERED'] ?? 0,
        opened: countMap['OPENED'] ?? 0,
        clicked: countMap['CLICKED'] ?? 0,
        bounced: countMap['BOUNCED'] ?? 0,
        complained: countMap['COMPLAINED'] ?? 0,
      },
    });
  } catch (error) {
    console.error('[Sync] Unexpected error:', error);
    return NextResponse.json(
      { error: 'שגיאה בסנכרון עם Resend' },
      { status: 500 }
    );
  }
}

