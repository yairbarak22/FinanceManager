import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Use shared account to get recurring transactions from all members
    const sharedWhere = await withSharedAccount(userId);
    
    const recurring = await prisma.recurringTransaction.findMany({
      where: sharedWhere,
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
    
    // Validate required fields
    if (!body.type || !['income', 'expense'].includes(body.type)) {
      return NextResponse.json({ error: 'Type must be "income" or "expense"' }, { status: 400 });
    }
    
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }
    
    if (!body.category || typeof body.category !== 'string') {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const recurring = await prisma.recurringTransaction.create({
      data: {
        userId,
        type: body.type,
        amount: body.amount,
        category: body.category,
        name: body.name.trim(),
        isActive: body.isActive ?? true,
      },
    });
    
    return NextResponse.json(recurring);
  } catch (error) {
    console.error('Error creating recurring transaction:', error);
    return NextResponse.json({ error: 'Failed to create recurring transaction' }, { status: 500 });
  }
}
