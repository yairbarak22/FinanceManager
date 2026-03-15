import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

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
      where: { campaignId: id, eventType: 'CLICKED' },
    });

    const urlMap = new Map<
      string,
      { uniqueEmails: Set<string>; total: number }
    >();

    for (const event of events) {
      const meta = event.metadata as Record<string, unknown> | null;
      const url = meta?.link as string | undefined;
      if (!url) continue;

      if (!urlMap.has(url)) {
        urlMap.set(url, { uniqueEmails: new Set(), total: 0 });
      }
      const entry = urlMap.get(url)!;
      entry.uniqueEmails.add(event.emailId);
      entry.total++;
    }

    const links = Array.from(urlMap.entries())
      .map(([url, data]) => ({
        url,
        uniqueClicks: data.uniqueEmails.size,
        totalClicks: data.total,
      }))
      .sort((a, b) => b.uniqueClicks - a.uniqueClicks);

    return NextResponse.json({ success: true, links });
  } catch (error) {
    console.error('Error fetching link activity:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת פעילות קישורים' },
      { status: 500 },
    );
  }
}
