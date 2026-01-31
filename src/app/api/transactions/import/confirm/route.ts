/**
 * Confirm Transaction Import API
 * שומר עסקאות לאחר אישור המשתמש (כולל עסקאות שעברו Review)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';

// Transaction to save
interface TransactionToSave {
  merchantName: string;
  amount: number;
  date: string; // ISO string
  type: 'income' | 'expense';
  category: string;
  isManualCategory?: boolean; // If the user manually set this category
}

interface ConfirmRequest {
  transactions: TransactionToSave[];
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body: ConfirmRequest = await request.json();
    const { transactions } = body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'לא התקבלו עסקאות לשמירה' },
        { status: 400 }
      );
    }

    // Validate all transactions have required fields
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (!t.merchantName || !t.amount || !t.date || !t.type || !t.category) {
        return NextResponse.json(
          { error: `עסקה ${i + 1}: חסרים שדות חובה` },
          { status: 400 }
        );
      }
    }

    // ============================================
    // SAVE TRANSACTIONS
    // ============================================
    const createdTransactions = await prisma.transaction.createMany({
      data: transactions.map(t => ({
        userId,
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.merchantName,
        date: new Date(t.date),
      })),
    });

    // ============================================
    // UPDATE MERCHANT CACHE (Learning)
    // ============================================
    // Collect unique manual mappings to save
    // Use normalized merchant names as keys for consistent deduplication
    const manualMappings = new Map<string, { category: string; isManual: boolean }>();
    
    for (const t of transactions) {
      const normalizedKey = t.merchantName.toLowerCase().trim();
      if (t.isManualCategory) {
        // User manually categorized this - we should learn
        manualMappings.set(normalizedKey, {
          category: t.category,
          isManual: true,
        });
      } else if (!manualMappings.has(normalizedKey)) {
        // AI categorized - save to cache if not already there
        manualMappings.set(normalizedKey, {
          category: t.category,
          isManual: false,
        });
      }
    }

    // Upsert merchant mappings (keys are already normalized)
    for (const [normalizedName, { category, isManual }] of manualMappings) {
      await prisma.merchantCategoryMap.upsert({
        where: {
          userId_merchantName: { userId, merchantName: normalizedName },
        },
        create: {
          userId,
          merchantName: normalizedName,
          category,
          isManual,
        },
        update: {
          category,
          isManual: isManual || undefined, // Only update to true, never to false
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: createdTransactions.count,
      learnedMerchants: manualMappings.size,
    });
  } catch (error) {
    console.error('Error confirming transactions:', error);
    return NextResponse.json(
      { error: 'שגיאה בשמירת העסקאות' },
      { status: 500 }
    );
  }
}

