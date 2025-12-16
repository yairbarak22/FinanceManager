import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { requireAuth, withIdAndUserId } from '@/lib/authHelpers';

// GET - Download a document
export async function GET(
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

    // Build file path
    const folderType = document.entityType === 'asset' ? 'assets' : 'liabilities';
    const filePath = path.join(
      process.cwd(),
      'public',
      'uploads',
      folderType,
      document.entityId,
      document.storedName
    );

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found on disk' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(filePath);

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(document.filename)}"`,
        'Content-Length': document.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}
