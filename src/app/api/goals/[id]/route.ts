import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount, getSharedUserIds } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

// GET - Fetch a specific financial goal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const sharedUserIds = await getSharedUserIds(userId);

    const goal = await prisma.financialGoal.findUnique({
      where: { id },
      include: {
        recurringTransaction: true,
      },
    });

    if (!goal || !sharedUserIds.includes(goal.userId)) {
      return NextResponse.json({ error: 'יעד לא נמצא' }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error fetching financial goal:', error);
    return NextResponse.json({ error: 'Failed to fetch financial goal' }, { status: 500 });
  }
}

// PUT - Full update of a financial goal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const sharedUserIds = await getSharedUserIds(userId);

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.financialGoal.findUnique({
      where: { id },
    });

    if (!existingGoal || !sharedUserIds.includes(existingGoal.userId)) {
      return NextResponse.json({ error: 'יעד לא נמצא' }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate fields
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'שם היעד הוא שדה חובה' }, { status: 400 });
      }
      if (body.name.length > 100) {
        return NextResponse.json({ error: 'שם היעד ארוך מדי' }, { status: 400 });
      }
    }
    
    if (body.targetAmount !== undefined) {
      if (typeof body.targetAmount !== 'number' || body.targetAmount <= 0) {
        return NextResponse.json({ error: 'סכום היעד חייב להיות מספר חיובי' }, { status: 400 });
      }
    }
    
    if (body.currentAmount !== undefined) {
      if (typeof body.currentAmount !== 'number' || body.currentAmount < 0) {
        return NextResponse.json({ error: 'סכום נוכחי חייב להיות מספר חיובי או אפס' }, { status: 400 });
      }
    }
    
    if (body.deadline !== undefined) {
      const deadline = new Date(body.deadline);
      if (isNaN(deadline.getTime())) {
        return NextResponse.json({ error: 'תאריך יעד לא תקין' }, { status: 400 });
      }
    }

    // Validate recurringTransactionId if provided
    if (body.recurringTransactionId !== undefined && body.recurringTransactionId !== null) {
      const recurring = await prisma.recurringTransaction.findUnique({
        where: { id: body.recurringTransactionId },
      });
      
      if (!recurring || !sharedUserIds.includes(recurring.userId)) {
        return NextResponse.json({ error: 'הוצאה קבועה לא נמצאה' }, { status: 400 });
      }
      
      // Check if already linked to another goal
      const linkedGoal = await prisma.financialGoal.findUnique({
        where: { recurringTransactionId: body.recurringTransactionId },
      });
      
      if (linkedGoal && linkedGoal.id !== id) {
        return NextResponse.json({ error: 'הוצאה קבועה זו כבר מקושרת ליעד אחר' }, { status: 400 });
      }
    }

    const goal = await prisma.financialGoal.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? existingGoal.name,
        targetAmount: body.targetAmount ?? existingGoal.targetAmount,
        currentAmount: body.currentAmount ?? existingGoal.currentAmount,
        deadline: body.deadline ? new Date(body.deadline) : existingGoal.deadline,
        category: body.category ?? existingGoal.category,
        icon: body.icon !== undefined ? body.icon : existingGoal.icon,
        recurringTransactionId: body.recurringTransactionId !== undefined 
          ? body.recurringTransactionId 
          : existingGoal.recurringTransactionId,
      },
      include: {
        recurringTransaction: true,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error updating financial goal:', error);
    return NextResponse.json({ error: 'Failed to update financial goal' }, { status: 500 });
  }
}

// PATCH - Partial update (e.g., just currentAmount)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const sharedUserIds = await getSharedUserIds(userId);

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.financialGoal.findUnique({
      where: { id },
    });

    if (!existingGoal || !sharedUserIds.includes(existingGoal.userId)) {
      return NextResponse.json({ error: 'יעד לא נמצא' }, { status: 404 });
    }

    const body = await request.json();
    
    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {};
    
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'שם היעד הוא שדה חובה' }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }
    
    if (body.targetAmount !== undefined) {
      if (typeof body.targetAmount !== 'number' || body.targetAmount <= 0) {
        return NextResponse.json({ error: 'סכום היעד חייב להיות מספר חיובי' }, { status: 400 });
      }
      updateData.targetAmount = body.targetAmount;
    }
    
    if (body.currentAmount !== undefined) {
      if (typeof body.currentAmount !== 'number' || body.currentAmount < 0) {
        return NextResponse.json({ error: 'סכום נוכחי חייב להיות מספר חיובי או אפס' }, { status: 400 });
      }
      updateData.currentAmount = body.currentAmount;
    }
    
    if (body.deadline !== undefined) {
      const deadline = new Date(body.deadline);
      if (isNaN(deadline.getTime())) {
        return NextResponse.json({ error: 'תאריך יעד לא תקין' }, { status: 400 });
      }
      updateData.deadline = deadline;
    }
    
    if (body.category !== undefined) {
      updateData.category = body.category;
    }
    
    if (body.icon !== undefined) {
      updateData.icon = body.icon;
    }
    
    if (body.recurringTransactionId !== undefined) {
      if (body.recurringTransactionId !== null) {
        const recurring = await prisma.recurringTransaction.findUnique({
          where: { id: body.recurringTransactionId },
        });
        
        if (!recurring || !sharedUserIds.includes(recurring.userId)) {
          return NextResponse.json({ error: 'הוצאה קבועה לא נמצאה' }, { status: 400 });
        }
        
        const linkedGoal = await prisma.financialGoal.findUnique({
          where: { recurringTransactionId: body.recurringTransactionId },
        });
        
        if (linkedGoal && linkedGoal.id !== id) {
          return NextResponse.json({ error: 'הוצאה קבועה זו כבר מקושרת ליעד אחר' }, { status: 400 });
        }
      }
      updateData.recurringTransactionId = body.recurringTransactionId;
    }

    const goal = await prisma.financialGoal.update({
      where: { id },
      data: updateData,
      include: {
        recurringTransaction: true,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error patching financial goal:', error);
    return NextResponse.json({ error: 'Failed to update financial goal' }, { status: 500 });
  }
}

// DELETE - Delete a financial goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const sharedUserIds = await getSharedUserIds(userId);

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.financialGoal.findUnique({
      where: { id },
    });

    if (!existingGoal || !sharedUserIds.includes(existingGoal.userId)) {
      return NextResponse.json({ error: 'יעד לא נמצא' }, { status: 404 });
    }

    await prisma.financialGoal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting financial goal:', error);
    return NextResponse.json({ error: 'Failed to delete financial goal' }, { status: 500 });
  }
}

