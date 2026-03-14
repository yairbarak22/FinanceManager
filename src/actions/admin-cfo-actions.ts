'use server';

import { requireAdmin } from '@/lib/adminHelpers';
import { prisma } from '@/lib/prisma';
import {
  createAdminSubscriptionSchema,
  updateAdminSubscriptionSchema,
  createAdminTransactionSchema,
  updateAdminTransactionSchema,
} from '@/lib/validationSchemas';
import type {
  CfoData,
  AdminSubscription,
  AdminTransaction,
} from '@/types/admin-cfo';

async function ensureAdmin() {
  const { userId, error } = await requireAdmin();
  if (error) throw new Error('Unauthorized - Admin access required');
  return userId;
}

export async function getCfoData(): Promise<CfoData> {
  await ensureAdmin();

  const subscriptions = await prisma.adminSubscription.findMany({
    orderBy: { nextBillingDate: 'asc' },
  });
  const transactions = await prisma.adminTransaction.findMany({
    orderBy: { date: 'desc' },
  });

  return { subscriptions, transactions };
}

export async function createSubscription(
  input: unknown
): Promise<AdminSubscription> {
  await ensureAdmin();
  const data = createAdminSubscriptionSchema.parse(input);

  return prisma.adminSubscription.create({
    data: {
      title: data.title,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      billingCycle: data.billingCycle,
      nextBillingDate: new Date(data.nextBillingDate),
      status: data.status,
    },
  });
}

export async function updateSubscription(
  id: string,
  input: unknown
): Promise<AdminSubscription> {
  await ensureAdmin();
  const data = updateAdminSubscriptionSchema.parse(input);

  return prisma.adminSubscription.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.billingCycle !== undefined && { billingCycle: data.billingCycle }),
      ...(data.nextBillingDate !== undefined && {
        nextBillingDate: new Date(data.nextBillingDate),
      }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });
}

export async function deleteSubscription(
  id: string
): Promise<{ success: boolean }> {
  await ensureAdmin();
  await prisma.adminSubscription.delete({ where: { id } });
  return { success: true };
}

export async function createTransaction(
  input: unknown
): Promise<AdminTransaction> {
  await ensureAdmin();
  const data = createAdminTransactionSchema.parse(input);

  return prisma.adminTransaction.create({
    data: {
      title: data.title,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      date: new Date(data.date),
      status: data.status,
      receiptUrl: data.receiptUrl ?? null,
    },
  });
}

export async function updateTransaction(
  id: string,
  input: unknown
): Promise<AdminTransaction> {
  await ensureAdmin();
  const data = updateAdminTransactionSchema.parse(input);

  return prisma.adminTransaction.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.receiptUrl !== undefined && { receiptUrl: data.receiptUrl }),
    },
  });
}

export async function deleteTransaction(
  id: string
): Promise<{ success: boolean }> {
  await ensureAdmin();
  await prisma.adminTransaction.delete({ where: { id } });
  return { success: true };
}
