import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { validateSegmentFilter, type SegmentFilter } from '@/lib/marketing/segment';

/**
 * GET - Get campaign details
 */
export async function GET(
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

    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id },
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

    if (!campaign) {
      return NextResponse.json(
        { error: 'קמפיין לא נמצא' },
        { status: 404 }
      );
    }

    // Aggregate real-time event counts from MarketingEvent table
    const eventCounts = await prisma.marketingEvent.groupBy({
      by: ['eventType'],
      where: { campaignId: id },
      _count: { id: true },
    });

    const countMap: Record<string, number> = {};
    for (const ec of eventCounts) {
      countMap[ec.eventType] = ec._count.id;
    }

    // Merge real-time counts (prefer live data over stored counters)
    const enrichedCampaign = {
      ...campaign,
      sentCount: countMap['SENT'] ?? campaign.sentCount,
      openCount: countMap['OPENED'] ?? campaign.openCount,
      clickCount: countMap['CLICKED'] ?? campaign.clickCount,
      bounceCount: countMap['BOUNCED'] ?? campaign.bounceCount,
      complaintCount: countMap['COMPLAINED'] ?? campaign.complaintCount,
    };

    return NextResponse.json({ campaign: enrichedCampaign });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update campaign
 */
export async function PUT(
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

    const body = await request.json();
    const { name, subject, content, segmentFilter, scheduledAt, status } = body;

    // Check if campaign exists
    const existing = await prisma.marketingCampaign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'קמפיין לא נמצא' },
        { status: 404 }
      );
    }

    // Don't allow editing if campaign is sending or completed
    if (existing.status === 'SENDING' || existing.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'לא ניתן לערוך קמפיין שנשלח או הושלם' },
        { status: 400 }
      );
    }

    // Validate segment filter if provided
    if (segmentFilter && !validateSegmentFilter(segmentFilter)) {
      return NextResponse.json(
        { error: 'פילטר קהל לא תקין' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: {
      name?: string;
      subject?: string;
      content?: string;
      segmentFilter?: Prisma.InputJsonValue;
      scheduledAt?: Date | null;
      status?: string;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (content !== undefined) updateData.content = content;
    if (segmentFilter !== undefined) updateData.segmentFilter = segmentFilter as Prisma.InputJsonValue;
    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    }
    if (status !== undefined) updateData.status = status;

    const campaign = await prisma.marketingCampaign.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete campaign
 */
export async function DELETE(
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

    // Check if campaign exists
    const existing = await prisma.marketingCampaign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'קמפיין לא נמצא' },
        { status: 404 }
      );
    }

    // Don't allow deleting if campaign is sending
    if (existing.status === 'SENDING') {
      return NextResponse.json(
        { error: 'לא ניתן למחוק קמפיין שנמצא בשליחה' },
        { status: 400 }
      );
    }

    await prisma.marketingCampaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
