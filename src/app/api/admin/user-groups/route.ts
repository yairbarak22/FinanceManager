import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function GET() {
  try {
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 },
      );
    }

    const groups = await prisma.userGroup.findMany({
      include: {
        _count: { select: { members: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ groups });
  } catch (err) {
    console.error('[UserGroups GET] Error:', err);
    return NextResponse.json({ error: 'שגיאה בטעינת הקבוצות' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { name, description, userIds, emails } = body as {
      name?: string;
      description?: string;
      userIds?: string[];
      emails?: string[];
    };

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'שם הקבוצה הוא שדה חובה' }, { status: 400 });
    }

    let resolvedUserIds: string[] = userIds || [];

    if (emails && emails.length > 0) {
      const normalizedEmails = emails.map((e) => e.trim().toLowerCase()).filter(Boolean);
      const matchedUsers = await prisma.user.findMany({
        where: { email: { in: normalizedEmails } },
        select: { id: true },
      });
      const emailUserIds = matchedUsers.map((u) => u.id);
      resolvedUserIds = [...new Set([...resolvedUserIds, ...emailUserIds])];
    }

    const group = await prisma.userGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdBy: userId,
        ...(resolvedUserIds.length > 0
          ? {
              members: {
                createMany: {
                  data: resolvedUserIds.map((uid) => ({ userId: uid })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    const notFoundCount =
      emails && emails.length > 0
        ? emails.length - (resolvedUserIds.length - (userIds?.length || 0))
        : 0;

    return NextResponse.json({
      group,
      membersAdded: resolvedUserIds.length,
      emailsNotFound: notFoundCount > 0 ? notFoundCount : 0,
    });
  } catch (err) {
    console.error('[UserGroups POST] Error:', err);
    return NextResponse.json({ error: 'שגיאה ביצירת הקבוצה' }, { status: 500 });
  }
}
