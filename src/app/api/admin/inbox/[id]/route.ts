/**
 * Admin Inbox API - Get, update, delete a single message
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const message = await prisma.inboxMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Get all messages in the same thread
    let thread: typeof message[] = [];
    if (message.threadId) {
      thread = await prisma.inboxMessage.findMany({
        where: { threadId: message.threadId },
        orderBy: { createdAt: 'asc' },
      });
    } else {
      thread = [message];
    }

    // Mark as read
    if (!message.isRead && message.direction === 'inbound') {
      await prisma.inboxMessage.update({
        where: { id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ message: { ...message, isRead: true }, thread });
  } catch (error) {
    console.error('[Inbox] Get message error:', error);
    return NextResponse.json({ error: 'Failed to fetch message' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData: Record<string, boolean> = {};
    
    if (typeof body.isRead === 'boolean') updateData.isRead = body.isRead;
    if (typeof body.isStarred === 'boolean') updateData.isStarred = body.isStarred;
    if (typeof body.isArchived === 'boolean') updateData.isArchived = body.isArchived;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await prisma.inboxMessage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: updated });
  } catch (error) {
    console.error('[Inbox] Update error:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.inboxMessage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Inbox] Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}

