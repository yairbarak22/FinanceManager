import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasSeenQuickStart: true },
    });

    return NextResponse.json({
      hasSeenQuickStart: user?.hasSeenQuickStart ?? false,
    });
  } catch (error) {
    console.error('Error fetching quickstart status:', error);
    return NextResponse.json({ error: 'Failed to fetch quickstart status' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    await prisma.user.update({
      where: { id: userId },
      data: { hasSeenQuickStart: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating quickstart status:', error);
    return NextResponse.json({ error: 'Failed to update quickstart status' }, { status: 500 });
  }
}
