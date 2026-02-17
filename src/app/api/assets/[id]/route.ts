import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccountId, checkPermission } from '@/lib/authHelpers';
import { saveAssetHistoryIfChanged } from '@/lib/assetHistory';
import { saveCurrentMonthNetWorth } from '@/lib/netWorthHistory';
import { isPortfolioSyncAsset } from '@/lib/portfolioAssetSync';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Check edit permission for shared accounts
    const editPermission = await checkPermission(userId, 'canEdit');
    if (!editPermission.allowed) return editPermission.error!;

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

    // Block editing portfolio sync asset
    if (isPortfolioSyncAsset(currentAsset.name)) {
      return NextResponse.json(
        { error: 'נכס זה מסונכרן אוטומטית מתיק ההשקעות. לעריכה יש לעדכן את תיק ההשקעות' },
        { status: 403 }
      );
    }

    // Block editing Gemach-linked assets
    if (currentAsset.gemachId) {
      return NextResponse.json(
        { error: 'לא ניתן לערוך תוכנית גמ"ח ישירות. יש למחוק וליצור מחדש.' },
        { status: 400 }
      );
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
      // Update net worth history for current month
      try {
        await saveCurrentMonthNetWorth(userId);
      } catch (netWorthError) {
        console.error('Error saving net worth history:', netWorthError);
        // Don't fail the asset update if net worth save fails
      }
    }

    // Audit log: asset updated
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'Asset',
      entityId: id,
      metadata: { fieldsUpdated: Object.keys(updateData) },
      ipAddress,
      userAgent,
    });

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

    // Check delete permission for shared accounts
    const deletePermission = await checkPermission(userId, 'canDelete');
    if (!deletePermission.allowed) return deletePermission.error!;

    const { id } = await params;

    // Use shared account to allow deleting records from all members
    const sharedWhere = await withSharedAccountId(id, userId);
    
    // Check if this is a portfolio sync asset before deleting
    const assetToDelete = await prisma.asset.findFirst({
      where: sharedWhere,
    });
    
    if (assetToDelete && isPortfolioSyncAsset(assetToDelete.name)) {
      return NextResponse.json(
        { error: 'נכס זה מסונכרן אוטומטית מתיק ההשקעות. לעריכה יש לעדכן את תיק ההשקעות' },
        { status: 403 }
      );
    }

    // If this is a Gemach-linked asset, delete both asset and liability atomically
    if (assetToDelete?.gemachId) {
      await prisma.$transaction([
        prisma.asset.deleteMany({ where: { gemachId: assetToDelete.gemachId } }),
        prisma.liability.deleteMany({ where: { gemachId: assetToDelete.gemachId } }),
      ]);
    } else {
      const result = await prisma.asset.deleteMany({
        where: sharedWhere,
      });
      
      if (result.count === 0) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }
    }
    
    // Update net worth history for current month
    await saveCurrentMonthNetWorth(userId);

    // Audit log: asset deleted
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.DELETE,
      entityType: 'Asset',
      entityId: id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
