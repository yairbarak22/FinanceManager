import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccountId } from '@/lib/authHelpers';
import { saveAssetHistoryIfChanged } from '@/lib/assetHistory';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();

    // Use shared account to allow editing records from all members
    const sharedWhere = await withSharedAccountId(id, userId);

    // Get current asset to check if value changed
    const currentAsset = await prisma.asset.findFirst({
      where: sharedWhere,
    });
    
    if (!currentAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Build update data object with validation
    // SECURITY: Validate each field before updating
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
      }
      if (body.name.length > 100) {
        return NextResponse.json({ error: 'Name too long (max 100 characters)' }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }

    if (body.category !== undefined) {
      if (typeof body.category !== 'string' || body.category.trim().length === 0) {
        return NextResponse.json({ error: 'Category must be a non-empty string' }, { status: 400 });
      }
      if (body.category.length > 50) {
        return NextResponse.json({ error: 'Category too long (max 50 characters)' }, { status: 400 });
      }
      updateData.category = body.category.trim();
    }

    if (body.value !== undefined) {
      if (typeof body.value !== 'number' || body.value < 0) {
        return NextResponse.json({ error: 'Value must be a non-negative number' }, { status: 400 });
      }
      updateData.value = body.value;
    }

    if (body.liquidity !== undefined) {
      const validLiquidity = ['immediate', 'short_term', 'pension', 'locked'];
      if (!validLiquidity.includes(body.liquidity)) {
        return NextResponse.json({ error: 'Invalid liquidity type' }, { status: 400 });
      }
      updateData.liquidity = body.liquidity;
    }

    const result = await prisma.asset.updateMany({
      where: sharedWhere,
      data: updateData,
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const asset = await prisma.asset.findFirst({
      where: sharedWhere,
    });

    // Save history if value changed
    if (body.value !== undefined && asset) {
      await saveAssetHistoryIfChanged(id, body.value, currentAsset.value);
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    
    // Use shared account to allow deleting records from all members
    const sharedWhere = await withSharedAccountId(id, userId);
    
    const result = await prisma.asset.deleteMany({
      where: sharedWhere,
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
