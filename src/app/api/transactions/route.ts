import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withUserId } from '@/lib/authHelpers';

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    
    let whereClause: Record<string, unknown> = {};
    
    if (month && month !== 'all') {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59);
      
      whereClause = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }
    
    const transactions = await prisma.transaction.findMany({
      where: withUserId(userId, whereClause),
      orderBy: { date: 'desc' },
    });
    
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: body.type,
        amount: body.amount,
        category: body.category,
        description: body.description,
        date: new Date(body.date),
      },
    });
    
    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
