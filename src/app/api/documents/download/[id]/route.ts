import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, withIdAndUserId } from '@/lib/authHelpers';
import { checkRateLimitWithIp, getClientIp, RATE_LIMITS, IP_RATE_LIMITS } from '@/lib/rateLimit';
import { logAuditEvent, AuditAction, getRequestInfo } from '@/lib/auditLog';

// GET - Download document securely via proxy (blob URL never exposed to client)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting for downloads (prevent abuse) - user + IP based
    const clientIp = getClientIp(request.headers);
    const rateLimitResult = await checkRateLimitWithIp(
      userId,
      clientIp,
      RATE_LIMITS.upload,
      IP_RATE_LIMITS.download,
      'download',
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות להורדה. אנא המתן ונסה שוב.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          },
        }
      );
    }

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

    // Audit log: document downloaded (non-blocking - don't slow down the download)
    const { ipAddress, userAgent } = getRequestInfo(request.headers);
    void logAuditEvent({
      userId,
      action: AuditAction.DATA_VIEW,
      entityType: 'Document',
      entityId: id,
      metadata: { filename: document.filename, mimeType: document.mimeType },
      ipAddress,
      userAgent,
    });

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
