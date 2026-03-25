import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

const MAX_ENROLLMENTS = 200;

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

    const workflow = await prisma.automationWorkflow.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'תהליך עבודה לא נמצא' },
        { status: 404 },
      );
    }

    const enrollments = await prisma.workflowEnrollment.findMany({
      where: { workflowId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_ENROLLMENTS,
    });

    const data = enrollments.map((e) => ({
      id: e.id,
      userId: e.userId,
      userName: e.user.name,
      userEmail: e.user.email,
      status: e.status,
      currentNodeId: e.currentNodeId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));

    return NextResponse.json({ success: true, enrollments: data });
  } catch (error) {
    console.error('Error fetching workflow enrollments:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת פעילות נרשמים' },
      { status: 500 },
    );
  }
}
