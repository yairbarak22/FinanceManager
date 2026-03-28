/**
 * Admin Inbox API - Get unread message count (for sidebar badge)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function GET() {
  try {
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 }
      );
    }

    const count = await prisma.inboxMessage.count({
      where: {
        isRead: false,
        isArchived: false,
        direction: 'inbound',
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('[Inbox] Unread count error:', error);
    return NextResponse.json({ count: 0 });
  }
}

