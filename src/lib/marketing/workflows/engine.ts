import { prisma } from '@/lib/prisma';
import { MarketingEventType } from '@prisma/client';
import { sendWorkflowEmail as resendWorkflowEmail } from '@/lib/marketing/resend';
import { getWorkflowSenderFromHeader } from '@/lib/marketing/workflowSenderProfiles';
import {
  graduateOnboardingToActive,
  moveUnsubscribedToInactive,
} from '@/lib/marketingGroups';
import type {
  WorkflowGraph,
  WorkflowNode,
  WorkflowEdge,
  DelayUnit,
} from './types';
import { safeParseWorkflowGraph } from './types';

const MAX_ITERATIONS = 10;
const LOG_PREFIX = '[Workflow Engine]';

/**
 * Send a workflow email via Resend, then persist a SENT MarketingEvent
 * so that condition nodes and webhook handlers can track opens/clicks.
 */
async function sendAndRecordEmail(params: {
  userId: string;
  email: string;
  subject: string;
  html: string;
  workflowId: string;
  nodeId: string;
  from?: string;
}): Promise<{ id: string } | { error: string }> {
  const result = await resendWorkflowEmail({
    to: params.email,
    subject: params.subject,
    html: params.html,
    userId: params.userId,
    workflowId: params.workflowId,
    nodeId: params.nodeId,
    from: params.from,
  });

  if ('error' in result) {
    return result;
  }

  try {
    await prisma.marketingEvent.create({
      data: {
        workflowId: params.workflowId,
        nodeId: params.nodeId,
        userId: params.userId,
        emailId: result.id,
        eventType: MarketingEventType.SENT,
        metadata: {
          nodeId: params.nodeId,
          workflowId: params.workflowId,
        },
      },
    });
  } catch (err) {
    console.error(`${LOG_PREFIX} Failed to record SENT event for email ${result.id}:`, err);
  }

  return result;
}

// ============================================
// HELPERS
// ============================================

/**
 * Replace user-facing merge placeholders (e.g. [שם המשתמש]) with real values,
 * consistent with the campaign cron in smart-send/route.ts.
 */
function applyWorkflowMergeFields(
  text: string,
  user: { name: string | null },
): string {
  const displayName = user.name?.trim() || 'משתמש';
  return text.replace(/\[שם המשתמש\]/g, displayName);
}

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
      await moveUnsubscribedToInactive(enrollment.userId);
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

async function markCompletedAndGraduate(
  enrollment: EnrollmentWithRelations,
): Promise<void> {
  await prisma.workflowEnrollment.update({
    where: { id: enrollment.id },
    data: { status: 'COMPLETED', currentNodeId: null, nextWakeupAt: null },
  });
  if (enrollment.workflow.promoteToActiveOnComplete) {
    await graduateOnboardingToActive(enrollment.userId);
  }
}

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
      await markCompletedAndGraduate(enrollment);
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
          await moveUnsubscribedToInactive(enrollment.userId);
          return 'COMPLETED';
        }

        const mergedSubject = applyWorkflowMergeFields(currentNode.data.subject, enrollment.user);
        const mergedHtml = applyWorkflowMergeFields(currentNode.data.htmlContent, enrollment.user);
        const from = getWorkflowSenderFromHeader(currentNode.data.senderProfileId);

        const emailResult = await sendAndRecordEmail({
          userId: enrollment.userId,
          email: enrollment.user.email,
          subject: mergedSubject,
          html: mergedHtml,
          workflowId: enrollment.workflowId,
          nodeId: currentNode.id,
          from,
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

        const conditionWhere: {
          userId: string;
          eventType: MarketingEventType;
          workflowId?: string;
          nodeId?: string;
        } = {
          userId: enrollment.userId,
          eventType,
          workflowId: enrollment.workflowId,
        };

        if (currentNode.data.targetEmailNodeId) {
          conditionWhere.nodeId = currentNode.data.targetEmailNodeId;
        }

        const event = await prisma.marketingEvent.findFirst({
          where: conditionWhere,
        });

        const conditionMet = event !== null;

        const handle = conditionMet ? 'true' : 'false';
        nextNode = findNextNode(graph, currentNode.id, handle);

        if (!nextNode) {
          await markCompletedAndGraduate(enrollment);
          return 'COMPLETED';
        }
        break;
      }
    }

    // ── Edge traversal ────────────────────────────────────────────
    if (!nextNode) {
      await markCompletedAndGraduate(enrollment);
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
