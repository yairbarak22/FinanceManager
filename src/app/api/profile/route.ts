import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';

// GET - Fetch user profile
export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    let profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    // Create profile if doesn't exist
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: { userId },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const data = await request.json();

    // Validate and sanitize input
    const validFields = {
      militaryStatus: data.militaryStatus || null,
      maritalStatus: data.maritalStatus || null,
      employmentType: data.employmentType || null,
      hasChildren: Boolean(data.hasChildren),
      childrenCount: Math.max(0, Math.min(10, Number(data.childrenCount) || 0)),
      ageRange: data.ageRange || null,
      monthlyIncome: data.monthlyIncome || null,
      riskTolerance: data.riskTolerance || null,
    };

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: validFields,
      create: {
        userId,
        ...validFields,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

