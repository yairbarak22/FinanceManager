import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import {
  expenseCategories,
  harediExpenseCategories,
  incomeCategories,
} from '@/lib/categories';

const BCRYPT_ROUNDS = 10;
export const MAX_REPORTING_PHONES = 3;

/**
 * Normalize any phone string to the local Israeli format used in the DB
 * (e.g. "0501234567"). Handles +972, whatsapp: prefix, dashes/spaces.
 */
export function normalizePhone(raw: string): string {
  let phone = raw.replace(/^whatsapp:/i, '').trim();
  phone = phone.replace(/[\s\-()]/g, '');
  if (phone.startsWith('+972')) {
    phone = '0' + phone.slice(4);
  }
  return phone;
}

export async function findUserByPhone(phoneNumber: string) {
  const reportingPhone = await prisma.reportingPhone.findUnique({
    where: { phoneNumber: normalizePhone(phoneNumber) },
    include: {
      user: {
        select: {
          id: true,
          signupSource: true,
          ivrPin: { select: { hashedPin: true } },
        },
      },
    },
  });
  if (!reportingPhone || !reportingPhone.user.ivrPin) return null;
  return {
    hashedPin: reportingPhone.user.ivrPin.hashedPin,
    user: { id: reportingPhone.user.id, signupSource: reportingPhone.user.signupSource },
  };
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

export async function validatePin(userId: string, pin: string): Promise<boolean> {
  const ivrPin = await prisma.ivrPin.findUnique({
    where: { userId },
  });
  if (!ivrPin) return false;
  return bcrypt.compare(pin, ivrPin.hashedPin);
}

export async function getUserExpenseCategories(
  userId: string,
  isHaredi: boolean
): Promise<Array<{ id: string; nameHe: string }>> {
  const defaults = expenseCategories.map((c) => ({
    id: c.id,
    nameHe: c.nameHe,
  }));

  if (isHaredi) {
    for (const c of harediExpenseCategories) {
      defaults.push({ id: c.id, nameHe: c.nameHe });
    }
  }

  const customs = await prisma.customCategory.findMany({
    where: { userId, type: 'expense' },
    select: { id: true, name: true },
  });

  for (const c of customs) {
    defaults.push({ id: c.id, nameHe: c.name });
  }

  return defaults;
}

export async function getUserIncomeCategories(
  userId: string
): Promise<Array<{ id: string; nameHe: string }>> {
  const defaults = incomeCategories.map((c) => ({
    id: c.id,
    nameHe: c.nameHe,
  }));

  const customs = await prisma.customCategory.findMany({
    where: { userId, type: 'income' },
    select: { id: true, name: true },
  });

  for (const c of customs) {
    defaults.push({ id: c.id, nameHe: c.name });
  }

  return defaults;
}

/**
 * Simple category matching: exact or partial match against Hebrew names.
 * Returns the category id, or 'other' if no match found.
 */
export function matchCategory(
  spokenText: string,
  categories: Array<{ id: string; nameHe: string }>
): string {
  const normalized = spokenText.trim().toLowerCase();
  if (!normalized) return 'other';

  // Exact match
  for (const cat of categories) {
    if (cat.nameHe.toLowerCase() === normalized) {
      return cat.id;
    }
  }

  // Partial match: spoken text contains category name or vice versa
  for (const cat of categories) {
    const catName = cat.nameHe.toLowerCase();
    if (normalized.includes(catName) || catName.includes(normalized)) {
      return cat.id;
    }
  }

  console.log(`[IVR] Category not matched for text: "${spokenText}"`);
  return 'other';
}
