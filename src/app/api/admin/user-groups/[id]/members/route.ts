import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות.' }, { status: 429 });
    }

    const group = await prisma.userGroup.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: 'קבוצה לא נמצאה' }, { status: 404 });
    }

    const body = await request.json();
    const { userIds, emails } = body as {
      userIds?: string[];
      emails?: string[];
    };

    let resolvedUserIds: string[] = userIds || [];

    if (emails && emails.length > 0) {
      const normalizedEmails = emails.map((e) => e.trim().toLowerCase()).filter(Boolean);
      const matchedUsers = await prisma.user.findMany({
        where: { email: { in: normalizedEmails } },
        select: { id: true, email: true },
      });
      const emailUserIds = matchedUsers.map((u) => u.id);
      const notFoundEmails = normalizedEmails.filter(
        (e) => !matchedUsers.some((u) => u.email.toLowerCase() === e),
      );
      resolvedUserIds = [...new Set([...resolvedUserIds, ...emailUserIds])];

      if (resolvedUserIds.length === 0) {
        return NextResponse.json({
          error: 'לא נמצאו משתמשים תואמים',
          notFoundEmails,
        }, { status: 400 });
      }

      const result = await prisma.userGroupMember.createMany({
        data: resolvedUserIds.map((uid) => ({ groupId: id, userId: uid })),
        skipDuplicates: true,
      });

      return NextResponse.json({
        added: result.count,
        notFoundEmails,
        totalNotFound: notFoundEmails.length,
      });
    }

    if (resolvedUserIds.length === 0) {
      return NextResponse.json({ error: 'לא סופקו משתמשים להוספה' }, { status: 400 });
    }

    const result = await prisma.userGroupMember.createMany({
      data: resolvedUserIds.map((uid) => ({ groupId: id, userId: uid })),
      skipDuplicates: true,
    });

    return NextResponse.json({ added: result.count });
  } catch (err) {
    console.error('[GroupMembers POST] Error:', err);
    return NextResponse.json({ error: 'שגיאה בהוספת משתמשים' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות.' }, { status: 429 });
    }

    const body = await request.json();
    const { userIds } = body as { userIds?: string[] };

    if (!userIds || userIds.length === 0) {
      return NextResponse.json({ error: 'לא סופקו משתמשים להסרה' }, { status: 400 });
    }

    const result = await prisma.userGroupMember.deleteMany({
      where: {
        groupId: id,
        userId: { in: userIds },
      },
    });

    return NextResponse.json({ removed: result.count });
  } catch (err) {
    console.error('[GroupMembers DELETE] Error:', err);
    return NextResponse.json({ error: 'שגיאה בהסרת משתמשים' }, { status: 500 });
  }
}
