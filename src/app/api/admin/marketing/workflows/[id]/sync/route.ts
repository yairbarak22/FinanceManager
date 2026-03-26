/**
 * Sync Workflow Stats with Resend API
 * Fetches actual email delivery status directly from Resend
 * for all SENT events belonging to a workflow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { MarketingEventType } from '@prisma/client';

const EVENT_HIERARCHY: Record<string, MarketingEventType[]> = {
  sent: [MarketingEventType.SENT],
  delivered: [MarketingEventType.SENT, MarketingEventType.DELIVERED],
  opened: [MarketingEventType.SENT, MarketingEventType.DELIVERED, MarketingEventType.OPENED],
  clicked: [MarketingEventType.SENT, MarketingEventType.DELIVERED, MarketingEventType.OPENED, MarketingEventType.CLICKED],
  bounced: [MarketingEventType.SENT, MarketingEventType.BOUNCED],
  complained: [MarketingEventType.SENT, MarketingEventType.DELIVERED, MarketingEventType.COMPLAINED],
  unsubscribed: [MarketingEventType.SENT, MarketingEventType.DELIVERED, MarketingEventType.UNSUBSCRIBED],
  delivery_delayed: [MarketingEventType.SENT],
  failed: [MarketingEventType.SENT],
  queued: [],
  scheduled: [],
  canceled: [],
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 },
      );
    }

    if (!config.resendApiKey) {
      return NextResponse.json(
        { error: 'Resend API key לא מוגדר' },
        { status: 500 },
      );
    }

    const workflow = await prisma.automationWorkflow.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'תהליך עבודה לא נמצא' },
        { status: 404 },
      );
    }

    const sentEvents = await prisma.marketingEvent.findMany({
      where: {
        workflowId: id,
        eventType: MarketingEventType.SENT,
      },
      select: {
        emailId: true,
        userId: true,
        nodeId: true,
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

    const BATCH_SIZE = 10;
    for (let i = 0; i < sentEvents.length; i += BATCH_SIZE) {
      const batch = sentEvents.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (event) => {
          if (!event.emailId) return;

          try {
            const emailData = await resend.emails.get(event.emailId);

            if (emailData.error || !emailData.data) {
              console.warn(`[WorkflowSync] Failed to fetch email ${event.emailId}:`, emailData.error);
              return;
            }

            const lastEvent = emailData.data.last_event;
            const impliedEvents = EVENT_HIERARCHY[lastEvent] || [];

            for (const eventType of impliedEvents) {
              if (eventType === MarketingEventType.SENT) continue;

              const existing = await prisma.marketingEvent.findFirst({
                where: {
                  workflowId: id,
                  userId: event.userId,
                  emailId: event.emailId,
                  eventType,
                },
              });

              if (!existing) {
                await prisma.marketingEvent.create({
                  data: {
                    workflowId: id,
                    nodeId: event.nodeId,
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
            console.error(`[WorkflowSync] Error fetching email ${event.emailId}:`, err);
            errors++;
          }
        }),
      );

      if (i + BATCH_SIZE < sentEvents.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      success: true,
      message: `סונכרנו ${synced} מיילים${errors > 0 ? `, ${errors} שגיאות` : ''}`,
      synced,
      errors,
    });
  } catch (error) {
    console.error('[WorkflowSync] Unexpected error:', error);
    return NextResponse.json(
      { error: 'שגיאה בסנכרון עם Resend' },
      { status: 500 },
    );
  }
}
