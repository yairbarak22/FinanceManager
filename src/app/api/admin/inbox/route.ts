/**
 * Admin Inbox API - List messages with pagination, search, filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all'; // all | unread | starred | archived
    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Filter by state
    switch (filter) {
      case 'unread':
        where.isRead = false;
        where.isArchived = false;
        break;
      case 'starred':
        where.isStarred = true;
        where.isArchived = false;
        break;
      case 'archived':
        where.isArchived = true;
        break;
      case 'all':
      default:
        where.isArchived = false;
        break;
    }

    // Search by subject or sender
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { from: { contains: search, mode: 'insensitive' } },
        { fromEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Only show thread-level messages (latest in each thread)
    // We get all messages and group by threadId in the query
    const [messages, totalCount] = await Promise.all([
      prisma.inboxMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.inboxMessage.count({ where }),
    ]);

    // Get unread count for badge
    const unreadCount = await prisma.inboxMessage.count({
      where: { isRead: false, isArchived: false, direction: 'inbound' },
    });

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error('[Inbox] List error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

