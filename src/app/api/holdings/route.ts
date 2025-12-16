import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, withUserId } from '@/lib/authHelpers';

// GET all holdings
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const holdings = await prisma.holding.findMany({
      where: withUserId(userId),
      orderBy: { targetAllocation: 'desc' },
    });
    return NextResponse.json(holdings);
  } catch (error) {
    console.error('Error fetching holdings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holdings' },
      { status: 500 }
    );
  }
}

// POST new holding
export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || data.currentValue === undefined || data.targetAllocation === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, currentValue, targetAllocation' },
        { status: 400 }
      );
    }

    // Validate target allocation range
    if (data.targetAllocation < 0 || data.targetAllocation > 100) {
      return NextResponse.json(
        { error: 'Target allocation must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate current value
    if (data.currentValue < 0) {
      return NextResponse.json(
        { error: 'Current value must be non-negative' },
        { status: 400 }
      );
    }

    const holding = await prisma.holding.create({
      data: {
        userId,
        name: data.name,
        symbol: data.symbol || null,
        type: data.type || 'etf',
        currentValue: data.currentValue,
        targetAllocation: data.targetAllocation,
      },
    });

    return NextResponse.json(holding, { status: 201 });
  } catch (error) {
    console.error('Error creating holding:', error);
    return NextResponse.json(
      { error: 'Failed to create holding' },
      { status: 500 }
    );
  }
}
