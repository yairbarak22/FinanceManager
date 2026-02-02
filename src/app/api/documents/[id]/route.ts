import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';
import { requireAuth, withIdAndUserId } from '@/lib/authHelpers';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';

// DELETE - Delete a document from Vercel Blob and database
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

    // Delete from Vercel Blob if URL exists
    if (document.url) {
      try {
        await del(document.url);
      } catch (blobError) {
        console.error('Error deleting from Vercel Blob:', blobError);
        // Continue with database deletion even if blob deletion fails
      }
    }

    // Delete from database (with user check for IDOR prevention)
    await prisma.document.deleteMany({
      where: withIdAndUserId(id, userId),
    });

    // Audit log: document deleted
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.DELETE,
      entityType: 'Document',
      entityId: id,
      metadata: { filename: document.filename },
      ipAddress,
      userAgent,
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
