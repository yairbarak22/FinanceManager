import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { autoLinkGoalToRecurring } from './[id]/route';
import { validateRequest } from '@/lib/validateRequest';
import { createRecurringSchema } from '@/lib/validationSchemas';

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

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

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const { data, errorResponse } = await validateRequest(request, createRecurringSchema);
    if (errorResponse) return errorResponse;

    const recurring = await prisma.recurringTransaction.create({
      data: {
        userId,
        type: data.type,
        amount: data.amount,
        category: data.category,
        name: data.name,
        isActive: data.isActive ?? true,
        activeMonths: data.activeMonths ?? undefined,
      },
    });
    
    // Auto-link to goal if this is an expense with matching category
    if (recurring.type === 'expense' && recurring.isActive) {
      try {
        await autoLinkGoalToRecurring(userId, recurring.category, recurring.id);
      } catch (linkError) {
        console.error('Error auto-linking goal to recurring:', linkError);
        // Don't fail the request if auto-link fails
      }
    }
    
    return NextResponse.json(recurring);
  } catch (error) {
    console.error('Error creating recurring transaction:', error);
    return NextResponse.json({ error: 'Failed to create recurring transaction' }, { status: 500 });
  }
}
