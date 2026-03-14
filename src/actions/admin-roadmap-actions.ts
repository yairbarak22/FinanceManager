'use server';

import { requireAdmin } from '@/lib/adminHelpers';
import { prisma } from '@/lib/prisma';
import {
  createAdminTaskSchema,
  updateAdminTaskSchema,
  createAdminTaskGroupSchema,
  updateAdminTaskGroupSchema,
  updateAdminTaskGroupOrderSchema,
} from '@/lib/validationSchemas';
import type { RoadmapData, AdminTask, AdminTaskGroupWithTasks } from '@/types/admin-roadmap';

async function ensureAdmin() {
  const { userId, error } = await requireAdmin();
  if (error) throw new Error('Unauthorized - Admin access required');
  return userId;
}

// ---- Server Actions ----

export async function getRoadmapData(): Promise<RoadmapData> {
  await ensureAdmin();

  const groups = await prisma.adminTaskGroup.findMany({
    include: {
      tasks: {
        orderBy: { orderIndex: 'asc' },
      },
    },
    orderBy: { orderIndex: 'asc' },
  });

  return { groups };
}

export async function createTask(
  input: unknown
): Promise<AdminTask> {
  await ensureAdmin();
  const data = createAdminTaskSchema.parse(input);

  const maxOrder = await prisma.adminTask.findFirst({
    where: { groupId: data.groupId },
    orderBy: { orderIndex: 'desc' },
    select: { orderIndex: true },
  });

  const newTask = await prisma.adminTask.create({
    data: {
      groupId: data.groupId,
      title: data.title,
      ownerId: data.ownerId ?? null,
      status: data.status,
      priority: data.priority,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      orderIndex: (maxOrder?.orderIndex ?? -1) + 1,
    },
  });

  return newTask;
}

export async function updateTask(
  id: string,
  input: unknown
): Promise<AdminTask> {
  await ensureAdmin();
  const data = updateAdminTaskSchema.parse(input);

  const updatedTask = await prisma.adminTask.update({
    where: { id },
    data: {
      ...(data.groupId !== undefined && { groupId: data.groupId }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.startDate !== undefined && {
        startDate: data.startDate ? new Date(data.startDate) : null,
      }),
      ...(data.endDate !== undefined && {
        endDate: data.endDate ? new Date(data.endDate) : null,
      }),
      ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
    },
  });

  return updatedTask;
}

export async function updateTaskGroupOrder(
  input: unknown
): Promise<{ success: boolean }> {
  await ensureAdmin();
  const items = updateAdminTaskGroupOrderSchema.parse(input);

  await prisma.$transaction(
    items.map(({ id, orderIndex }) =>
      prisma.adminTaskGroup.update({
        where: { id },
        data: { orderIndex },
      })
    )
  );

  return { success: true };
}

export async function updateTaskGroup(
  id: string,
  input: unknown
): Promise<AdminTaskGroupWithTasks> {
  await ensureAdmin();
  const data = updateAdminTaskGroupSchema.parse(input);

  const updatedGroup = await prisma.adminTaskGroup.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.color !== undefined && { color: data.color }),
    },
    include: { tasks: true },
  });

  return updatedGroup;
}

export async function deleteTask(id: string): Promise<{ success: boolean }> {
  await ensureAdmin();
  await prisma.adminTask.delete({ where: { id } });
  return { success: true };
}

export async function createTaskGroup(
  input: unknown
): Promise<AdminTaskGroupWithTasks> {
  await ensureAdmin();
  const data = createAdminTaskGroupSchema.parse(input);

  const maxOrder = await prisma.adminTaskGroup.findFirst({
    orderBy: { orderIndex: 'desc' },
    select: { orderIndex: true },
  });

  const newGroup = await prisma.adminTaskGroup.create({
    data: {
      title: data.title,
      color: data.color,
      orderIndex: (maxOrder?.orderIndex ?? -1) + 1,
    },
    include: { tasks: true },
  });

  return newGroup;
}
