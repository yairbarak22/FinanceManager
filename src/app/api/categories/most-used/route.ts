import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount } from '@/lib/authHelpers';

// Cache duration in seconds (5 minutes)
const CACHE_DURATION = 300;

interface CategoryCount {
  category: string;
  _count: {
    category: number;
  };
}

/**
 * GET /api/categories/most-used
 * Returns the 6 most frequently used categories for the current user
 * Based on transaction history
 */
export async function GET(request: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    // Get type from query params (default to expense)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'expense';

    if (!['expense', 'income'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "expense" or "income"' },
        { status: 400 }
      );
    }

    // Get the most used categories for the user
    const categoryUsage = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        ...await withSharedAccount(userId),
        type,
      },
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
      take: 6,
    });

    // Extract just the category IDs
    const mostUsedCategories = categoryUsage.map((item: CategoryCount) => item.category);

    // Return with cache headers
    return NextResponse.json(
      { categories: mostUsedCategories },
      {
        headers: {
          'Cache-Control': `private, max-age=${CACHE_DURATION}`,
        },
      }
    );
  } catch (err) {
    console.error('Error fetching most used categories:', err);
    return NextResponse.json(
      { error: 'Failed to fetch most used categories' },
      { status: 500 }
    );
  }
}

