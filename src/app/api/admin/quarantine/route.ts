/**
 * Admin Quarantine API - List quarantined files
 *
 * GET /api/admin/quarantine?status=PENDING&page=1&limit=20
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminHelpers';
import { listQuarantinedFiles, getQuarantineStats } from '@/lib/quarantine';
import { QuarantineStatus } from '@prisma/client';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireAdmin();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as QuarantineStatus | null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // Validate status if provided
    const validStatuses = Object.values(QuarantineStatus);
    if (statusFilter && !validStatuses.includes(statusFilter)) {
      return NextResponse.json(
        { error: `Invalid status. Valid: ${validStatuses.join(', ')}` },
        { status: 400 },
      );
    }

    const [listResult, stats] = await Promise.all([
      listQuarantinedFiles(statusFilter || undefined, page, limit),
      getQuarantineStats(),
    ]);

    return NextResponse.json({
      items: listResult.items,
      total: listResult.total,
      page,
      limit,
      stats,
    });
  } catch (error) {
    console.error('[Admin Quarantine] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load quarantine list' },
      { status: 500 },
    );
  }
}

