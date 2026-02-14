/**
 * Admin Inbox API - Get unread message count (for sidebar badge)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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

