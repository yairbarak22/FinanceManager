import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { encrypt, decrypt, ENCRYPTED_PROFILE_FIELDS } from '@/lib/encryption';

// Valid enum values for profile fields
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

    // Get existing profile to preserve fields not being updated
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    // Build update object - only include fields that have valid values
    // If field is null/empty, preserve existing value
    const updateFields: Record<string, unknown> = {};

    // Validate and include enum fields only if they have valid values
    // If field is null/empty, preserve existing value (don't update)
    if (data.maritalStatus !== undefined) {
      if (data.maritalStatus !== null && data.maritalStatus !== '') {
        const value = validateEnum(data.maritalStatus, VALID_MARITAL_STATUS);
        if (value) {
          updateFields.maritalStatus = value;
        } else if (existingProfile) {
          updateFields.maritalStatus = existingProfile.maritalStatus;
        }
      } else if (existingProfile) {
        updateFields.maritalStatus = existingProfile.maritalStatus;
      }
    }

    if (data.employmentType !== undefined) {
      if (data.employmentType !== null && data.employmentType !== '') {
        const value = validateEnum(data.employmentType, VALID_EMPLOYMENT_TYPE);
        if (value) {
          updateFields.employmentType = value;
        } else if (existingProfile) {
          updateFields.employmentType = existingProfile.employmentType;
        }
      } else if (existingProfile) {
        updateFields.employmentType = existingProfile.employmentType;
      }
    }

    if (data.ageRange !== undefined) {
      if (data.ageRange !== null && data.ageRange !== '') {
        const value = validateEnum(data.ageRange, VALID_AGE_RANGE);
        if (value) {
          updateFields.ageRange = value;
        } else if (existingProfile) {
          updateFields.ageRange = existingProfile.ageRange;
        }
      } else if (existingProfile) {
        updateFields.ageRange = existingProfile.ageRange;
      }
    }

    if (data.monthlyIncome !== undefined) {
      if (data.monthlyIncome !== null && data.monthlyIncome !== '') {
        const value = validateEnum(data.monthlyIncome, VALID_MONTHLY_INCOME);
        if (value) {
          updateFields.monthlyIncome = value;
        } else if (existingProfile) {
          updateFields.monthlyIncome = existingProfile.monthlyIncome;
        }
      } else if (existingProfile) {
        updateFields.monthlyIncome = existingProfile.monthlyIncome;
      }
    }

    if (data.riskTolerance !== undefined) {
      if (data.riskTolerance !== null && data.riskTolerance !== '') {
        const value = validateEnum(data.riskTolerance, VALID_RISK_TOLERANCE);
        if (value) {
          updateFields.riskTolerance = value;
        } else if (existingProfile) {
          updateFields.riskTolerance = existingProfile.riskTolerance;
        }
      } else if (existingProfile) {
        updateFields.riskTolerance = existingProfile.riskTolerance;
      }
    }

    // Always update boolean and number fields (they have defaults)
    updateFields.hasChildren = Boolean(data.hasChildren);
    updateFields.childrenCount = Math.max(0, Math.min(10, Number(data.childrenCount) || 0));
    updateFields.hasIndependentAccount = Boolean(data.hasIndependentAccount);

    // Encrypt sensitive fields before storing
    for (const field of ENCRYPTED_PROFILE_FIELDS) {
      if (field in updateFields && updateFields[field]) {
        const value = updateFields[field];
        if (typeof value === 'string') {
          updateFields[field] = encrypt(value);
        }
      }
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: updateFields,
      create: {
        userId,
        ...updateFields,
      },
    });

    // Decrypt before returning
    return NextResponse.json(decryptProfile(profile));
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

