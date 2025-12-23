import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Update or create merchant category mapping
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { merchantName, category, alwaysAsk } = await request.json();

    if (!merchantName) {
      return NextResponse.json({ error: 'merchantName is required' }, { status: 400 });
    }

    // Upsert the mapping
    const mapping = await prisma.merchantCategoryMap.upsert({
      where: {
        userId_merchantName: {
          userId: session.user.id,
          merchantName: merchantName.toLowerCase().trim(),
        },
      },
      update: {
        category: category || '',
        alwaysAsk: alwaysAsk ?? false,
        isManual: true,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        merchantName: merchantName.toLowerCase().trim(),
        category: category || '',
        alwaysAsk: alwaysAsk ?? false,
        isManual: true,
      },
    });

    return NextResponse.json({ success: true, mapping });
  } catch (error) {
    console.error('Error updating merchant category:', error);
    return NextResponse.json(
      { error: 'Failed to update merchant category' },
      { status: 500 }
    );
  }
}

// Delete merchant category mapping (to reset to AI classification)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantName = searchParams.get('merchantName');

    if (!merchantName) {
      return NextResponse.json({ error: 'merchantName is required' }, { status: 400 });
    }

    await prisma.merchantCategoryMap.deleteMany({
      where: {
        userId: session.user.id,
        merchantName: merchantName.toLowerCase().trim(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting merchant category:', error);
    return NextResponse.json(
      { error: 'Failed to delete merchant category' },
      { status: 500 }
    );
  }
}

