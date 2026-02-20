/**
 * Admin Quarantine API - Review individual quarantined file
 *
 * GET    /api/admin/quarantine/:id       - Get file details
 * POST   /api/admin/quarantine/:id       - Approve/reject file
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminHelpers';
import {
  getQuarantinedFile,
  approveQuarantinedFile,
  rejectQuarantinedFile,
} from '@/lib/quarantine';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 },
      );
    }

    const { id } = await params;
    const file = await getQuarantinedFile(id);

    if (!file) {
      return NextResponse.json(
        { error: 'Quarantined file not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(file);
  } catch (error) {
    console.error('[Admin Quarantine] Error fetching file:', error);
    return NextResponse.json(
      { error: 'Failed to get quarantined file' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, notes } = body as { action: string; notes?: string };

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject".' },
        { status: 400 },
      );
    }

    let success: boolean;
    if (action === 'approve') {
      success = await approveQuarantinedFile(id, userId, notes);
    } else {
      success = await rejectQuarantinedFile(id, userId, notes);
    }

    if (!success) {
      return NextResponse.json(
        { error: 'File not found or already reviewed' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      action,
      message: action === 'approve'
        ? 'הקובץ אושר בהצלחה'
        : 'הקובץ נדחה ונמחק',
    });
  } catch (error) {
    console.error('[Admin Quarantine] Error reviewing file:', error);
    return NextResponse.json(
      { error: 'Failed to review quarantined file' },
      { status: 500 },
    );
  }
}

