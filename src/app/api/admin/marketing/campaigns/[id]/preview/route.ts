import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { countSegmentUsers, validateSegmentFilter, type SegmentFilter } from '@/lib/marketing/segment';

/**
 * GET - Preview campaign (count matching users)
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
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'קמפיין לא נמצא' },
        { status: 404 }
      );
    }

    // Validate and count users
    if (!validateSegmentFilter(campaign.segmentFilter)) {
      return NextResponse.json(
        { error: 'פילטר קהל לא תקין' },
        { status: 400 }
      );
    }

    const userCount = await countSegmentUsers(campaign.segmentFilter as SegmentFilter);

    return NextResponse.json({
      userCount,
      campaign: {
        name: campaign.name,
        subject: campaign.subject,
        content: campaign.content,
      },
    });
  } catch (error) {
    console.error('Error previewing campaign:', error);
    return NextResponse.json(
      { error: 'Failed to preview campaign' },
      { status: 500 }
    );
  }
}

