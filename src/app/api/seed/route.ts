import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuth, withUserId } from '@/lib/authHelpers';

export async function POST() {
  // הגנה: רק בסביבת פיתוח
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seed endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    // Clear existing data for this user only
    await prisma.transaction.deleteMany({ where: withUserId(userId) });
    await prisma.recurringTransaction.deleteMany({ where: withUserId(userId) });
    await prisma.assetValueHistory.deleteMany({
      where: {
        asset: { userId },
      },
    });
    await prisma.asset.deleteMany({ where: withUserId(userId) });
    await prisma.liability.deleteMany({ where: withUserId(userId) });
    await prisma.netWorthHistory.deleteMany({ where: withUserId(userId) });
    await prisma.holding.deleteMany({ where: withUserId(userId) });
    await prisma.document.deleteMany({ where: withUserId(userId) });

    // Create recurring transactions
    await prisma.recurringTransaction.createMany({
      data: [
        { userId, type: 'income', amount: 15000, category: 'salary', name: 'משכורת', isActive: true },
        { userId, type: 'expense', amount: 4000, category: 'housing', name: 'שכר דירה', isActive: true },
      ],
    });

    // Create assets
    await prisma.asset.createMany({
      data: [
        { userId, name: 'תיק השקעות', category: 'stocks', value: 100000 },
        { userId, name: 'חסכון פנסיוני', category: 'pension', value: 50000 },
      ],
    });

    // Create liabilities
    await prisma.liability.createMany({
      data: [
        { userId, name: 'הלוואה אישית', type: 'loan', totalAmount: 20000, monthlyPayment: 1000 },
      ],
    });

    // Create transactions
    const transactions = [
      // Current month
      { userId, type: 'expense', amount: 500, category: 'food', description: 'קניות בסופרמרקט', date: new Date() },
      { userId, type: 'expense', amount: 200, category: 'transport', description: 'דלק', date: new Date() },
      { userId, type: 'expense', amount: 150, category: 'entertainment', description: 'קולנוע', date: new Date() },
    ];

    for (const tx of transactions) {
      await prisma.transaction.create({ data: tx });
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
