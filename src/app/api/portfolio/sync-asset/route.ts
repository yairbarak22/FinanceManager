import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authHelpers';
import { syncPortfolioAsset, syncAllPortfolioAssets } from '@/lib/portfolioAssetSync';

/**
 * POST /api/portfolio/sync-asset
 * Sync portfolio asset for the current user
 * Can be called after adding/updating/deleting holdings
 */
export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Check for force update flag
    const body = await request.json().catch(() => ({}));
    const forceUpdate = body.forceUpdate === true;

    const result = await syncPortfolioAsset(userId, forceUpdate);

    if (result) {
      return NextResponse.json({
        success: true,
        asset: result,
        message: 'Portfolio asset synced successfully',
      });
    } else {
      return NextResponse.json({
        success: true,
        asset: null,
        message: 'No holdings to sync',
      });
    }
  } catch (error) {
    console.error('Error syncing portfolio asset:', error);
    return NextResponse.json(
      { error: 'Failed to sync portfolio asset' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/portfolio/sync-asset
 * Sync all portfolio assets for all users (for cron jobs)
 * In production, this should be protected with a secret key
 */
export async function GET(request: Request) {
  try {
    // Check for cron secret (optional security measure)
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, require it
    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const syncedCount = await syncAllPortfolioAssets();

    return NextResponse.json({
      success: true,
      syncedCount,
      message: `Synced ${syncedCount} portfolio assets`,
    });
  } catch (error) {
    console.error('Error syncing all portfolio assets:', error);
    return NextResponse.json(
      { error: 'Failed to sync portfolio assets' },
      { status: 500 }
    );
  }
}

