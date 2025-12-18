import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';

// Valid enum values for profile fields
const VALID_MILITARY_STATUS = ['none', 'reserve', 'career'];
const VALID_MARITAL_STATUS = ['single', 'married', 'divorced', 'widowed'];
const VALID_EMPLOYMENT_TYPE = ['employee', 'self_employed', 'both'];
const VALID_AGE_RANGE = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'];
const VALID_MONTHLY_INCOME = ['0-10000', '10000-20000', '20000-35000', '35000-50000', '50000+'];
const VALID_RISK_TOLERANCE = ['low', 'medium', 'high'];

// Helper to validate enum values
function validateEnum(value: unknown, validValues: string[]): string | null {
  if (!value || typeof value !== 'string') return null;
  return validValues.includes(value) ? value : null;
}

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

    // Validate and sanitize input with enum validation
    const validFields = {
      militaryStatus: validateEnum(data.militaryStatus, VALID_MILITARY_STATUS),
      maritalStatus: validateEnum(data.maritalStatus, VALID_MARITAL_STATUS),
      employmentType: validateEnum(data.employmentType, VALID_EMPLOYMENT_TYPE),
      hasChildren: Boolean(data.hasChildren),
      childrenCount: Math.max(0, Math.min(10, Number(data.childrenCount) || 0)),
      ageRange: validateEnum(data.ageRange, VALID_AGE_RANGE),
      monthlyIncome: validateEnum(data.monthlyIncome, VALID_MONTHLY_INCOME),
      riskTolerance: validateEnum(data.riskTolerance, VALID_RISK_TOLERANCE),
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

