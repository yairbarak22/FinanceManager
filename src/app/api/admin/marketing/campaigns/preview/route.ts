import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { countSegmentUsers, validateSegmentFilter, type SegmentFilter } from '@/lib/marketing/segment';

/**
 * POST - Preview segment filter (count matching users)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { segmentFilter } = body;

    if (!segmentFilter) {
      return NextResponse.json(
        { error: 'פילטר קהל נדרש' },
        { status: 400 }
      );
    }

    // Validate segment filter
    if (!validateSegmentFilter(segmentFilter)) {
      return NextResponse.json(
        { error: 'פילטר קהל לא תקין' },
        { status: 400 }
      );
    }

    // Count matching users
    let userCount: number;
    
    if (segmentFilter.type === 'manual') {
      // For manual selection, count selected users
      userCount = segmentFilter.selectedUserIds?.length || 0;
    } else if (segmentFilter.type === 'csv') {
      // For CSV, count emails (they may not all be users)
      userCount = segmentFilter.csvEmails?.length || 0;
    } else {
      // For other types, use countSegmentUsers
      userCount = await countSegmentUsers(segmentFilter as SegmentFilter);
    }

    return NextResponse.json({ userCount });
  } catch (error) {
    console.error('Error previewing segment:', error);
    return NextResponse.json(
      { error: 'Failed to preview segment' },
      { status: 500 }
    );
  }
}

