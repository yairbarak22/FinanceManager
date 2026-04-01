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
const RESEND_SEND_GAP_MS = 250;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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

  await sleep(RESEND_SEND_GAP_MS);

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
      conditionWaitingSince: null, // exclude enrollments parked at CONDITION nodes
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

    if (enrollment.workflow.status !== 'ACTIVE') {
      console.log(
        `${LOG_PREFIX} Skipping enrollment ${enrollment.id} — workflow ${enrollment.workflow.id} is ${enrollment.workflow.status}`,
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

        if (event) {
          // Condition already met — advance to "true" branch
          nextNode = findNextNode(graph, currentNode.id, 'true');
          // Clear conditionWaitingSince in case it was set
          await prisma.workflowEnrollment.update({
            where: { id: enrollment.id },
            data: { conditionWaitingSince: null },
          });
        } else {
          // Not met yet — park here for the hourly re-evaluation cron
          await prisma.workflowEnrollment.update({
            where: { id: enrollment.id },
            data: {
              currentNodeId: currentNode.id,
              conditionWaitingSince: enrollment.conditionWaitingSince ?? new Date(),
              nextWakeupAt: null,
            },
          });
          console.log(
            `${LOG_PREFIX} Enrollment ${enrollment.id} parked at CONDITION node ${currentNode.id} for hourly re-evaluation`,
          );
          return 'PAUSED';
        }

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

// ============================================
// CONDITION RE-EVALUATION (called by hourly cron)
// ============================================

/**
 * Collect all node IDs reachable from a given edge handle of a node.
 */
function collectDescendantNodeIds(
  graph: WorkflowGraph,
  sourceNodeId: string,
  sourceHandle?: string,
): Set<string> {
  const ids = new Set<string>();
  const startEdges = graph.edges.filter(
    (e) =>
      e.source === sourceNodeId &&
      (sourceHandle ? e.sourceHandle === sourceHandle : true),
  );
  const queue = startEdges.map((e) => e.target);
  while (queue.length > 0) {
    const id = queue.pop()!;
    if (ids.has(id)) continue;
    ids.add(id);
    for (const edge of graph.edges) {
      if (edge.source === id) queue.push(edge.target);
    }
  }
  return ids;
}

export async function reevaluateConditions(options?: {
  workflowId?: string;
  nodeId?: string;
}): Promise<{
  processed: number;
  advanced: number;
  timedOut: number;
  failed: number;
  reclaimed: number;
}> {
  const stats = { processed: 0, advanced: 0, timedOut: 0, failed: 0, reclaimed: 0 };

  // ── Step 1: Find enrollments properly parked at CONDITION nodes ──
  const whereClause: {
    status: 'ACTIVE';
    conditionWaitingSince: { not: null };
    workflowId?: string;
    currentNodeId?: string;
  } = {
    status: 'ACTIVE',
    conditionWaitingSince: { not: null },
  };
  if (options?.workflowId) whereClause.workflowId = options.workflowId;
  if (options?.nodeId) whereClause.currentNodeId = options.nodeId;

  const enrollments = await prisma.workflowEnrollment.findMany({
    where: whereClause,
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

  // ── Step 2: If a specific condition nodeId was requested, also reclaim
  //    enrollments that were misrouted to the "false" branch by the old
  //    engine but actually met the condition (e.g. opened the email). ──
  if (options?.workflowId && options?.nodeId) {
    const misrouted = await reclaimMisroutedEnrollments(
      options.workflowId,
      options.nodeId,
    );
    stats.reclaimed = misrouted.reclaimed;
    stats.advanced += misrouted.reclaimed;

    // Re-query to include newly reclaimed enrollments that are now at the condition
    if (misrouted.reclaimed > 0) {
      const freshEnrollments = await prisma.workflowEnrollment.findMany({
        where: {
          status: 'ACTIVE',
          conditionWaitingSince: { not: null },
          workflowId: options.workflowId,
          currentNodeId: options.nodeId,
        },
        include: {
          workflow: true,
          user: {
            select: { id: true, email: true, name: true, isMarketingSubscribed: true },
          },
        },
      });
      // Add only newly reclaimed ones (not already in list)
      const existingIds = new Set(enrollments.map((e) => e.id));
      for (const e of freshEnrollments) {
        if (!existingIds.has(e.id)) enrollments.push(e);
      }
    }
  }

  // ── Step 3: Process enrollments at condition nodes ──
  const byWorkflow = new Map<string, typeof enrollments>();
  for (const enrollment of enrollments) {
    if (enrollment.workflow.status !== 'ACTIVE') continue;
    const list = byWorkflow.get(enrollment.workflowId) ?? [];
    list.push(enrollment);
    byWorkflow.set(enrollment.workflowId, list);
  }

  for (const [, workflowEnrollments] of byWorkflow) {
    const first = workflowEnrollments[0];
    const parseResult = safeParseWorkflowGraph({
      nodes: first.workflow.nodes,
      edges: first.workflow.edges,
    });

    if (!parseResult.success) {
      console.error(
        `${LOG_PREFIX} Invalid graph for workflow ${first.workflowId}`,
      );
      stats.failed += workflowEnrollments.length;
      continue;
    }

    const graph = parseResult.data;

    for (const enrollment of workflowEnrollments) {
      stats.processed++;

      try {
        const currentNode = graph.nodes.find(
          (n) => n.id === enrollment.currentNodeId,
        );

        if (!currentNode || currentNode.type !== 'CONDITION') {
          await prisma.workflowEnrollment.update({
            where: { id: enrollment.id },
            data: { conditionWaitingSince: null },
          });
          continue;
        }

        const eventType: MarketingEventType =
          currentNode.data.conditionType === 'OPENED_EMAIL'
            ? MarketingEventType.OPENED
            : MarketingEventType.CLICKED;

        const conditionWhere: {
          userId: string;
          eventType: MarketingEventType;
          workflowId: string;
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

        const waitHours = currentNode.data.waitHours ?? 72;
        const waitingSince = enrollment.conditionWaitingSince!;
        const elapsed = Date.now() - waitingSince.getTime();
        const timedOut = elapsed >= waitHours * 3600_000;

        let handle: 'true' | 'false';
        if (event) {
          handle = 'true';
          stats.advanced++;
        } else if (timedOut) {
          handle = 'false';
          stats.timedOut++;
        } else {
          // Still waiting — skip
          continue;
        }

        const nextNode = findNextNode(graph, currentNode.id, handle);

        // Clear condition state
        await prisma.workflowEnrollment.update({
          where: { id: enrollment.id },
          data: {
            conditionWaitingSince: null,
            currentNodeId: nextNode?.id ?? null,
            nextWakeupAt: null,
          },
        });

        if (!nextNode) {
          await markCompletedAndGraduate(enrollment);
          continue;
        }

        // Continue processing from the next node via the normal engine
        try {
          await processEnrollment(enrollment);
        } catch (err) {
          console.error(
            `${LOG_PREFIX} Error continuing enrollment ${enrollment.id} after condition:`,
            err,
          );
          stats.failed++;
        }
      } catch (err) {
        stats.failed++;
        console.error(
          `${LOG_PREFIX} Error re-evaluating condition for enrollment ${enrollment.id}:`,
          err,
        );
      }
    }
  }

  console.log(`${LOG_PREFIX} Condition re-evaluation complete`, stats);
  return stats;
}

// ============================================
// RECLAIM MISROUTED ENROLLMENTS
// ============================================

/**
 * Find enrollments that were instantly routed to the "false" branch of a
 * CONDITION node (by the old engine code) but actually met the condition.
 * Moves them back to the condition node and sets conditionWaitingSince so
 * the normal reevaluate logic picks them up.
 */
async function reclaimMisroutedEnrollments(
  workflowId: string,
  conditionNodeId: string,
): Promise<{ reclaimed: number }> {
  const workflow = await prisma.automationWorkflow.findUnique({
    where: { id: workflowId },
  });
  if (!workflow) return { reclaimed: 0 };

  const parseResult = safeParseWorkflowGraph({
    nodes: workflow.nodes,
    edges: workflow.edges,
  });
  if (!parseResult.success) return { reclaimed: 0 };

  const graph = parseResult.data;
  const conditionNode = graph.nodes.find(
    (n) => n.id === conditionNodeId && n.type === 'CONDITION',
  );
  if (!conditionNode || conditionNode.type !== 'CONDITION') return { reclaimed: 0 };

  // Find all node IDs downstream of the "false" branch
  const falseBranchIds = collectDescendantNodeIds(graph, conditionNodeId, 'false');
  if (falseBranchIds.size === 0) return { reclaimed: 0 };

  // Find active enrollments sitting at those nodes
  const misrouted = await prisma.workflowEnrollment.findMany({
    where: {
      workflowId,
      status: 'ACTIVE',
      currentNodeId: { in: [...falseBranchIds] },
    },
    select: { id: true, userId: true },
  });

  if (misrouted.length === 0) return { reclaimed: 0 };

  // Check which of them actually met the condition
  const eventType: MarketingEventType =
    conditionNode.data.conditionType === 'OPENED_EMAIL'
      ? MarketingEventType.OPENED
      : MarketingEventType.CLICKED;

  const userIds = misrouted.map((e) => e.userId);

  const events = await prisma.marketingEvent.findMany({
    where: {
      workflowId,
      eventType,
      userId: { in: userIds },
      ...(conditionNode.data.targetEmailNodeId
        ? { nodeId: conditionNode.data.targetEmailNodeId }
        : {}),
    },
    select: { userId: true },
  });

  const metConditionUserIds = new Set(events.map((e) => e.userId));
  const toReclaim = misrouted.filter((e) => metConditionUserIds.has(e.userId));

  if (toReclaim.length === 0) return { reclaimed: 0 };

  // Move them back to the condition node for proper routing
  await prisma.workflowEnrollment.updateMany({
    where: { id: { in: toReclaim.map((e) => e.id) } },
    data: {
      currentNodeId: conditionNodeId,
      conditionWaitingSince: new Date(),
      nextWakeupAt: null,
    },
  });

  console.log(
    `${LOG_PREFIX} Reclaimed ${toReclaim.length} misrouted enrollments back to condition ${conditionNodeId}`,
  );

  return { reclaimed: toReclaim.length };
}
