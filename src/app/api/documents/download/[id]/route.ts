import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, withIdAndUserId } from '@/lib/authHelpers';

// GET - Download document securely via proxy (blob URL never exposed to client)
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

    if (!document.url) {
      return NextResponse.json(
        { error: 'Document URL not available' },
        { status: 404 }
      );
    }

    // Proxy download: fetch from blob and stream to client
    // This way the blob URL is never exposed to the client
    const blobResponse = await fetch(document.url);
    
    if (!blobResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch document from storage' },
        { status: 500 }
      );
    }

    const blobData = await blobResponse.arrayBuffer();

    // Return the file with proper headers
    return new NextResponse(blobData, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(document.filename)}"`,
        'Content-Length': document.size.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
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
