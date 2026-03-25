import { NextRequest, NextResponse } from 'next/server';
import { WorkflowStatus, Prisma, type TriggerType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import {
  safeParseWorkflowGraph,
  triggerTypeFromWorkflowGraph,
} from '@/lib/marketing/workflows/types';

const VALID_STATUSES: WorkflowStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED'];

/**
 * GET - Fetch a single workflow with full graph data
 */
export async function GET(
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

    const workflow = await prisma.automationWorkflow.findUnique({
      where: { id },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'תהליך עבודה לא נמצא' },
        { status: 404 },
      );
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 },
    );
  }
}

/**
 * PUT - Update workflow (name, status, nodes, edges)
 */
export async function PUT(
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

    const existing = await prisma.automationWorkflow.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'תהליך עבודה לא נמצא' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { name, status, nodes, edges, promoteToActiveOnComplete } = body;

    let syncedTriggerType: TriggerType | undefined;
    let validatedNodes: Prisma.InputJsonValue | undefined;
    let validatedEdges: Prisma.InputJsonValue | undefined;

    // Validate graph structure when nodes or edges are provided
    if (nodes !== undefined || edges !== undefined) {
      const graphNodes = nodes ?? existing.nodes;
      const graphEdges = edges ?? existing.edges;

      const parseResult = safeParseWorkflowGraph({
        nodes: graphNodes,
        edges: graphEdges,
      });

      if (!parseResult.success) {
        return NextResponse.json(
          {
            error: 'מבנה גרף לא תקין',
            issues: parseResult.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
          { status: 400 },
        );
      }

      validatedNodes = parseResult.data.nodes as unknown as Prisma.InputJsonValue;
      validatedEdges = parseResult.data.edges as unknown as Prisma.InputJsonValue;
      syncedTriggerType =
        triggerTypeFromWorkflowGraph(parseResult.data) ?? existing.triggerType;
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'סטטוס לא תקין' },
        { status: 400 },
      );
    }

    const updateData: {
      name?: string;
      status?: WorkflowStatus;
      triggerType?: TriggerType;
      nodes?: Prisma.InputJsonValue;
      edges?: Prisma.InputJsonValue;
      promoteToActiveOnComplete?: boolean;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status as WorkflowStatus;
    if (validatedNodes !== undefined) updateData.nodes = validatedNodes;
    if (validatedEdges !== undefined) updateData.edges = validatedEdges;
    if (syncedTriggerType !== undefined) {
      updateData.triggerType = syncedTriggerType;
    }
    if (typeof promoteToActiveOnComplete === 'boolean') {
      updateData.promoteToActiveOnComplete = promoteToActiveOnComplete;
    }

    const workflow = await prisma.automationWorkflow.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Delete workflow (cascades to enrollments)
 */
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
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 },
      );
    }

    const existing = await prisma.automationWorkflow.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'תהליך עבודה לא נמצא' },
        { status: 404 },
      );
    }

    await prisma.automationWorkflow.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 },
    );
  }
}
