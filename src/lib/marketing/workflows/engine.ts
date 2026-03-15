import { prisma } from '@/lib/prisma';
import { MarketingEventType } from '@prisma/client';
import type {
  WorkflowGraph,
  WorkflowNode,
  WorkflowEdge,
  DelayUnit,
} from './types';
import { safeParseWorkflowGraph } from './types';

const MAX_ITERATIONS = 10;
const LOG_PREFIX = '[Workflow Engine]';

// ============================================
// STUB — will be replaced with real Resend integration
// ============================================

async function sendWorkflowEmail(params: {
  userId: string;
  email: string;
  subject: string;
  html: string;
  workflowId: string;
  nodeId: string;
}): Promise<{ id: string } | { error: string }> {
  console.log(`${LOG_PREFIX} Sending email`, {
    to: params.email,
    subject: params.subject,
    workflowId: params.workflowId,
    nodeId: params.nodeId,
  });
  // TODO: Wire up Resend via sendCampaignEmail from @/lib/marketing/resend
  // TODO: Store returned emailId for condition-node lookups
  return { id: `stub-email-${Date.now()}` };
}

// ============================================
// HELPERS
// ============================================

function calculateDelayEnd(amount: number, unit: DelayUnit): Date {
  const ms =
    unit === 'HOURS'
      ? amount * 60 * 60 * 1000
      : amount * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}

function findNextNode(
  graph: WorkflowGraph,
  currentNodeId: string,
  sourceHandle?: string,
): WorkflowNode | null {
  const edge = sourceHandle
    ? graph.edges.find(
        (e) => e.source === currentNodeId && e.sourceHandle === sourceHandle,
      )
    : graph.edges.find((e) => e.source === currentNodeId);

  if (!edge) return null;
  return graph.nodes.find((n) => n.id === edge.target) ?? null;
}

// ============================================
// ENROLLMENT TYPE (Prisma query result shape)
// ============================================

type EnrollmentWithRelations = Awaited<
  ReturnType<typeof queryDueEnrollments>
>[number];

async function queryDueEnrollments() {
  const now = new Date();
  return prisma.workflowEnrollment.findMany({
    where: {
      status: 'ACTIVE',
      OR: [{ nextWakeupAt: null }, { nextWakeupAt: { lte: now } }],
    },
    include: {
      workflow: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          isMarketingSubscribed: true,
        },
      },
    },
  });
}

// ============================================
// MAIN ENTRY POINT
// ============================================

export async function processDueEnrollments(): Promise<{
  processed: number;
  completed: number;
  failed: number;
  cancelled: number;
}> {
  const stats = { processed: 0, completed: 0, failed: 0, cancelled: 0 };

  const enrollments = await queryDueEnrollments();

  for (const enrollment of enrollments) {
    stats.processed++;

    if (!enrollment.user.isMarketingSubscribed) {
      await prisma.workflowEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'CANCELLED', nextWakeupAt: null },
      });
      stats.cancelled++;
      console.log(
        `${LOG_PREFIX} Cancelled enrollment ${enrollment.id} — user unsubscribed`,
      );
      continue;
    }

    try {
      const result = await processEnrollment(enrollment);
      if (result === 'COMPLETED') stats.completed++;
    } catch (err) {
      stats.failed++;
      console.error(
        `${LOG_PREFIX} Fatal error processing enrollment ${enrollment.id}:`,
        err,
      );
    }
  }

  console.log(`${LOG_PREFIX} Batch complete`, stats);
  return stats;
}

// ============================================
// CORE PROCESSING
// ============================================

async function processEnrollment(
  enrollment: EnrollmentWithRelations,
): Promise<'COMPLETED' | 'PAUSED' | 'CONTINUE'> {
  const parseResult = safeParseWorkflowGraph({
    nodes: enrollment.workflow.nodes,
    edges: enrollment.workflow.edges,
  });

  if (!parseResult.success) {
    console.error(
      `${LOG_PREFIX} Invalid graph for workflow ${enrollment.workflowId}:`,
      parseResult.error.issues,
    );
    await prisma.workflowEnrollment.update({
      where: { id: enrollment.id },
      data: { status: 'COMPLETED', nextWakeupAt: null },
    });
    return 'COMPLETED';
  }

  const graph = parseResult.data;
  let currentNodeId = enrollment.currentNodeId;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // ── Resolve current node ──────────────────────────────────────
    let currentNode: WorkflowNode | undefined;

    if (currentNodeId === null) {
      currentNode = graph.nodes.find((n) => n.type === 'TRIGGER');
    } else {
      currentNode = graph.nodes.find((n) => n.id === currentNodeId);
    }

    if (!currentNode) {
      await prisma.workflowEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'COMPLETED',
          currentNodeId: null,
          nextWakeupAt: null,
        },
      });
      return 'COMPLETED';
    }

    // ── Execute node ──────────────────────────────────────────────
    let nextNode: WorkflowNode | null = null;

    switch (currentNode.type) {
      case 'TRIGGER': {
        nextNode = findNextNode(graph, currentNode.id);
        break;
      }

      case 'EMAIL': {
        if (!enrollment.user.isMarketingSubscribed) {
          await prisma.workflowEnrollment.update({
            where: { id: enrollment.id },
            data: { status: 'CANCELLED', nextWakeupAt: null },
          });
          return 'COMPLETED';
        }

        const emailResult = await sendWorkflowEmail({
          userId: enrollment.userId,
          email: enrollment.user.email,
          subject: currentNode.data.subject,
          html: currentNode.data.htmlContent,
          workflowId: enrollment.workflowId,
          nodeId: currentNode.id,
        });

        if ('error' in emailResult) {
          console.error(
            `${LOG_PREFIX} Email failed at node ${currentNode.id} for enrollment ${enrollment.id}: ${emailResult.error}`,
          );
          return 'PAUSED';
        }

        nextNode = findNextNode(graph, currentNode.id);
        break;
      }

      case 'DELAY': {
        const justArrived =
          enrollment.nextWakeupAt === null ||
          (currentNodeId !== enrollment.currentNodeId);

        if (justArrived) {
          const wakeup = calculateDelayEnd(
            currentNode.data.amount,
            currentNode.data.unit,
          );
          await prisma.workflowEnrollment.update({
            where: { id: enrollment.id },
            data: {
              currentNodeId: currentNode.id,
              nextWakeupAt: wakeup,
            },
          });
          console.log(
            `${LOG_PREFIX} Enrollment ${enrollment.id} delayed until ${wakeup.toISOString()} at node ${currentNode.id}`,
          );
          return 'PAUSED';
        }

        // Delay is over — clear wakeup and advance
        await prisma.workflowEnrollment.update({
          where: { id: enrollment.id },
          data: { nextWakeupAt: null },
        });
        nextNode = findNextNode(graph, currentNode.id);
        break;
      }

      case 'CONDITION': {
        const eventType: MarketingEventType =
          currentNode.data.conditionType === 'OPENED_EMAIL'
            ? MarketingEventType.OPENED
            : MarketingEventType.CLICKED;

        const event = await prisma.marketingEvent.findFirst({
          where: {
            userId: enrollment.userId,
            eventType,
          },
        });

        const conditionMet = event !== null;

        const handle = conditionMet ? 'true' : 'false';
        nextNode = findNextNode(graph, currentNode.id, handle);

        if (!nextNode) {
          await prisma.workflowEnrollment.update({
            where: { id: enrollment.id },
            data: {
              status: 'COMPLETED',
              currentNodeId: null,
              nextWakeupAt: null,
            },
          });
          return 'COMPLETED';
        }
        break;
      }
    }

    // ── Edge traversal ────────────────────────────────────────────
    if (!nextNode) {
      await prisma.workflowEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'COMPLETED',
          currentNodeId: null,
          nextWakeupAt: null,
        },
      });
      return 'COMPLETED';
    }

    // Advance to the next node and loop again
    currentNodeId = nextNode.id;
    await prisma.workflowEnrollment.update({
      where: { id: enrollment.id },
      data: { currentNodeId: nextNode.id },
    });
  }

  console.warn(
    `${LOG_PREFIX} Enrollment ${enrollment.id} hit max iterations (${MAX_ITERATIONS})`,
  );
  return 'PAUSED';
}
