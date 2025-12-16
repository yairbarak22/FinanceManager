import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withUserId } from '@/lib/authHelpers';

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const liabilities = await prisma.liability.findMany({
      where: withUserId(userId),
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(liabilities);
  } catch (error) {
    console.error('Error fetching liabilities:', error);
    return NextResponse.json({ error: 'Failed to fetch liabilities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    
    const liability = await prisma.liability.create({
      data: {
        userId,
        name: body.name,
        type: body.type,
        totalAmount: body.totalAmount,
        monthlyPayment: body.monthlyPayment,
        interestRate: body.interestRate || 0,
        loanTermMonths: body.loanTermMonths || 0,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        remainingAmount: body.totalAmount,
        loanMethod: body.loanMethod || 'spitzer',
        hasInterestRebate: body.hasInterestRebate || false,
      },
    });
    
    return NextResponse.json(liability);
  } catch (error) {
    console.error('Error creating liability:', error);
    return NextResponse.json({ error: 'Failed to create liability' }, { status: 500 });
  }
}
