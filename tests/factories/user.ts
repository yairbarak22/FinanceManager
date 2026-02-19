/**
 * User Test Data Factory
 *
 * Generates realistic fake user data for testing.
 * All data is fictional – never uses real customer data.
 */

import { faker } from '@faker-js/faker';

export interface UserFactoryData {
  id: string;
  name: string;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  hasSeenOnboarding: boolean;
  hasProAccess: boolean;
  signupSource: string | null;
  isMarketingSubscribed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileFactoryData {
  id: string;
  userId: string;
  militaryStatus: string | null;
  maritalStatus: string | null;
  employmentType: string | null;
  hasChildren: boolean;
  childrenCount: number;
  ageRange: string | null;
  monthlyIncome: string | null;
  riskTolerance: string | null;
  isStudent: boolean;
  hasIndependentAccount: boolean;
  cashBalance: number;
}

let userCounter = 0;

/**
 * Create a fake user with optional overrides.
 */
export function createUser(overrides: Partial<UserFactoryData> = {}): UserFactoryData {
  userCounter++;
  return {
    id: overrides.id || `test-user-${userCounter}-${faker.string.alphanumeric(8)}`,
    name: overrides.name || faker.person.fullName(),
    email: overrides.email || faker.internet.email().toLowerCase(),
    emailVerified: overrides.emailVerified ?? new Date(),
    image: overrides.image ?? faker.image.avatar(),
    hasSeenOnboarding: overrides.hasSeenOnboarding ?? true,
    hasProAccess: overrides.hasProAccess ?? false,
    signupSource: overrides.signupSource ?? null,
    isMarketingSubscribed: overrides.isMarketingSubscribed ?? true,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
}

/**
 * Create a fake user profile.
 */
export function createUserProfile(
  userId: string,
  overrides: Partial<UserProfileFactoryData> = {}
): UserProfileFactoryData {
  return {
    id: overrides.id || faker.string.alphanumeric(25),
    userId,
    militaryStatus: overrides.militaryStatus ?? faker.helpers.arrayElement(['none', 'reserve', 'career']),
    maritalStatus: overrides.maritalStatus ?? faker.helpers.arrayElement(['single', 'married', 'divorced']),
    employmentType: overrides.employmentType ?? faker.helpers.arrayElement(['employee', 'self_employed', 'both']),
    hasChildren: overrides.hasChildren ?? faker.datatype.boolean(),
    childrenCount: overrides.childrenCount ?? faker.number.int({ min: 0, max: 5 }),
    ageRange: overrides.ageRange ?? faker.helpers.arrayElement(['18-25', '26-35', '36-45', '46-55', '56-65']),
    monthlyIncome: overrides.monthlyIncome ?? faker.helpers.arrayElement(['0-5000', '5000-10000', '10000-20000', '20000+']),
    riskTolerance: overrides.riskTolerance ?? faker.helpers.arrayElement(['low', 'medium', 'high']),
    isStudent: overrides.isStudent ?? false,
    hasIndependentAccount: overrides.hasIndependentAccount ?? false,
    cashBalance: overrides.cashBalance ?? 0,
  };
}

/**
 * Create multiple fake users.
 */
export function createUsers(count: number, overrides: Partial<UserFactoryData> = {}): UserFactoryData[] {
  return Array.from({ length: count }, () => createUser(overrides));
}

/**
 * Reset the user counter (call in beforeEach for deterministic IDs).
 */
export function resetUserFactory(): void {
  userCounter = 0;
}

