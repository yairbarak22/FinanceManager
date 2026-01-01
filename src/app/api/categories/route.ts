import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, withUserId, withSharedAccount } from '@/lib/authHelpers';

// Serializable custom category type for API response
interface CustomCategoryResponse {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  isCustom: boolean;
}

// GET - Fetch only custom categories for the user
// Default categories are handled client-side (they contain non-serializable icon components)
export async function GET(request: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    // Get custom categories from all users in the shared account
    // This ensures shared account members can see each other's custom categories
    const customCategories = await prisma.customCategory.findMany({
      where: await withSharedAccount(userId),
      orderBy: { createdAt: 'asc' },
    });

    // Group custom categories by type (return only serializable data)
    const customExpense: CustomCategoryResponse[] = [];
    const customIncome: CustomCategoryResponse[] = [];
    const customAsset: CustomCategoryResponse[] = [];
    const customLiability: CustomCategoryResponse[] = [];

    customCategories.forEach((cat) => {
      const categoryResponse: CustomCategoryResponse = {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isCustom: true,
      };

      switch (cat.type) {
        case 'expense':
          customExpense.push(categoryResponse);
          break;
        case 'income':
          customIncome.push(categoryResponse);
          break;
        case 'asset':
          customAsset.push(categoryResponse);
          break;
        case 'liability':
          customLiability.push(categoryResponse);
          break;
      }
    });

    // Return only custom categories (default categories are on client-side)
    return NextResponse.json({
      expense: customExpense,
      income: customIncome,
      asset: customAsset,
      liability: customLiability,
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

    // Return serializable response
    return NextResponse.json({
      id: customCategory.id,
      name: customCategory.name,
      type: customCategory.type,
      icon: customCategory.icon,
      color: customCategory.color,
      isCustom: true,
    });
  } catch (error) {
    console.error('Error creating custom category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
