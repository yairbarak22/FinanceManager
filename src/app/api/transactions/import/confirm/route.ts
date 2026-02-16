/**
 * Confirm Transaction Import API
 * שומר עסקאות לאחר אישור המשתמש (כולל עסקאות שעברו Review)
 * כולל בדיקת כפילויות והתראה למשתמש
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';

// Valid categories (must match categories.ts)
const VALID_EXPENSE_CATEGORIES = [
  'housing', 'food', 'transport', 'entertainment', 'bills', 'health',
  'shopping', 'education', 'subscriptions', 'pets', 'gifts', 'savings',
  'personal_care', 'communication', 'maaser', 'donation', 'other'
];
const VALID_INCOME_CATEGORIES = [
  'salary', 'bonus', 'investment', 'rental', 'freelance', 'pension',
  'child_allowance', 'other'
];

// Transaction to save
interface TransactionToSave {
  merchantName: string;
  amount: number;
  date: string; // ISO string
  type: 'income' | 'expense';
  category: string;
  isManualCategory?: boolean; // If the user manually set this category
}

// Duplicate transaction info
interface DuplicateInfo {
  transaction: TransactionToSave;
  existing: {
    id: string;
    date: string;
    amount: number;
    description: string;
  };
}

interface ConfirmRequest {
  transactions: TransactionToSave[];
  skipDuplicateCheck?: boolean; // If true, save despite duplicates
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body: ConfirmRequest = await request.json();
    const { transactions, skipDuplicateCheck = false } = body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'לא התקבלו עסקאות לשמירה' },
        { status: 400 }
      );
    }

    // Validate all transactions have required fields and valid categories
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (!t.merchantName || !t.amount || !t.date || !t.type || !t.category) {
        return NextResponse.json(
          { error: `עסקה ${i + 1}: חסרים שדות חובה` },
          { status: 400 }
        );
      }

      // Validate category matches transaction type
      const validCategories = t.type === 'income' ? VALID_INCOME_CATEGORIES : VALID_EXPENSE_CATEGORIES;
      if (!validCategories.includes(t.category)) {
        console.warn(`[Confirm Import] Invalid category "${t.category}" for ${t.type} transaction "${t.merchantName}", falling back to "other"`);
        t.category = 'other';
      }
    }

    // ============================================
    // CHECK FOR DUPLICATES
    // ============================================
    if (!skipDuplicateCheck) {
      const duplicates: DuplicateInfo[] = [];
      
      // Check each transaction for duplicates
      for (const t of transactions) {
        const transactionDate = new Date(t.date);
        const startOfDay = new Date(transactionDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(transactionDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const existing = await prisma.transaction.findFirst({
          where: {
            userId,
            type: t.type,
            amount: t.amount,
            description: t.merchantName,
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          select: {
            id: true,
            date: true,
            amount: true,
            description: true,
          },
        });
        
        if (existing) {
          duplicates.push({
            transaction: t,
            existing: {
              id: existing.id,
              date: existing.date.toISOString(),
              amount: existing.amount,
              description: existing.description,
            },
          });
        }
      }
      
      // If duplicates found, return them without saving
      if (duplicates.length > 0) {
        return NextResponse.json({
          success: false,
          hasDuplicates: true,
          duplicates,
          duplicateCount: duplicates.length,
          totalCount: transactions.length,
        });
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

    // Upsert merchant mappings using batch transaction (N+1 fix)
    // Keys are already normalized
    const upsertOperations = Array.from(manualMappings.entries()).map(
      ([normalizedName, { category, isManual }]) =>
        prisma.merchantCategoryMap.upsert({
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
        })
    );

    // Execute all upserts in a single transaction
    if (upsertOperations.length > 0) {
      await prisma.$transaction(upsertOperations);
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

