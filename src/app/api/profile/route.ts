import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { encrypt, decrypt, ENCRYPTED_PROFILE_FIELDS } from '@/lib/encryption';

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

// Helper to decrypt profile fields
function decryptProfile<T extends Record<string, unknown>>(profile: T): T {
  const result = { ...profile };
  for (const field of ENCRYPTED_PROFILE_FIELDS) {
    if (field in result && typeof result[field] === 'string' && result[field]) {
      (result[field] as string) = decrypt(result[field] as string);
    }
  }
  return result;
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

    // Decrypt sensitive fields before returning
    return NextResponse.json(decryptProfile(profile));
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

    // Encrypt sensitive fields before storing
    const encryptedFields = { ...validFields };
    for (const field of ENCRYPTED_PROFILE_FIELDS) {
      if (field in encryptedFields && encryptedFields[field as keyof typeof encryptedFields]) {
        const value = encryptedFields[field as keyof typeof encryptedFields];
        if (typeof value === 'string') {
          (encryptedFields[field as keyof typeof encryptedFields] as string) = encrypt(value);
        }
      }
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: encryptedFields,
      create: {
        userId,
        ...encryptedFields,
      },
    });

    // Decrypt before returning
    return NextResponse.json(decryptProfile(profile));
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

