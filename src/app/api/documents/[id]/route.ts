import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { requireAuth, withIdAndUserId } from '@/lib/authHelpers';

// DELETE - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    // Find the document (with user check)
    const document = await prisma.document.findFirst({
      where: withIdAndUserId(id, userId),
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    const folderType = document.entityType === 'asset' ? 'assets' : 'liabilities';
    const filePath = path.join(
      process.cwd(),
      'public',
      'uploads',
      folderType,
      document.entityId,
      document.storedName
    );

    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // Delete from database (with user check for IDOR prevention)
    await prisma.document.deleteMany({
      where: withIdAndUserId(id, userId),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
