import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminHelpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const adminResult = await requireAdmin();
  if (adminResult.error) return adminResult.error;

  try {
    const [totalClicks, clicksByUser] = await Promise.all([
      prisma.ctaClick.count(),
      prisma.ctaClick.groupBy({
        by: ['userId'],
        _count: { id: true },
        _max: { createdAt: true },
        orderBy: { _max: { createdAt: 'desc' } },
      }),
    ]);

    const userIds = clicksByUser.map((c) => c.userId);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, image: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const usersWithClicks = clicksByUser.map((c) => {
      const user = userMap.get(c.userId);
      return {
        id: c.userId,
        name: user?.name || null,
        email: user?.email || null,
        image: user?.image || null,
        clickCount: c._count.id,
        lastClickedAt: c._max.createdAt,
      };
    });

    return NextResponse.json({
      totalClicks,
      uniqueUsers: clicksByUser.length,
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
