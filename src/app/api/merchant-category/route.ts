import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

const merchantCategorySchema = z.object({
  merchantName: z.string().trim().min(1, 'merchantName is required').max(255),
  category: z.string().optional(),
  alwaysAsk: z.boolean().optional(),
});

// Update or create merchant category mapping
export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = merchantCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { merchantName, category, alwaysAsk } = parsed.data;

    const mapping = await prisma.merchantCategoryMap.upsert({
      where: {
        userId_merchantName: {
          userId,
          merchantName: merchantName.toLowerCase(),
        },
      },
      update: {
        category: category ?? '',
        alwaysAsk: alwaysAsk ?? false,
        isManual: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        merchantName: merchantName.toLowerCase(),
        category: category ?? '',
        alwaysAsk: alwaysAsk ?? false,
        isManual: true,
      },
    });

    return NextResponse.json({ success: true, mapping });
  } catch (error) {
    console.error('Error updating merchant category:', error);
    return NextResponse.json(
      { error: 'Failed to update merchant category' },
      { status: 500 }
    );
  }
}

// Delete merchant category mapping (to reset to AI classification)
export async function DELETE(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const merchantName = searchParams.get('merchantName');

    if (!merchantName || merchantName.trim().length === 0) {
      return NextResponse.json({ error: 'merchantName is required' }, { status: 400 });
    }

    await prisma.merchantCategoryMap.deleteMany({
      where: {
        userId,
        merchantName: merchantName.toLowerCase().trim(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting merchant category:', error);
    return NextResponse.json(
      { error: 'Failed to delete merchant category' },
      { status: 500 }
    );
  }
}
