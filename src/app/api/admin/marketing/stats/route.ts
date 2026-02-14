import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

/**
 * GET - Get marketing statistics (real-time from MarketingEvent table)
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

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get campaigns completed this month
    const completedCampaignIds = await prisma.marketingCampaign.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: { id: true },
    });

    const campaignIds = completedCampaignIds.map((c) => c.id);

    // Aggregate real-time event counts for this month's campaigns
    let totalSent = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalBounced = 0;
    let totalComplained = 0;

    if (campaignIds.length > 0) {
      const eventCounts = await prisma.marketingEvent.groupBy({
        by: ['eventType'],
        where: {
          campaignId: { in: campaignIds },
        },
        _count: { id: true },
      });

      for (const ec of eventCounts) {
        switch (ec.eventType) {
          case 'SENT':
            totalSent = ec._count.id;
            break;
          case 'OPENED':
            totalOpened = ec._count.id;
            break;
          case 'CLICKED':
            totalClicked = ec._count.id;
            break;
          case 'BOUNCED':
            totalBounced = ec._count.id;
            break;
          case 'COMPLAINED':
            totalComplained = ec._count.id;
            break;
        }
      }
    }

    // Calculate rates
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

    // Get active campaigns (sending or scheduled)
    const activeCampaigns = await prisma.marketingCampaign.count({
      where: {
        status: {
          in: ['SENDING', 'SCHEDULED'],
        },
      },
    });

    // Get all-time stats from MarketingEvent
    const allTimeEvents = await prisma.marketingEvent.groupBy({
      by: ['eventType'],
      where: {
        eventType: { in: ['SENT', 'OPENED', 'CLICKED'] },
      },
      _count: { id: true },
    });

    const allTimeMap: Record<string, number> = {};
    for (const ec of allTimeEvents) {
      allTimeMap[ec.eventType] = ec._count.id;
    }

    // Get events by date for chart (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Group events by date (use raw query-like approach with Date truncation)
    const recentEvents = await prisma.marketingEvent.findMany({
      where: {
        timestamp: { gte: thirtyDaysAgo },
        eventType: { in: ['SENT', 'OPENED', 'CLICKED'] },
      },
      select: {
        timestamp: true,
        eventType: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group by date manually
    const dateMap: Record<string, number> = {};
    for (const event of recentEvents) {
      const dateKey = event.timestamp.toISOString().split('T')[0];
      dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
    }

    const eventsByDate = Object.entries(dateMap).map(([date, count]) => ({
      date,
      count,
    }));

    // Get recent campaigns (last 5 completed or sending)
    const recentCampaigns = await prisma.marketingCampaign.findMany({
      where: {
        status: { in: ['COMPLETED', 'SENDING', 'SCHEDULED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        sentCount: true,
        openCount: true,
        clickCount: true,
        completedAt: true,
        createdAt: true,
      },
    });

    // Enrich recent campaigns with real-time event counts
    const recentCampaignIds = recentCampaigns.map((c) => c.id);
    let recentEventCounts: { campaignId: string; eventType: string; _count: { id: number } }[] = [];
    if (recentCampaignIds.length > 0) {
      const grouped = await prisma.marketingEvent.groupBy({
        by: ['campaignId', 'eventType'] as const,
        where: { campaignId: { in: recentCampaignIds } },
        _count: { id: true },
      });
      recentEventCounts = grouped as typeof recentEventCounts;
    }

    const enrichedRecentCampaigns = recentCampaigns.map((campaign) => {
      const campaignEvents = recentEventCounts.filter((e) => e.campaignId === campaign.id);
      const cMap: Record<string, number> = {};
      for (const ce of campaignEvents) {
        cMap[ce.eventType] = ce._count.id;
      }
      return {
        ...campaign,
        sentCount: cMap['SENT'] ?? campaign.sentCount,
        openCount: cMap['OPENED'] ?? campaign.openCount,
        clickCount: cMap['CLICKED'] ?? campaign.clickCount,
      };
    });

    // Get total campaigns count
    const totalCampaigns = await prisma.marketingCampaign.count();

    return NextResponse.json({
      thisMonth: {
        sent: totalSent,
        opened: totalOpened,
        clicked: totalClicked,
        bounced: totalBounced,
        complained: totalComplained,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
      },
      activeCampaigns,
      totalCampaigns,
      allTime: {
        totalSent: allTimeMap['SENT'] ?? 0,
        totalOpened: allTimeMap['OPENED'] ?? 0,
        totalClicked: allTimeMap['CLICKED'] ?? 0,
      },
      recentCampaigns: enrichedRecentCampaigns,
      eventsByDate,
    });
  } catch (error) {
    console.error('Error fetching marketing stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
