import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withIdAndUserId } from '@/lib/authHelpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    
    // Use updateMany with userId to prevent IDOR attacks
    const result = await prisma.asset.updateMany({
      where: withIdAndUserId(id, userId),
      data: {
        name: body.name,
        category: body.category,
        value: body.value,
      },
    });
    
    if (result.count === 0) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    
    const asset = await prisma.asset.findFirst({
      where: withIdAndUserId(id, userId),
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

    const { id } = await params;
    
    // Use deleteMany with userId to prevent IDOR attacks
    const result = await prisma.asset.deleteMany({
      where: withIdAndUserId(id, userId),
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
