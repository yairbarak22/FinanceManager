import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withUserId } from '@/lib/authHelpers';

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const recurring = await prisma.recurringTransaction.findMany({
      where: withUserId(userId),
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(recurring);
  } catch (error) {
    console.error('Error fetching recurring transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch recurring transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    
    const recurring = await prisma.recurringTransaction.create({
      data: {
        userId,
        type: body.type,
        amount: body.amount,
        category: body.category,
        name: body.name,
        isActive: body.isActive ?? true,
      },
    });
    
    return NextResponse.json(recurring);
  } catch (error) {
    console.error('Error creating recurring transaction:', error);
    return NextResponse.json({ error: 'Failed to create recurring transaction' }, { status: 500 });
  }
}
