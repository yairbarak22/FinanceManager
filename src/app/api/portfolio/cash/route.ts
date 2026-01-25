import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';

/**
 * GET /api/portfolio/cash
 * Get portfolio cash balance
 */
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    let profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { cashBalance: true },
    });

    // Create profile if doesn't exist
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: { userId },
        select: { cashBalance: true },
      });
    }

    return NextResponse.json({ cashBalance: profile.cashBalance ?? 0 });
  } catch (error) {
    console.error('Error fetching portfolio cash:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio cash' }, { status: 500 });
  }
}

/**
 * PUT /api/portfolio/cash
 * Update portfolio cash balance
 */
export async function PUT(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const data = await request.json();

    // Validate cashBalance
    if (typeof data.cashBalance !== 'number' || data.cashBalance < 0) {
      return NextResponse.json(
        { error: 'Cash balance must be a non-negative number' },
        { status: 400 }
      );
    }

    // Upsert profile with cash balance
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: { cashBalance: data.cashBalance },
      create: { userId, cashBalance: data.cashBalance },
      select: { cashBalance: true },
    });

    return NextResponse.json({ cashBalance: profile.cashBalance });
  } catch (error) {
    console.error('Error updating portfolio cash:', error);
    return NextResponse.json({ error: 'Failed to update portfolio cash' }, { status: 500 });
  }
}

