import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { prisma } from '@/lib/prisma';

const VALID_SOURCES = [
  'course_header', 'course_cta', 'course_sidebar',
  'funnel_hero_cta', 'funnel_video_cta', 'funnel_benefits_cta', 'funnel_final_cta',
  'funnel_navbar_cta', 'funnel_placeholder_cta',
  'guide_final_cta',
  'transfer_steps_cta', 'transfer_final_cta',
  'landing_video_cta',
];

const PUBLIC_SOURCES = new Set([
  'funnel_hero_cta', 'funnel_video_cta', 'funnel_benefits_cta', 'funnel_final_cta',
  'funnel_navbar_cta', 'funnel_placeholder_cta',
  'guide_final_cta',
  'transfer_steps_cta', 'transfer_final_cta',
  'landing_video_cta',
]);

const MAX_CLICKS_PER_HOUR = 10;
const MAX_ANON_CLICKS_PER_HOUR = 50;

export async function POST(request: NextRequest) {
  try {
    const { source } = await request.json();

    if (!source || !VALID_SOURCES.includes(source)) {
      return NextResponse.json(
        { error: 'Invalid source' },
        { status: 400 }
      );
    }

    const isPublicSource = PUBLIC_SOURCES.has(source);
    const auth = await requireAuth();

    if (auth.error && !isPublicSource) {
      return auth.error;
    }

    const userId = auth.error ? null : auth.userId;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (userId) {
      const recentClicks = await prisma.ctaClick.count({
        where: { userId, createdAt: { gte: oneHourAgo } },
      });
      if (recentClicks >= MAX_CLICKS_PER_HOUR) {
        return NextResponse.json({ ok: true });
      }
    } else {
      const recentAnon = await prisma.ctaClick.count({
        where: {
          userId: null,
          createdAt: { gte: oneHourAgo },
        },
      });
      if (recentAnon >= MAX_ANON_CLICKS_PER_HOUR) {
        return NextResponse.json({ ok: true });
      }
    }

    await prisma.ctaClick.create({
      data: {
        source,
        ...(userId ? { userId } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    console.error('Error tracking CTA click');
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
