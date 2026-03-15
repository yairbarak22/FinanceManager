import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

/**
 * POST - Manually enroll users into a workflow
 */
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
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { userIds } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'יש לספק רשימת משתמשים' },
        { status: 400 },
      );
    }

    const workflow = await prisma.automationWorkflow.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'תהליך עבודה לא נמצא' },
        { status: 404 },
      );
    }

    if (workflow.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'לא ניתן לרשום משתמשים לתהליך עבודה שאינו פעיל' },
        { status: 400 },
      );
    }

    let enrolled = 0;
    let skipped = 0;
    const enrolledUserIds: string[] = [];

    for (const uid of userIds) {
      try {
        await prisma.workflowEnrollment.create({
          data: {
            workflowId: id,
            userId: uid,
            status: 'ACTIVE',
            currentNodeId: null,
            nextWakeupAt: null,
          },
        });
        enrolled++;
        enrolledUserIds.push(uid);
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          skipped++;
          continue;
        }
        throw err;
      }
    }

    return NextResponse.json({ enrolled, skipped, userIds: enrolledUserIds });
  } catch (error) {
    console.error('Error enrolling users:', error);
    return NextResponse.json(
      { error: 'Failed to enroll users' },
      { status: 500 },
    );
  }
}
