import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, withUserId } from '@/lib/authHelpers';

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const assets = await prisma.asset.findMany({
      where: withUserId(userId),
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

    const body = await request.json();
    
    const asset = await prisma.asset.create({
      data: {
        userId,
        name: body.name,
        category: body.category,
        value: body.value,
      },
    });
    
    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}
