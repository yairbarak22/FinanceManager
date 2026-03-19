/**
 * "פעילים" (Active) - Base user group for marketing.
 * New users are added on signup; removed when they unsubscribe from marketing.
 */

import { prisma } from '@/lib/prisma';

const ACTIVE_GROUP_NAME = 'פעילים';

/**
 * Get or create the "פעילים" base group.
 * When creating, uses creatorUserId (e.g. the new user on first signup).
 */
export async function getOrCreateActiveGroup(
  creatorUserId: string,
): Promise<string> {
  let group = await prisma.userGroup.findFirst({
    where: { name: ACTIVE_GROUP_NAME },
    select: { id: true },
  });

  if (!group) {
    group = await prisma.userGroup.create({
      data: {
        name: ACTIVE_GROUP_NAME,
        description: 'משתמשים פעילים המנויים לדיוור — נוספו אוטומטית בהרשמה',
        createdBy: creatorUserId,
      },
      select: { id: true },
    });
    console.log(`[ActiveGroup] Created base group "${ACTIVE_GROUP_NAME}"`);
  }

  return group.id;
}

/**
 * Add a user to the "פעילים" group.
 * Called when a new user registers.
 */
export async function addUserToActiveGroup(userId: string): Promise<void> {
  try {
    const groupId = await getOrCreateActiveGroup(userId);
    await prisma.userGroupMember.upsert({
      where: {
        groupId_userId: { groupId, userId },
      },
      create: { groupId, userId },
      update: {},
    });
  } catch (error) {
    console.error('[ActiveGroup] Failed to add user to פעילים:', error);
  }
}

/**
 * Remove a user from the "פעילים" group.
 * Called when a user unsubscribes from marketing.
 */
export async function removeUserFromActiveGroup(userId: string): Promise<void> {
  try {
    const group = await prisma.userGroup.findFirst({
      where: { name: ACTIVE_GROUP_NAME },
      select: { id: true },
    });

    if (group) {
      await prisma.userGroupMember.deleteMany({
        where: { groupId: group.id, userId },
      });
    }
  } catch (error) {
    console.error('[ActiveGroup] Failed to remove user from פעילים:', error);
  }
}
