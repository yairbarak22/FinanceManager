/**
 * Maaser Expense Offsets API
 * ניהול קישורי קיזוז הוצאות-הכנסות לחישוב מעשרות
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

const MAX_CATEGORY_LENGTH = 100;
const MAX_OFFSETS_PER_USER = 50;

const offsetSchema = z.object({
  incomeCategory: z.string().min(1).max(MAX_CATEGORY_LENGTH).trim(),
  expenseCategory: z.string().min(1).max(MAX_CATEGORY_LENGTH).trim(),
});

const batchOffsetSchema = z.object({
  offsets: z.array(offsetSchema).max(MAX_OFFSETS_PER_USER),
});

const deleteSchema = z.object({
  incomeCategory: z.string().min(1).max(MAX_CATEGORY_LENGTH).trim(),
  expenseCategory: z.string().min(1).max(MAX_CATEGORY_LENGTH).trim(),
});

/**
 * GET /api/maaser-offsets
 * שליפת כל קישורי הקיזוז של המשתמש
 */
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' },
        { status: 429 }
      );
    }

    const offsets = await prisma.maaserExpenseOffset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(offsets);
  } catch (err) {
    console.error('Error fetching maaser offsets:', err);
    return NextResponse.json(
      { error: 'שגיאה בטעינת הגדרות קיזוז' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/maaser-offsets
 * שמירת קישורי קיזוז (batch upsert - מחליף את כל הקישורים הקיימים)
 * Body: { offsets: Array<{ incomeCategory: string, expenseCategory: string }> }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = batchOffsetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { offsets } = parsed.data;

    // Prevent duplicate expense categories across income categories (1:N constraint)
    const expenseCategorySeen = new Map<string, string>();
    for (const offset of offsets) {
      const existing = expenseCategorySeen.get(offset.expenseCategory);
      if (existing && existing !== offset.incomeCategory) {
        return NextResponse.json(
          {
            error: `קטגוריית הוצאה "${offset.expenseCategory}" כבר מקושרת לקטגוריית הכנסה אחרת`,
          },
          { status: 400 }
        );
      }
      expenseCategorySeen.set(offset.expenseCategory, offset.incomeCategory);
    }

    // Replace all offsets in a transaction
    const results = await prisma.$transaction(async (tx) => {
      await tx.maaserExpenseOffset.deleteMany({ where: { userId } });

      if (offsets.length === 0) return [];

      await tx.maaserExpenseOffset.createMany({
        data: offsets.map((o) => ({
          userId,
          incomeCategory: o.incomeCategory,
          expenseCategory: o.expenseCategory,
        })),
      });

      return tx.maaserExpenseOffset.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error('Error saving maaser offsets:', err);
    return NextResponse.json(
      { error: 'שגיאה בשמירת הגדרות קיזוז' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/maaser-offsets
 * מחיקת קישור קיזוז בודד
 * Body: { incomeCategory: string, expenseCategory: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'נתונים לא תקינים', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { incomeCategory, expenseCategory } = parsed.data;

    await prisma.maaserExpenseOffset.deleteMany({
      where: {
        userId,
        incomeCategory,
        expenseCategory,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting maaser offset:', err);
    return NextResponse.json(
      { error: 'שגיאה במחיקת קישור קיזוז' },
      { status: 500 }
    );
  }
}
