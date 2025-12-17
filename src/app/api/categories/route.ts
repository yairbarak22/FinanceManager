import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, withUserId } from '@/lib/authHelpers';
import {
  expenseCategories,
  incomeCategories,
  assetCategories,
  liabilityTypes,
  customCategoryToInfo,
  CategoryInfo,
} from '@/lib/categories';

// GET - Fetch all categories (default + custom) for the user
export async function GET(request: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    // Get user's custom categories
    const customCategories = await prisma.customCategory.findMany({
      where: withUserId(userId),
      orderBy: { createdAt: 'asc' },
    });

    // Convert custom categories to CategoryInfo format
    const customExpense: CategoryInfo[] = [];
    const customIncome: CategoryInfo[] = [];
    const customAsset: CategoryInfo[] = [];
    const customLiability: CategoryInfo[] = [];

    customCategories.forEach((cat) => {
      const categoryInfo = customCategoryToInfo(cat);
      switch (cat.type) {
        case 'expense':
          customExpense.push(categoryInfo);
          break;
        case 'income':
          customIncome.push(categoryInfo);
          break;
        case 'asset':
          customAsset.push(categoryInfo);
          break;
        case 'liability':
          customLiability.push(categoryInfo);
          break;
      }
    });

    // Return merged categories
    return NextResponse.json({
      expense: {
        default: expenseCategories,
        custom: customExpense,
      },
      income: {
        default: incomeCategories,
        custom: customIncome,
      },
      asset: {
        default: assetCategories,
        custom: customAsset,
      },
      liability: {
        default: liabilityTypes,
        custom: customLiability,
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create a new custom category
export async function POST(request: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { name, type, icon, color } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    if (!type || !['expense', 'income', 'asset', 'liability'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid category type' },
        { status: 400 }
      );
    }

    // Check for duplicate name within the same type
    const existing = await prisma.customCategory.findFirst({
      where: {
        userId,
        name: name.trim(),
        type,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'קטגוריה עם שם זה כבר קיימת' },
        { status: 400 }
      );
    }

    // Create the custom category
    const customCategory = await prisma.customCategory.create({
      data: {
        userId,
        name: name.trim(),
        type,
        icon: icon || null,
        color: color || null,
      },
    });

    return NextResponse.json(customCategoryToInfo(customCategory));
  } catch (error) {
    console.error('Error creating custom category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

