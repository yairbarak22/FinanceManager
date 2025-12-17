import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';

// GET - Check if user has seen onboarding
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasSeenOnboarding: true },
    });

    return NextResponse.json({ hasSeenOnboarding: user?.hasSeenOnboarding ?? false });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 });
  }
}

// POST - Mark onboarding as complete
export async function POST() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    await prisma.user.update({
      where: { id: userId },
      data: { hasSeenOnboarding: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 });
  }
}

// DELETE - Reset onboarding (for "show tour again" feature)
export async function DELETE() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    await prisma.user.update({
      where: { id: userId },
      data: { hasSeenOnboarding: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
    return NextResponse.json({ error: 'Failed to reset onboarding status' }, { status: 500 });
  }
}

