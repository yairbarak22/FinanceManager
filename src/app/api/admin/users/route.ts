import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';

// GET - Fetch all users (admin only)
export async function GET() {
  try {
    // SECURITY: Triple validation - middleware, then this check
    const { error } = await requireAdmin();
    if (error) return error;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        hasSeenOnboarding: true,
        _count: {
          select: {
            transactions: true,
            assets: true,
            liabilities: true,
            recurringTransactions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

