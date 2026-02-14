import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { countSegmentUsers, validateSegmentFilter, type SegmentFilter } from '@/lib/marketing/segment';

/**
 * GET - List all campaigns with statistics
 */
export async function GET() {
  try {
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 }
      );
    }

    const campaigns = await prisma.marketingCampaign.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Enrich campaigns with real-time event counts
    const campaignIds = campaigns.map((c) => c.id);
    
    const eventCounts = campaignIds.length > 0
      ? await prisma.marketingEvent.groupBy({
          by: ['campaignId', 'eventType'],
          where: { campaignId: { in: campaignIds } },
          _count: { id: true },
        })
      : [];

    // Build a lookup: campaignId -> { SENT: n, OPENED: n, CLICKED: n, ... }
    const countLookup: Record<string, Record<string, number>> = {};
    for (const ec of eventCounts) {
      if (!countLookup[ec.campaignId]) {
        countLookup[ec.campaignId] = {};
      }
      countLookup[ec.campaignId][ec.eventType] = ec._count.id;
    }

    const enrichedCampaigns = campaigns.map((campaign) => {
      const counts = countLookup[campaign.id] || {};
      return {
        ...campaign,
        sentCount: counts['SENT'] ?? campaign.sentCount,
        openCount: counts['OPENED'] ?? campaign.openCount,
        clickCount: counts['CLICKED'] ?? campaign.clickCount,
        bounceCount: counts['BOUNCED'] ?? campaign.bounceCount,
        complaintCount: counts['COMPLAINED'] ?? campaign.complaintCount,
      };
    });

    return NextResponse.json({ campaigns: enrichedCampaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, subject, content, segmentFilter, scheduledAt } = body;

    // Validation
    if (!name || !subject || !content) {
      return NextResponse.json(
        { error: 'שם, נושא ותוכן הם שדות חובה' },
        { status: 400 }
      );
    }

    // Validate segment filter
    if (!validateSegmentFilter(segmentFilter)) {
      return NextResponse.json(
        { error: 'פילטר קהל לא תקין' },
        { status: 400 }
      );
    }

    // Count matching users
    const userCount = await countSegmentUsers(segmentFilter as SegmentFilter);

    // Create campaign
    const campaign = await prisma.marketingCampaign.create({
      data: {
        name,
        subject,
        content,
        segmentFilter: segmentFilter as SegmentFilter,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      campaign,
      userCount, // Return count for preview
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
