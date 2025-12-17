import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, withIdAndUserId } from '@/lib/authHelpers';

// DELETE - Delete a custom category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;

    // Delete only if it belongs to the user (IDOR prevention)
    const result = await prisma.customCategory.deleteMany({
      where: withIdAndUserId(id, userId),
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Category not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

