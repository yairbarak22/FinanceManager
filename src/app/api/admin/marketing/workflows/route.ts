import { NextRequest, NextResponse } from 'next/server';
import { TriggerType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

const VALID_TRIGGER_TYPES: TriggerType[] = ['MANUAL', 'USER_REGISTERED', 'ADDED_TO_GROUP'];

/**
 * GET - List all automation workflows
 */
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

    const workflows = await prisma.automationWorkflow.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        triggerType: true,
        createdAt: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 },
    );
  }
}

/**
 * POST - Create a new automation workflow
 */
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
    const { name, triggerType } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'שם הוא שדה חובה' },
        { status: 400 },
      );
    }

    if (triggerType && !VALID_TRIGGER_TYPES.includes(triggerType)) {
      return NextResponse.json(
        { error: 'סוג טריגר לא תקין' },
        { status: 400 },
      );
    }

    const workflow = await prisma.automationWorkflow.create({
      data: {
        name: name.trim(),
        triggerType: (triggerType as TriggerType) || 'MANUAL',
        nodes: [],
        edges: [],
      },
    });

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 },
    );
  }
}
