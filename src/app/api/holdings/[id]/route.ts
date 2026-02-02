import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, withSharedAccountId, checkPermission } from '@/lib/authHelpers';
import { syncPortfolioAsset } from '@/lib/portfolioAssetSync';

// GET single holding
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    
    // Use shared account to allow viewing records from all members
    const sharedWhere = await withSharedAccountId(id, userId);
    
    const holding = await prisma.holding.findFirst({
      where: sharedWhere,
    });

    if (!holding) {
      return NextResponse.json(
        { error: 'Holding not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(holding);
  } catch (error) {
    console.error('Error fetching holding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holding' },
      { status: 500 }
    );
  }
}

// PUT update holding
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Check edit permission for shared accounts
    const editPermission = await checkPermission(userId, 'canEdit');
    if (!editPermission.allowed) return editPermission.error!;

    const { id } = await params;
    const data = await request.json();

    // Validate target allocation range if provided
    if (data.targetAllocation !== undefined && 
        (data.targetAllocation < 0 || data.targetAllocation > 100)) {
      return NextResponse.json(
        { error: 'Target allocation must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate current value if provided
    if (data.currentValue !== undefined && data.currentValue < 0) {
      return NextResponse.json(
        { error: 'Current value must be non-negative' },
        { status: 400 }
      );
    }

    // Validate priceDisplayUnit if provided
    const validPriceUnits = ['ILS', 'ILS_AGOROT', 'USD'];
    const priceDisplayUnit = data.priceDisplayUnit !== undefined
      ? (validPriceUnits.includes(data.priceDisplayUnit) ? data.priceDisplayUnit : undefined)
      : undefined;

    // Use shared account to allow editing records from all members
    const sharedWhere = await withSharedAccountId(id, userId);
    
    const result = await prisma.holding.updateMany({
      where: sharedWhere,
      data: {
        name: data.name,
        symbol: data.symbol,
        type: data.type,
        currentValue: data.currentValue,
        targetAllocation: data.targetAllocation,
        ...(priceDisplayUnit !== undefined && { priceDisplayUnit }),
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Holding not found' },
        { status: 404 }
      );
    }

    const holding = await prisma.holding.findFirst({
      where: sharedWhere,
    });

    // Sync portfolio asset after updating holding - AWAIT to ensure sync completes before response
    try {
      await syncPortfolioAsset(userId, true);
    } catch (err) {
      console.error('[Holdings] Error syncing portfolio asset:', err);
    }

    return NextResponse.json(holding);
  } catch (error) {
    console.error('Error updating holding:', error);
    return NextResponse.json(
      { error: 'Failed to update holding' },
      { status: 500 }
    );
  }
}

// DELETE holding
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Check delete permission for shared accounts
    const deletePermission = await checkPermission(userId, 'canDelete');
    if (!deletePermission.allowed) return deletePermission.error!;

    const { id } = await params;

    // Use shared account to allow deleting records from all members
    const sharedWhere = await withSharedAccountId(id, userId);

    const result = await prisma.holding.deleteMany({
      where: sharedWhere,
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Holding not found' },
        { status: 404 }
      );
    }

    // Sync portfolio asset after deleting holding - AWAIT to ensure sync completes before response
    try {
      await syncPortfolioAsset(userId, true);
    } catch (err) {
      console.error('[Holdings] Error syncing portfolio asset:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting holding:', error);
    return NextResponse.json(
      { error: 'Failed to delete holding' },
      { status: 500 }
    );
  }
}
