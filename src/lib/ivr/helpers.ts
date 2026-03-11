import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import {
  expenseCategories,
  harediExpenseCategories,
} from '@/lib/categories';

const BCRYPT_ROUNDS = 10;

export async function findUserByPhone(phoneNumber: string) {
  const ivrPin = await prisma.ivrPin.findFirst({
    where: { phoneNumber },
    include: { user: { select: { id: true, signupSource: true } } },
  });
  return ivrPin;
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

  return 'other';
}
