/**
 * Resend Webhook Handler for Marketing Events
 * Receives webhook events from Resend and updates campaign statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { config } from '@/lib/config';
import { prisma } from '@/lib/prisma';
import { MarketingEventType } from '@prisma/client';

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
    // For click events
    link?: string;
    // For bounce/complaint events
    bounce_type?: string;
    complaint_feedback_type?: string;
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
 * Find campaign and user from email ID
 * We store the email ID in MarketingEvent when sending
 */
async function findCampaignAndUser(emailId: string): Promise<{
  campaignId: string | null;
  userId: string | null;
} | null> {
  // Find the SENT event with this email ID (created during campaign send)
  const event = await prisma.marketingEvent.findFirst({
    where: {
      emailId,
      eventType: MarketingEventType.SENT,
    },
    select: {
      campaignId: true,
      userId: true,
    },
  });

  if (!event) {
    return null;
  }

  return {
    campaignId: event.campaignId,
    userId: event.userId,
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

/**
 * Handle webhook event
 */
export async function POST(request: NextRequest) {
  try {
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

    // Find campaign and user from email ID (look up the SENT event)
    const campaignUser = await findCampaignAndUser(emailId);
    if (!campaignUser || !campaignUser.campaignId || !campaignUser.userId) {
      // Email not found in our system - might be transactional email, ignore
      console.log(`[Marketing Webhook] Email ${emailId} not found in marketing events`);
      return NextResponse.json({ received: true });
    }

    const { campaignId, userId } = campaignUser;

    // Don't create duplicate SENT events (the SENT event is already created during campaign send)
    if (eventType === MarketingEventType.SENT) {
      return NextResponse.json({ received: true });
    }

    // Prepare metadata
    const metadata: Record<string, string> = {
      emailId,
      timestamp: event.created_at,
    };

    if (eventType === MarketingEventType.CLICKED && event.data.link) {
      metadata.link = event.data.link;
    }

    if (eventType === MarketingEventType.BOUNCED && event.data.bounce_type) {
      metadata.bounceType = event.data.bounce_type;
    }

    if (eventType === MarketingEventType.COMPLAINED && event.data.complaint_feedback_type) {
      metadata.complaintFeedbackType = event.data.complaint_feedback_type;
    }

    // Check if this exact event already exists (dedup)
    const existing = await prisma.marketingEvent.findFirst({
      where: {
        emailId,
        eventType,
      },
    });

    if (existing) {
      // Update existing event timestamp only, don't create new one
      await prisma.marketingEvent.update({
        where: { id: existing.id },
        data: {
          timestamp: new Date(event.created_at),
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        },
      });
    } else {
      // Create new event
      await prisma.marketingEvent.create({
        data: {
          campaignId,
          userId,
          emailId,
          eventType,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
          timestamp: new Date(event.created_at),
        },
      });
    }

    // Sync campaign statistics from real event counts (avoids double-counting)
    await syncCampaignStats(campaignId);

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
