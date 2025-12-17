import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, withIdAndUserId } from '@/lib/authHelpers';

// GET - Download/redirect to document
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

    // If document has a Vercel Blob URL, redirect to it
    if (document.url) {
      return NextResponse.redirect(document.url);
    }

    // Fallback for old documents without URL (should not happen in production)
    return NextResponse.json(
      { error: 'Document URL not available' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}
