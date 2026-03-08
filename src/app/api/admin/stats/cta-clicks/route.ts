import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminHelpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const adminResult = await requireAdmin();
  if (adminResult.error) return adminResult.error;

  try {
    const [totalClicks, anonymousClicks, clicksBySource, clicksByUser] = await Promise.all([
      prisma.ctaClick.count(),
      prisma.ctaClick.count({ where: { userId: null } }),
      prisma.ctaClick.groupBy({
        by: ['source'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.ctaClick.groupBy({
        by: ['userId'],
        where: { userId: { not: null } },
        _count: { id: true },
        _max: { createdAt: true },
        orderBy: { _max: { createdAt: 'desc' } },
      }),
    ]);

    const userIds = clicksByUser
      .map((c) => c.userId)
      .filter((id): id is string => id !== null);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, image: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const usersWithClicks = clicksByUser.map((c) => {
      const user = c.userId ? userMap.get(c.userId) : null;
      return {
        id: c.userId,
        name: user?.name || null,
        email: user?.email || null,
        image: user?.image || null,
        clickCount: c._count.id,
        lastClickedAt: c._max.createdAt,
      };
    });

    const sourceBreakdown = Object.fromEntries(
      clicksBySource.map((s) => [s.source, s._count.id])
    );

    return NextResponse.json({
      totalClicks,
      anonymousClicks,
      uniqueUsers: clicksByUser.length,
      sourceBreakdown,
      users: usersWithClicks,
    });
  } catch (err) {
    console.error('Error fetching CTA click stats:', err);
    return NextResponse.json(
      { error: 'Failed to fetch CTA click stats' },
      { status: 500 }
    );
  }
}
