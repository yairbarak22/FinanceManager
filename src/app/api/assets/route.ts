import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withSharedAccount, getSharedUserIds } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { saveAssetHistory } from '@/lib/assetHistory';
import { saveCurrentMonthNetWorth } from '@/lib/netWorthHistory';

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    // Check for month query parameter
    const { searchParams } = new URL(request.url);
    const monthKey = searchParams.get('month');

    // Use shared account to get assets from all members
    const sharedWhere = await withSharedAccount(userId);
    
    // Fetch assets with optional history for specific month
    if (monthKey && monthKey !== 'all') {
      // Get user IDs for shared account
      const userIds = await getSharedUserIds(userId);
      
      // Fetch assets with their history for the specific month
      const assets = await prisma.asset.findMany({
        where: sharedWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          valueHistory: {
            where: { monthKey },
            take: 1,
          },
        },
      });
      
      // Map assets with historical value
      const assetsWithHistory = assets.map(asset => ({
        ...asset,
        currentValue: asset.value,
        // Use historical value if exists, otherwise current value
        value: asset.valueHistory[0]?.value ?? asset.value,
        valueHistory: undefined, // Remove from response
      }));
      
      return NextResponse.json(assetsWithHistory);
    }
    
    // Default: return current values
    const assets = await prisma.asset.findMany({
      where: sharedWhere,
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    if (body.name.length > 100) {
      return NextResponse.json({ error: 'Name too long (max 100 characters)' }, { status: 400 });
    }
    
    if (!body.category || typeof body.category !== 'string') {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    
    if (body.category.length > 50) {
      return NextResponse.json({ error: 'Category too long (max 50 characters)' }, { status: 400 });
    }
    
    if (typeof body.value !== 'number' || body.value < 0) {
      return NextResponse.json({ error: 'Value must be a non-negative number' }, { status: 400 });
    }
    
    const asset = await prisma.asset.create({
      data: {
        userId,
        name: body.name.trim(),
        category: body.category,
        value: body.value,
      },
    });
    
    // Save initial value to history for current month
    await saveAssetHistory(asset.id, body.value);
    
    // Update net worth history for current month
    await saveCurrentMonthNetWorth(userId);
    
    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}
