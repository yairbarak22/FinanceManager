import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = checkRateLimit(`api:${userId}`, RATE_LIMITS.api.limit, RATE_LIMITS.api.windowMs);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    
    // Pagination parameters (optional - backwards compatible)
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const usePagination = pageParam !== null || limitParam !== null;
    
    const page = Math.max(1, parseInt(pageParam || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(limitParam || '50', 10))); // Max 100, default 50
    const skip = (page - 1) * limit;
    
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
    
    // Use shared account to get transactions from all members
    const sharedWhere = await withSharedAccount(userId, whereClause);
    
    // If pagination is requested, return paginated response
    if (usePagination) {
      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: sharedWhere,
          orderBy: { date: 'desc' },
          skip,
          take: limit,
        }),
        prisma.transaction.count({ where: sharedWhere }),
      ]);
      
      return NextResponse.json({
        transactions,
        pagination: {
          page,
          limit,
          total,
          hasMore: skip + transactions.length < total,
        },
      });
    }
    
    // Backwards compatible: return array directly if no pagination params
    const transactions = await prisma.transaction.findMany({
      where: sharedWhere,
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

    // Rate limiting
    const rateLimitResult = checkRateLimit(`api:${userId}`, RATE_LIMITS.api.limit, RATE_LIMITS.api.windowMs);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' }, { status: 429 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.type || !['income', 'expense'].includes(body.type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "income" or "expense"' }, { status: 400 });
    }
    
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }
    
    if (!body.category || typeof body.category !== 'string') {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    
    if (body.category.length > 50) {
      return NextResponse.json({ error: 'Category too long (max 50 characters)' }, { status: 400 });
    }
    
    if (!body.description || typeof body.description !== 'string') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    
    if (body.description.length > 500) {
      return NextResponse.json({ error: 'Description too long (max 500 characters)' }, { status: 400 });
    }
    
    if (!body.date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }
    
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: body.type,
        amount: body.amount,
        category: body.category.trim(),
        description: body.description.trim(),
        date: new Date(body.date),
      },
    });
    
    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
