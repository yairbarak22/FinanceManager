import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getSharedUserIds } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

/**
 * GET /api/portfolio/export
 * Export portfolio holdings as CSV file
 */
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    // Get shared user IDs for shared account support
    const userIds = await getSharedUserIds(userId);

    // Fetch all holdings from database
    const holdings = await prisma.holding.findMany({
      where: {
        userId: { in: userIds },
        symbol: { not: null },
      },
      select: {
        symbol: true,
        name: true,
        currentValue: true,
        currency: true,
        provider: true,
        priceDisplayUnit: true,
      },
    });

    // Build CSV content
    // Add BOM for Excel Hebrew support
    const BOM = '\uFEFF';
    
    // CSV header
    const headers = ['Symbol', 'Name', 'Quantity', 'Currency', 'Provider', 'Price Display Unit'];
    
    // CSV rows
    const rows = holdings.map((h) => {
      // Escape fields that might contain commas or quotes
      const escapeCsvField = (field: string | null | undefined): string => {
        if (field === null || field === undefined) return '';
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        escapeCsvField(h.symbol),
        escapeCsvField(h.name),
        h.currentValue.toString(),
        escapeCsvField(h.currency),
        escapeCsvField(h.provider),
        escapeCsvField(h.priceDisplayUnit),
      ].join(',');
    });

    // Combine header and rows
    const csvContent = BOM + [headers.join(','), ...rows].join('\n');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `portfolio-export-${date}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to export portfolio' },
      { status: 500 }
    );
  }
}

