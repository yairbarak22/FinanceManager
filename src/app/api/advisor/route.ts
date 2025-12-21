/**
 * Financial Advisor API Route
 * נתיב API להמלצות פיננסיות
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserFinancialContext } from '@/lib/advisor/context';
import { generateRecommendations } from '@/lib/advisor/engine';

/**
 * POST /api/advisor
 * Generate personalized financial recommendations
 */
export async function POST() {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'לא מחובר' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user's financial context
    const context = await getUserFinancialContext(userId);

    // Generate recommendations
    const recommendations = await generateRecommendations(context);

    return NextResponse.json({
      success: true,
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error('Advisor API error:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת ההמלצות' },
      { status: 500 }
    );
  }
}

