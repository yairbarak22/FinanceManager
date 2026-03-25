import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

function pct(numerator: number, denominator: number): number {
  return denominator > 0
    ? Math.round(((numerator / denominator) * 100 + Number.EPSILON) * 100) / 100
    : 0;
}

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
      select: {
        id: true,
        name: true,
        status: true,
        nodes: true,
        edges: true,
        createdAt: true,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'תהליך עבודה לא נמצא' },
        { status: 404 },
      );
    }

    // ── Enrollment status breakdown ────────────────────
    const enrollmentGroups = await prisma.workflowEnrollment.groupBy({
      by: ['status'],
      where: { workflowId: id },
      _count: { _all: true },
    });

    const enrollment = { total: 0, active: 0, completed: 0, cancelled: 0 };
    for (const g of enrollmentGroups) {
      const count = g._count._all;
      enrollment.total += count;
      if (g.status === 'ACTIVE') enrollment.active = count;
      else if (g.status === 'COMPLETED') enrollment.completed = count;
      else if (g.status === 'CANCELLED') enrollment.cancelled = count;
    }

    // ── Node distribution (active enrollments per node) ──
    const nodeGroups = await prisma.workflowEnrollment.groupBy({
      by: ['currentNodeId'],
      where: { workflowId: id, status: 'ACTIVE' },
      _count: { _all: true },
    });

    const nodeDistribution: Record<string, number> = {};
    for (const g of nodeGroups) {
      if (g.currentNodeId) {
        nodeDistribution[g.currentNodeId] = g._count._all;
      }
    }

    // ── Email events per node ─────────────────────────
    const events = await prisma.marketingEvent.findMany({
      where: { workflowId: id },
      select: { nodeId: true, emailId: true, eventType: true },
    });

    const nodeMetrics: Record<
      string,
      {
        sent: Set<string>;
        opened: Set<string>;
        clicked: Set<string>;
        bounced: Set<string>;
        unsubscribed: Set<string>;
      }
    > = {};

    const allSent = new Set<string>();
    const allOpened = new Set<string>();
    const allClicked = new Set<string>();
    const allBounced = new Set<string>();
    const allUnsubscribed = new Set<string>();

    for (const event of events) {
      const nid = event.nodeId || '_unknown';

      if (!nodeMetrics[nid]) {
        nodeMetrics[nid] = {
          sent: new Set(),
          opened: new Set(),
          clicked: new Set(),
          bounced: new Set(),
          unsubscribed: new Set(),
        };
      }
      const m = nodeMetrics[nid];

      switch (event.eventType) {
        case 'SENT':
          m.sent.add(event.emailId);
          allSent.add(event.emailId);
          break;
        case 'OPENED':
          m.opened.add(event.emailId);
          allOpened.add(event.emailId);
          break;
        case 'CLICKED':
          m.clicked.add(event.emailId);
          allClicked.add(event.emailId);
          break;
        case 'BOUNCED':
          m.bounced.add(event.emailId);
          allBounced.add(event.emailId);
          break;
        case 'UNSUBSCRIBED':
          m.unsubscribed.add(event.emailId);
          allUnsubscribed.add(event.emailId);
          break;
      }
    }

    const perNode: Record<
      string,
      {
        sent: number;
        opened: { count: number; rate: number };
        clicked: { count: number; rate: number };
        bounced: number;
        unsubscribed: number;
      }
    > = {};

    for (const [nid, m] of Object.entries(nodeMetrics)) {
      const s = m.sent.size;
      const o = m.opened.size;
      const c = m.clicked.size;
      perNode[nid] = {
        sent: s,
        opened: { count: o, rate: pct(o, s) },
        clicked: { count: c, rate: pct(c, s) },
        bounced: m.bounced.size,
        unsubscribed: m.unsubscribed.size,
      };
    }

    const totalSent = allSent.size;
    const totalOpened = allOpened.size;
    const totalClicked = allClicked.size;

    const aggregate = {
      totalSent,
      opens: { count: totalOpened, rate: pct(totalOpened, totalSent) },
      clicks: { count: totalClicked, rate: pct(totalClicked, totalSent) },
      ctor: { rate: pct(totalClicked, totalOpened) },
      unsubscribes: {
        count: allUnsubscribed.size,
        rate: pct(allUnsubscribed.size, totalSent),
      },
      bounces: {
        count: allBounced.size,
        rate: pct(allBounced.size, totalSent),
      },
    };

    return NextResponse.json({
      success: true,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        status: workflow.status,
        nodes: workflow.nodes,
        edges: workflow.edges,
        createdAt: workflow.createdAt,
      },
      enrollment,
      nodeDistribution,
      perNode,
      aggregate,
    });
  } catch (error) {
    console.error('Error fetching workflow report:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת דוח תהליך העבודה' },
      { status: 500 },
    );
  }
}
