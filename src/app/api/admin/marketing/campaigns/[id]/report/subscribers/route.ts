import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

const STATUS_PRIORITY = [
  'COMPLAINED',
  'BOUNCED',
  'UNSUBSCRIBED',
  'CLICKED',
  'OPENED',
] as const;

function deriveStatus(eventTypes: Set<string>): string {
  for (const type of STATUS_PRIORITY) {
    if (eventTypes.has(type)) return type.charAt(0) + type.slice(1).toLowerCase();
  }
  return 'Sent';
}

const STATUS_SORT_ORDER: Record<string, number> = {
  Complained: 0,
  Bounced: 1,
  Unsubscribed: 2,
  Clicked: 3,
  Opened: 4,
  Sent: 5,
};

const MAX_SUBSCRIBERS = 500;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(
      `admin:${userId}`,
      RATE_LIMITS.admin,
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 },
      );
    }

    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'קמפיין לא נמצא' },
        { status: 404 },
      );
    }

    const events = await prisma.marketingEvent.findMany({
      where: { campaignId: id },
      include: { user: { select: { email: true } } },
    });

    const subscriberMap = new Map<
      string,
      {
        eventTypes: Set<string>;
        opens: number;
        clicks: number;
        email: string;
      }
    >();

    for (const event of events) {
      if (!subscriberMap.has(event.emailId)) {
        subscriberMap.set(event.emailId, {
          eventTypes: new Set(),
          opens: 0,
          clicks: 0,
          email: event.user?.email || event.emailId,
        });
      }
      const entry = subscriberMap.get(event.emailId)!;
      entry.eventTypes.add(event.eventType);
      if (event.eventType === 'OPENED') entry.opens++;
      if (event.eventType === 'CLICKED') entry.clicks++;
    }

    const subscribers = Array.from(subscriberMap.entries())
      .map(([emailId, data]) => ({
        emailId,
        email: data.email,
        status: deriveStatus(data.eventTypes),
        opens: data.opens,
        clicks: data.clicks,
      }))
      .sort((a, b) => {
        const sPri =
          (STATUS_SORT_ORDER[a.status] ?? 99) -
          (STATUS_SORT_ORDER[b.status] ?? 99);
        if (sPri !== 0) return sPri;
        return a.email.localeCompare(b.email);
      })
      .slice(0, MAX_SUBSCRIBERS);

    return NextResponse.json({ success: true, subscribers });
  } catch (error) {
    console.error('Error fetching subscriber activity:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת פעילות מנויים' },
      { status: 500 },
    );
  }
}
