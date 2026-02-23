import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { prisma } from '@/lib/prisma';

const VALID_SOURCES = ['course_header', 'course_cta', 'course_sidebar'];
const MAX_CLICKS_PER_HOUR = 10;

export async function POST(request: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { source } = await request.json();

    if (!source || !VALID_SOURCES.includes(source)) {
      return NextResponse.json(
        { error: 'Invalid source' },
        { status: 400 }
      );
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentClicks = await prisma.ctaClick.count({
      where: {
        userId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentClicks >= MAX_CLICKS_PER_HOUR) {
      return NextResponse.json({ ok: true });
    }

    await prisma.ctaClick.create({
      data: { userId, source },
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
