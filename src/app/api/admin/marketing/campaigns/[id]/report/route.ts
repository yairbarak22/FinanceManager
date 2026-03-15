import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

function pct(numerator: number, denominator: number): number {
  return denominator > 0
    ? Math.round(((numerator / denominator) * 100 + Number.EPSILON) * 100) / 100
    : 0;
}

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
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'קמפיין לא נמצא' },
        { status: 404 },
      );
    }

    const events = await prisma.marketingEvent.findMany({
      where: { campaignId: id },
    });

    // ── Unique counts via Sets ────────────────────────

    const openedEmails = new Set<string>();
    const clickedEmails = new Set<string>();
    const unsubscribedEmails = new Set<string>();
    const complainedEmails = new Set<string>();
    const hardBounceEmails = new Set<string>();
    const softBounceEmails = new Set<string>();

    for (const event of events) {
      switch (event.eventType) {
        case 'OPENED':
          openedEmails.add(event.emailId);
          break;
        case 'CLICKED':
          clickedEmails.add(event.emailId);
          break;
        case 'UNSUBSCRIBED':
          unsubscribedEmails.add(event.emailId);
          break;
        case 'COMPLAINED':
          complainedEmails.add(event.emailId);
          break;
        case 'BOUNCED': {
          const meta = event.metadata as Record<string, unknown> | null;
          const bounceType = meta?.bounceType as string | undefined;
          if (bounceType === 'Permanent') {
            hardBounceEmails.add(event.emailId);
          } else {
            softBounceEmails.add(event.emailId);
          }
          break;
        }
      }
    }

    const totalSent = campaign.sentCount;
    const openedCount = openedEmails.size;
    const clickedCount = clickedEmails.size;
    const unsubscribedCount = unsubscribedEmails.size;
    const complainedCount = complainedEmails.size;
    const hardBounceCount = hardBounceEmails.size;
    const softBounceCount = softBounceEmails.size;

    // ── 24-hour timeline ──────────────────────────────

    const timeline = Array.from({ length: 24 }, (_, i) => ({
      hour: i.toString(),
      opens: 0,
      clicks: 0,
    }));

    if (campaign.startedAt) {
      const startMs = campaign.startedAt.getTime();
      for (const event of events) {
        if (event.eventType !== 'OPENED' && event.eventType !== 'CLICKED')
          continue;
        const h = Math.floor(
          (event.timestamp.getTime() - startMs) / (1000 * 60 * 60),
        );
        if (h < 0 || h >= 24) continue;
        if (event.eventType === 'OPENED') timeline[h].opens++;
        else timeline[h].clicks++;
      }
    }

    // ── A/B Test Breakdown ──────────────────────────────

    let abTest: {
      isAbTest: boolean;
      winningMetric: string | null;
      durationHours: number | null;
      percentage: number | null;
      status: string;
      winningVariantId: string | null;
      variants: {
        A: { sent: number; opens: number; clicks: number; openRate: number; clickRate: number; ctor: number };
        B: { sent: number; opens: number; clicks: number; openRate: number; clickRate: number; ctor: number };
      };
      content: Array<{ id: string; subject: string }>;
    } | null = null;

    if (campaign.isAbTest) {
      const campaignVariants = campaign.variants as Array<{ id: string; subject: string; htmlContent: string }> | null;

      const variantSent = { A: new Set<string>(), B: new Set<string>() };
      const variantOpened = { A: new Set<string>(), B: new Set<string>() };
      const variantClicked = { A: new Set<string>(), B: new Set<string>() };

      for (const event of events) {
        const meta = event.metadata as Record<string, unknown> | null;
        const vid = meta?.variantId as string | undefined;
        if (!vid || (vid !== 'A' && vid !== 'B')) continue;

        const eid = event.emailId;
        if (event.eventType === 'SENT') variantSent[vid].add(eid);
        else if (event.eventType === 'OPENED') variantOpened[vid].add(eid);
        else if (event.eventType === 'CLICKED') variantClicked[vid].add(eid);
      }

      const sentA = variantSent.A.size;
      const sentB = variantSent.B.size;
      const openedA = variantOpened.A.size;
      const openedB = variantOpened.B.size;
      const clickedA = variantClicked.A.size;
      const clickedB = variantClicked.B.size;

      abTest = {
        isAbTest: true,
        winningMetric: campaign.abTestWinningMetric || null,
        durationHours: campaign.abTestDurationHours || null,
        percentage: campaign.abTestPercentage || null,
        status: campaign.status,
        winningVariantId: campaign.winningVariantId || null,
        variants: {
          A: { sent: sentA, opens: openedA, clicks: clickedA, openRate: pct(openedA, sentA), clickRate: pct(clickedA, sentA), ctor: pct(clickedA, openedA) },
          B: { sent: sentB, opens: openedB, clicks: clickedB, openRate: pct(openedB, sentB), clickRate: pct(clickedB, sentB), ctor: pct(clickedB, openedB) },
        },
        content: campaignVariants
          ? campaignVariants.map((v) => ({ id: v.id, subject: v.subject }))
          : [{ id: 'A', subject: campaign.subject }, { id: 'B', subject: campaign.subject }],
      };
    }

    // ── Response ──────────────────────────────────────

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        startedAt: campaign.startedAt,
        sentCount: totalSent,
        isAbTest: campaign.isAbTest,
      },
      metrics: {
        totalSent,
        opens: { count: openedCount, rate: pct(openedCount, totalSent) },
        clicks: { count: clickedCount, rate: pct(clickedCount, totalSent) },
        ctor: { rate: pct(clickedCount, openedCount) },
        unsubscribes: {
          count: unsubscribedCount,
          rate: pct(unsubscribedCount, totalSent),
        },
        complaints: {
          count: complainedCount,
          rate: pct(complainedCount, totalSent),
        },
        hardBounces: {
          count: hardBounceCount,
          rate: pct(hardBounceCount, totalSent),
        },
        softBounces: {
          count: softBounceCount,
          rate: pct(softBounceCount, totalSent),
        },
      },
      timeline,
      abTest,
    });
  } catch (error) {
    console.error('Error fetching campaign report:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת דוח הקמפיין' },
      { status: 500 },
    );
  }
}
