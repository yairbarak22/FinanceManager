/**
 * Maaser Preferences API
 * ניהול העדפות מעשרות/חומש למשתמש - שמירת זיכרון מערכת למקורות הכנסה
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

/**
 * GET /api/maaser-preferences
 * שליפת כל העדפות המשתמש
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

    const preferences = await prisma.maaserPreference.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(preferences);
  } catch (err) {
    console.error('Error fetching maaser preferences:', err);
    return NextResponse.json(
      { error: 'Failed to fetch maaser preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/maaser-preferences
 * יצירת/עדכון העדפה (upsert לפי incomeSource)
 * Body: { incomeSource: string, incomeCategory?: string, isObligated: boolean, calculationType?: "maaser" | "chomesh" }
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

    // Validate required fields
    if (!body.incomeSource || typeof body.incomeSource !== 'string') {
      return NextResponse.json(
        { error: 'incomeSource is required and must be a string' },
        { status: 400 }
      );
    }

    if (body.incomeSource.length > 200) {
      return NextResponse.json(
        { error: 'incomeSource too long (max 200 characters)' },
        { status: 400 }
      );
    }

    if (typeof body.isObligated !== 'boolean') {
      return NextResponse.json(
        { error: 'isObligated is required and must be a boolean' },
        { status: 400 }
      );
    }

    // Validate calculationType if provided
    const validTypes = ['maaser', 'chomesh'];
    if (body.calculationType && !validTypes.includes(body.calculationType)) {
      return NextResponse.json(
        { error: 'calculationType must be "maaser" or "chomesh"' },
        { status: 400 }
      );
    }

    // Upsert: create or update based on userId + incomeSource
    const preference = await prisma.maaserPreference.upsert({
      where: {
        userId_incomeSource: {
          userId,
          incomeSource: body.incomeSource.trim(),
        },
      },
      update: {
        isObligated: body.isObligated,
        calculationType: body.calculationType || 'maaser',
        incomeCategory: body.incomeCategory?.trim() || null,
      },
      create: {
        userId,
        incomeSource: body.incomeSource.trim(),
        incomeCategory: body.incomeCategory?.trim() || null,
        isObligated: body.isObligated,
        calculationType: body.calculationType || 'maaser',
      },
    });

    return NextResponse.json(preference);
  } catch (err) {
    console.error('Error saving maaser preference:', err);
    return NextResponse.json(
      { error: 'Failed to save maaser preference' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/maaser-preferences
 * עדכון מרובה של העדפות (batch upsert)
 * Body: { preferences: Array<{ incomeSource: string, incomeCategory?: string, isObligated: boolean, calculationType?: "maaser" | "chomesh" }> }
 */
export async function PUT(request: NextRequest) {
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

    if (!Array.isArray(body.preferences)) {
      return NextResponse.json(
        { error: 'preferences must be an array' },
        { status: 400 }
      );
    }

    if (body.preferences.length > 100) {
      return NextResponse.json(
        { error: 'Too many preferences (max 100)' },
        { status: 400 }
      );
    }

    // Validate all preferences
    const validTypes = ['maaser', 'chomesh'];
    for (const pref of body.preferences) {
      if (!pref.incomeSource || typeof pref.incomeSource !== 'string') {
        return NextResponse.json(
          { error: 'Each preference must have a valid incomeSource' },
          { status: 400 }
        );
      }
      if (typeof pref.isObligated !== 'boolean') {
        return NextResponse.json(
          { error: 'Each preference must have a valid isObligated boolean' },
          { status: 400 }
        );
      }
      if (pref.calculationType && !validTypes.includes(pref.calculationType)) {
        return NextResponse.json(
          { error: 'calculationType must be "maaser" or "chomesh"' },
          { status: 400 }
        );
      }
    }

    // Batch upsert using transaction
    const results = await prisma.$transaction(
      body.preferences.map(
        (pref: {
          incomeSource: string;
          incomeCategory?: string;
          isObligated: boolean;
          calculationType?: string;
        }) =>
          prisma.maaserPreference.upsert({
            where: {
              userId_incomeSource: {
                userId,
                incomeSource: pref.incomeSource.trim(),
              },
            },
            update: {
              isObligated: pref.isObligated,
              calculationType: pref.calculationType || 'maaser',
              incomeCategory: pref.incomeCategory?.trim() || null,
            },
            create: {
              userId,
              incomeSource: pref.incomeSource.trim(),
              incomeCategory: pref.incomeCategory?.trim() || null,
              isObligated: pref.isObligated,
              calculationType: pref.calculationType || 'maaser',
            },
          })
      )
    );

    return NextResponse.json(results);
  } catch (err) {
    console.error('Error batch updating maaser preferences:', err);
    return NextResponse.json(
      { error: 'Failed to batch update maaser preferences' },
      { status: 500 }
    );
  }
}

