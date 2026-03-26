/**
 * Resend Webhook Handler for Marketing Events
 * Receives webhook events from Resend and updates campaign statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { config } from '@/lib/config';
import { prisma } from '@/lib/prisma';
import { MarketingEventType } from '@prisma/client';
import { validateWebhookSecurity } from '@/lib/webhookSecurity';

// Lazy initialization
let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!resendClient && config.resendApiKey) {
    resendClient = new Resend(config.resendApiKey);
  }
  return resendClient;
}

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject?: string;
    created_at?: string;
    link?: string;
    bounce_type?: string;
    complaint_feedback_type?: string;
    tags?: Array<{ name: string; value: string }>;
  };
}

/**
 * Map Resend event type to our MarketingEventType
 */
function mapEventType(resendType: string): MarketingEventType | null {
  const mapping: Record<string, MarketingEventType> = {
    'email.sent': MarketingEventType.SENT,
    'email.delivered': MarketingEventType.DELIVERED,
    'email.opened': MarketingEventType.OPENED,
    'email.clicked': MarketingEventType.CLICKED,
    'email.bounced': MarketingEventType.BOUNCED,
    'email.complained': MarketingEventType.COMPLAINED,
    'email.unsubscribed': MarketingEventType.UNSUBSCRIBED,
  };

  return mapping[resendType] || null;
}

/**
 * Verify webhook signature
 */
async function verifyWebhookSignature(
  request: NextRequest
): Promise<{ valid: boolean; payload?: ResendWebhookEvent }> {
  try {
    const webhookSecret = config.resendWebhookSecret;
    if (!webhookSecret) {
      console.warn('[Marketing Webhook] RESEND_WEBHOOK_SECRET not configured');
      return { valid: false };
    }

    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return { valid: false };
    }

    const rawBody = await request.text();
    const resend = getResend();
    if (!resend) {
      return { valid: false };
    }

    try {
      const payload = resend.webhooks.verify({
        payload: rawBody,
        headers: {
          id: svixId,
          timestamp: svixTimestamp,
          signature: svixSignature,
        },
        webhookSecret,
      }) as ResendWebhookEvent;

      return { valid: true, payload };
    } catch (error) {
      console.error('[Marketing Webhook] Signature verification failed:', error);
      return { valid: false };
    }
  } catch (error) {
    console.error('[Marketing Webhook] Verification error:', error);
    return { valid: false };
  }
}

/**
 * Find the original SENT event for a given Resend emailId.
 * Works for both campaign emails (campaignId set) and workflow emails (workflowId set).
 */
async function findSentEvent(emailId: string): Promise<{
  campaignId: string | null;
  workflowId: string | null;
  nodeId: string | null;
  userId: string | null;
  metadata: Record<string, unknown> | null;
} | null> {
  const event = await prisma.marketingEvent.findFirst({
    where: {
      emailId,
      eventType: MarketingEventType.SENT,
    },
    select: {
      campaignId: true,
      workflowId: true,
      nodeId: true,
      userId: true,
      metadata: true,
    },
  });

  if (!event) {
    return null;
  }

  return {
    campaignId: event.campaignId,
    workflowId: event.workflowId,
    nodeId: event.nodeId,
    userId: event.userId,
    metadata: event.metadata as Record<string, unknown> | null,
  };
}

/**
 * Update campaign statistics based on real event counts
 * Uses aggregate query to avoid double-counting from duplicate webhooks
 */
async function syncCampaignStats(campaignId: string): Promise<void> {
  const eventCounts = await prisma.marketingEvent.groupBy({
    by: ['eventType'],
    where: { campaignId },
    _count: { id: true },
  });

  const countMap: Record<string, number> = {};
  for (const ec of eventCounts) {
    countMap[ec.eventType] = ec._count.id;
  }

  await prisma.marketingCampaign.update({
    where: { id: campaignId },
    data: {
      sentCount: countMap['SENT'] ?? 0,
      openCount: countMap['OPENED'] ?? 0,
      clickCount: countMap['CLICKED'] ?? 0,
      bounceCount: countMap['BOUNCED'] ?? 0,
      complaintCount: countMap['COMPLAINED'] ?? 0,
    },
  });
}

const ISRAEL_TZ = 'Asia/Jerusalem';
const MAX_OPEN_LOG_ENTRIES = 50;
const MIN_OPENS_FOR_PREFERRED = 3;

function getIsraelHour(date: Date): number {
  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: ISRAEL_TZ,
    hour: 'numeric',
    hour12: false,
  }).format(date);
  return parseInt(hourStr, 10) % 24;
}

function computeCircularMeanHour(hours: number[]): number {
  let sinSum = 0;
  let cosSum = 0;
  for (const h of hours) {
    const rad = (h / 24) * 2 * Math.PI;
    sinSum += Math.sin(rad);
    cosSum += Math.cos(rad);
  }
  let meanRad = Math.atan2(sinSum / hours.length, cosSum / hours.length);
  if (meanRad < 0) meanRad += 2 * Math.PI;
  return Math.round((meanRad / (2 * Math.PI)) * 24) % 24;
}

async function updateUserOpenHours(userId: string, openDate: Date): Promise<void> {
  const israelHour = getIsraelHour(openDate);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openHoursLog: true },
  });

  const log = [...(user?.openHoursLog ?? []), israelHour].slice(-MAX_OPEN_LOG_ENTRIES);

  const data: { openHoursLog: number[]; preferredSendHour?: number } = { openHoursLog: log };
  if (log.length >= MIN_OPENS_FOR_PREFERRED) {
    data.preferredSendHour = computeCircularMeanHour(log);
  }

  await prisma.user.update({ where: { id: userId }, data });
}

/**
 * Handle webhook event
 */
export async function POST(request: NextRequest) {
  try {
    // Pre-check: timestamp + nonce validation (before consuming body)
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const securityCheck = await validateWebhookSecurity(svixId, svixTimestamp);
    if (!securityCheck.valid) {
      console.warn('[Marketing Webhook] Security check failed:', securityCheck.reason);
      return NextResponse.json(
        { error: `Webhook rejected: ${securityCheck.reason}` },
        { status: 401 },
      );
    }

    // Verify webhook signature
    const verification = await verifyWebhookSignature(request);
    if (!verification.valid || !verification.payload) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = verification.payload;

    // Map Resend event type to our event type
    const eventType = mapEventType(event.type);
    if (!eventType) {
      // Unknown event type - ignore but return success
      return NextResponse.json({ received: true });
    }

    const emailId = event.data.email_id;
    if (!emailId) {
      return NextResponse.json({ error: 'Missing email_id' }, { status: 400 });
    }

    // Find the original SENT event for this emailId
    const sentEvent = await findSentEvent(emailId);
    if (!sentEvent || !sentEvent.userId) {
      console.log(`[Marketing Webhook] Email ${emailId} not found in marketing events`);
      return NextResponse.json({ received: true });
    }

    // Need at least one of campaignId or workflowId
    if (!sentEvent.campaignId && !sentEvent.workflowId) {
      console.log(`[Marketing Webhook] Email ${emailId} has no campaign or workflow`);
      return NextResponse.json({ received: true });
    }

    const { campaignId, workflowId, nodeId, userId } = sentEvent;

    // SENT events are recorded at send time — skip duplicates from webhook
    if (eventType === MarketingEventType.SENT) {
      return NextResponse.json({ received: true });
    }

    // Resolve variantId (campaign A/B tests)
    let variantId: string | undefined;
    if (sentEvent.metadata?.variantId) {
      variantId = sentEvent.metadata.variantId as string;
    } else if (event.data.tags && Array.isArray(event.data.tags)) {
      const variantTag = event.data.tags.find((t) => t.name === 'variant_id');
      variantId = variantTag?.value;
    }

    const metadata: Record<string, string> = {
      emailId,
      timestamp: event.created_at,
    };

    if (variantId) metadata.variantId = variantId;
    if (workflowId) metadata.workflowId = workflowId;
    if (nodeId) metadata.nodeId = nodeId;

    if (eventType === MarketingEventType.CLICKED && event.data.link) {
      metadata.link = event.data.link;
    }
    if (eventType === MarketingEventType.BOUNCED && event.data.bounce_type) {
      metadata.bounceType = event.data.bounce_type;
    }
    if (eventType === MarketingEventType.COMPLAINED && event.data.complaint_feedback_type) {
      metadata.complaintFeedbackType = event.data.complaint_feedback_type;
    }

    // Dedup: check if this exact event already exists
    const existing = await prisma.marketingEvent.findFirst({
      where: { emailId, eventType },
    });

    if (existing) {
      await prisma.marketingEvent.update({
        where: { id: existing.id },
        data: {
          timestamp: new Date(event.created_at),
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        },
      });
    } else {
      await prisma.marketingEvent.create({
        data: {
          campaignId: campaignId ?? undefined,
          workflowId: workflowId ?? undefined,
          nodeId: nodeId ?? undefined,
          userId,
          emailId,
          eventType,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
          timestamp: new Date(event.created_at),
        },
      });
    }

    if (eventType === MarketingEventType.OPENED) {
      try {
        await updateUserOpenHours(userId, new Date(event.created_at));
      } catch (err) {
        console.error(`[Marketing Webhook] Failed to update open hours for user ${userId}:`, err);
      }
    }

    if (campaignId) {
      await syncCampaignStats(campaignId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Marketing Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'marketing-webhook' });
}
