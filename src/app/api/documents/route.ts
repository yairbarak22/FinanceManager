import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, withUserId } from '@/lib/authHelpers';
import { validateAndSanitizeFile } from '@/lib/fileValidator';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_ENTITY = 20;

// Verify user owns the parent entity (asset or liability)
async function verifyEntityOwnership(
  entityType: string,
  entityId: string,
  userId: string
): Promise<boolean> {
  if (entityType === 'asset') {
    const asset = await prisma.asset.findFirst({
      where: { id: entityId, userId },
    });
    return !!asset;
  } else if (entityType === 'liability') {
    const liability = await prisma.liability.findFirst({
      where: { id: entityId, userId },
    });
    return !!liability;
  }
  return false;
}

// GET - List documents for an entity
export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    // Verify user owns the parent entity
    const ownsEntity = await verifyEntityOwnership(entityType, entityId, userId);
    if (!ownsEntity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    const documents = await prisma.document.findMany({
      where: withUserId(userId, {
        entityType,
        entityId,
      }),
      orderBy: {
        createdAt: 'desc',
      },
      // SECURITY: Only select fields that are safe to expose to the client
      // The 'url' field contains the raw Vercel Blob URL which should never be exposed
      select: {
        id: true,
        filename: true,
        mimeType: true,
        size: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        // url: EXCLUDED - download via /api/documents/download/[id] proxy
        // storedName: EXCLUDED - internal use only
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST - Upload a document to Vercel Blob
export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting for file uploads (strict)
    const rateLimitResult = checkRateLimit(`upload:${userId}`, RATE_LIMITS.upload);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי העלאות. אנא המתן ונסה שוב.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          }
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string;
    const entityId = formData.get('entityId') as string;

    // Validate required fields
    if (!file || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'file, entityType, and entityId are required' },
        { status: 400 }
      );
    }

    // Validate entity type
    if (!['asset', 'liability'].includes(entityType)) {
      return NextResponse.json(
        { error: 'entityType must be "asset" or "liability"' },
        { status: 400 }
      );
    }

    // Verify user owns the parent entity
    const ownsEntity = await verifyEntityOwnership(entityType, entityId, userId);
    if (!ownsEntity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'סוג קובץ לא נתמך. קבצים מותרים: PDF, Word, Excel, JPG, PNG' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'הקובץ גדול מדי. גודל מקסימלי: 10MB' },
        { status: 400 }
      );
    }

    // Check file count limit
    const existingCount = await prisma.document.count({
      where: { userId, entityType, entityId },
    });

    if (existingCount >= MAX_FILES_PER_ENTITY) {
      return NextResponse.json(
        { error: `מקסימום ${MAX_FILES_PER_ENTITY} קבצים לכל פריט` },
        { status: 400 }
      );
    }

    // Security Layer 2+3: Validate magic bytes and sanitize file content
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const validationResult = await validateAndSanitizeFile(fileBuffer, file.type);

    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    // Use sanitized buffer if available (e.g., re-encoded images)
    const uploadBuffer = validationResult.sanitizedBuffer || fileBuffer;

    // Generate unique filename for blob storage
    const ext = file.name.split('.').pop() || '';
    const storedName = `documents/${entityType}/${entityId}/${uuidv4()}.${ext}`;

    // Upload to Vercel Blob with random suffix for extra security
    // The blob URL is never exposed to clients - downloads go through our authenticated proxy
    const blob = await put(storedName, uploadBuffer, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: true, // Adds random suffix to make URLs unguessable
    });

    // Save to database with userId and blob URL
    // Use blob.pathname (includes random suffix) for storedName so we can delete it later
    const document = await prisma.document.create({
      data: {
        userId,
        filename: file.name,
        storedName: blob.pathname, // Use actual blob pathname for deletion
        url: blob.url,
        mimeType: file.type,
        size: uploadBuffer.length, // Use sanitized buffer size
        entityType,
        entityId,
      },
    });

    // SECURITY: Return only safe fields (exclude url and storedName)
    return NextResponse.json({
      id: document.id,
      filename: document.filename,
      mimeType: document.mimeType,
      size: document.size,
      entityType: document.entityType,
      entityId: document.entityId,
      createdAt: document.createdAt,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
