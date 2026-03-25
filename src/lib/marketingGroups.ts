/**
 * Marketing user-group management.
 *
 * Three fixed groups govern the onboarding lifecycle:
 *   - "onboarding"  — user just signed up, inside a workflow
 *   - "פעילים"      — completed onboarding successfully
 *   - "לא פעילים"   — unsubscribed from marketing at any stage
 *
 * All mutations are idempotent (upsert / deleteMany).
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const ONBOARDING_GROUP_NAME = 'onboarding';
const ACTIVE_GROUP_NAME = 'פעילים';
const INACTIVE_GROUP_NAME = 'לא פעילים';

// ── generic helpers ────────────────────────────────────────

async function getOrCreateGroup(
  name: string,
  description: string,
  creatorUserId: string,
): Promise<string> {
  let group = await prisma.userGroup.findFirst({
    where: { name },
    select: { id: true },
  });

  if (!group) {
    group = await prisma.userGroup.create({
      data: { name, description, createdBy: creatorUserId },
      select: { id: true },
    });
    console.log(`[MarketingGroups] Created group "${name}"`);
  }

  return group.id;
}

async function addToGroup(groupId: string, userId: string): Promise<void> {
  await prisma.userGroupMember.upsert({
    where: { groupId_userId: { groupId, userId } },
    create: { groupId, userId },
    update: {},
  });
}

async function removeFromGroup(groupName: string, userId: string): Promise<void> {
  const group = await prisma.userGroup.findFirst({
    where: { name: groupName },
    select: { id: true },
  });
  if (group) {
    await prisma.userGroupMember.deleteMany({
      where: { groupId: group.id, userId },
    });
  }
}

// ── public API ─────────────────────────────────────────────

export async function addUserToOnboardingGroup(userId: string): Promise<void> {
  try {
    const groupId = await getOrCreateGroup(
      ONBOARDING_GROUP_NAME,
      'משתמשים חדשים בתהליך אונבורדינג',
      userId,
    );
    await addToGroup(groupId, userId);
  } catch (error) {
    console.error('[MarketingGroups] Failed to add user to onboarding:', error);
  }
}

export async function addUserToActiveGroup(userId: string): Promise<void> {
  try {
    const groupId = await getOrCreateGroup(
      ACTIVE_GROUP_NAME,
      'משתמשים פעילים המנויים לדיוור — השלימו אונבורדינג',
      userId,
    );
    await addToGroup(groupId, userId);
  } catch (error) {
    console.error('[MarketingGroups] Failed to add user to פעילים:', error);
  }
}

export async function removeUserFromActiveGroup(userId: string): Promise<void> {
  try {
    await removeFromGroup(ACTIVE_GROUP_NAME, userId);
  } catch (error) {
    console.error('[MarketingGroups] Failed to remove user from פעילים:', error);
  }
}

/**
 * User completed the onboarding workflow successfully.
 * Move from onboarding -> פעילים.
 */
export async function graduateOnboardingToActive(userId: string): Promise<void> {
  try {
    await removeFromGroup(ONBOARDING_GROUP_NAME, userId);
    await addUserToActiveGroup(userId);
    console.log(`[MarketingGroups] Graduated user ${userId} to פעילים`);
  } catch (error) {
    console.error('[MarketingGroups] Failed to graduate user:', error);
  }
}

/**
 * User unsubscribed from marketing.
 * Remove from onboarding & פעילים, add to לא פעילים.
 */
export async function moveUnsubscribedToInactive(userId: string): Promise<void> {
  try {
    await removeFromGroup(ONBOARDING_GROUP_NAME, userId);
    await removeFromGroup(ACTIVE_GROUP_NAME, userId);

    const groupId = await getOrCreateGroup(
      INACTIVE_GROUP_NAME,
      'משתמשים שביטלו מנוי לדיוור שיווקי',
      userId,
    );
    await addToGroup(groupId, userId);
    console.log(`[MarketingGroups] Moved user ${userId} to לא פעילים`);
  } catch (error) {
    console.error('[MarketingGroups] Failed to move user to לא פעילים:', error);
  }
}

/**
 * Auto-enroll a new user in every ACTIVE workflow with trigger USER_REGISTERED.
 */
export async function enrollNewUserInRegistrationWorkflows(
  userId: string,
): Promise<void> {
  const workflows = await prisma.automationWorkflow.findMany({
    where: { status: 'ACTIVE', triggerType: 'USER_REGISTERED' },
    select: { id: true },
  });

  for (const wf of workflows) {
    try {
      await prisma.workflowEnrollment.create({
        data: {
          workflowId: wf.id,
          userId,
          status: 'ACTIVE',
          currentNodeId: null,
          nextWakeupAt: null,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        continue; // already enrolled
      }
      console.error(
        `[MarketingGroups] Failed to enroll user ${userId} in workflow ${wf.id}:`,
        err,
      );
    }
  }
}
