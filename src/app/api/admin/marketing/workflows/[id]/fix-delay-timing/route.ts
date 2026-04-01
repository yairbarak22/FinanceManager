import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

interface GraphNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
}
interface GraphEdge {
  source: string;
  target: string;
  sourceHandle?: string;
}

/**
 * Find the EMAIL node that precedes a given node by walking backwards.
 */
function findPrecedingEmailNode(
  nodeId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  visited = new Set<string>(),
): GraphNode | null {
  if (visited.has(nodeId)) return null;
  visited.add(nodeId);

  const inEdges = edges.filter((e) => e.target === nodeId);
  for (const edge of inEdges) {
    const source = nodes.find((n) => n.id === edge.source);
    if (!source) continue;
    if (source.type === 'EMAIL') return source;
    const deeper = findPrecedingEmailNode(source.id, nodes, edges, visited);
    if (deeper) return deeper;
  }
  return null;
}

/**
 * POST /api/admin/marketing/workflows/[id]/fix-delay-timing
 *
 * One-time fix: For enrollments at DELAY nodes whose wakeup was incorrectly
 * set to "now + delay" (due to reclaim), recalculates nextWakeupAt based on
 * the actual SENT event timestamp of the preceding email node.
 *
 * Auto-detects all DELAY nodes with active enrollments and fixes them.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, error: authError } = await requireAdmin();
    if (authError) return authError;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 },
      );
    }

    const { id: workflowId } = await params;

    const workflow = await prisma.automationWorkflow.findUnique({
      where: { id: workflowId },
      select: { nodes: true, edges: true },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'תהליך לא נמצא' }, { status: 404 });
    }

    const nodes = workflow.nodes as unknown as GraphNode[];
    const edges = workflow.edges as unknown as GraphEdge[];
    const delayNodes = nodes.filter((n) => n.type === 'DELAY');

    let totalFixed = 0;
    let totalSkipped = 0;
    const details: Array<{ delayNodeId: string; emailSubject: string; fixed: number; skipped: number }> = [];

    for (const delayNode of delayNodes) {
      // Find enrollments at this delay node
      const enrollments = await prisma.workflowEnrollment.findMany({
        where: {
          workflowId,
          status: 'ACTIVE',
          currentNodeId: delayNode.id,
        },
        select: { id: true, userId: true, nextWakeupAt: true },
      });

      if (enrollments.length === 0) continue;

      // Find the preceding EMAIL node
      const emailNode = findPrecedingEmailNode(delayNode.id, nodes, edges);
      if (!emailNode) continue;

      const delayAmount = (delayNode.data.amount as number) || 7;
      const delayUnit = (delayNode.data.unit as string) || 'DAYS';
      const delayMs =
        delayUnit === 'HOURS'
          ? delayAmount * 60 * 60 * 1000
          : delayAmount * 24 * 60 * 60 * 1000;

      // Get SENT events for these users on the preceding email
      const userIds = enrollments.map((e) => e.userId);
      const sentEvents = await prisma.marketingEvent.findMany({
        where: {
          workflowId,
          nodeId: emailNode.id,
          eventType: 'SENT',
          userId: { in: userIds },
        },
        select: { userId: true, timestamp: true },
        orderBy: { timestamp: 'asc' },
      });

      // Map userId → earliest SENT time
      const sentTimeByUser = new Map<string, Date>();
      for (const event of sentEvents) {
        if (!sentTimeByUser.has(event.userId)) {
          sentTimeByUser.set(event.userId, event.timestamp);
        }
      }

      let fixed = 0;
      let skipped = 0;

      for (const enrollment of enrollments) {
        const sentTime = sentTimeByUser.get(enrollment.userId);
        if (!sentTime) {
          skipped++;
          continue;
        }

        const correctWakeup = new Date(sentTime.getTime() + delayMs);

        // Only fix if the current wakeup is significantly different (> 1 hour)
        if (
          enrollment.nextWakeupAt &&
          Math.abs(enrollment.nextWakeupAt.getTime() - correctWakeup.getTime()) < 3600_000
        ) {
          continue; // Already correct
        }

        await prisma.workflowEnrollment.update({
          where: { id: enrollment.id },
          data: { nextWakeupAt: correctWakeup },
        });
        fixed++;
      }

      totalFixed += fixed;
      totalSkipped += skipped;

      if (fixed > 0 || skipped > 0) {
        details.push({
          delayNodeId: delayNode.id,
          emailSubject: (emailNode.data.subject as string) || 'ללא נושא',
          fixed,
          skipped,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `תוקנו ${totalFixed} רשומות, ${totalSkipped} דולגו`,
      fixed: totalFixed,
      skipped: totalSkipped,
      details,
    });
  } catch (error) {
    console.error('[FixDelayTiming] Error:', error);
    return NextResponse.json(
      { error: 'שגיאה בתיקון זמני עיכוב' },
      { status: 500 },
    );
  }
}
