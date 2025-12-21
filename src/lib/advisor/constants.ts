/**
 * Financial Advisor Engine - Constants
 * קבועים למנוע הייעוץ הפיננסי
 */

// Interest rate thresholds
export const INTEREST_THRESHOLDS = {
  HIGH_INTEREST_RATE: 6, // Above this is considered high interest debt
  VERY_HIGH_INTEREST_RATE: 10, // Above this is very high (credit cards etc)
} as const;

// Age ranges for various benefits
export const AGE_RANGES = {
  CAREER_HOUSING_MIN: 24,
  CAREER_HOUSING_MAX: 45,
  YOUNG_PROFESSIONAL_MAX: 35,
} as const;

// Donation thresholds for tax benefits
export const DONATION_THRESHOLDS = {
  MIN_ANNUAL_FOR_TAX_CREDIT: 200, // Minimum annual donations for tax credit
  TAX_CREDIT_RATE: 0.35, // 35% tax credit on donations
} as const;

// Keywords for detecting donations in transactions
export const DONATION_KEYWORDS = [
  'תרומה',
  'תרומות',
  'עמותת',
  'עמותה',
  'jgive',
  'israelgives',
  'מתנות לאביונים',
  'צדקה',
  'charity',
  'donation',
] as const;

// Asset categories that count as real estate
export const REAL_ESTATE_CATEGORIES = [
  'real_estate',
  'apartment',
  'property',
  'נדל"ן',
  'דירה',
] as const;

// Asset liquidity types that are considered liquid
export const LIQUID_ASSET_TYPES = [
  'immediate',
  'short_term',
] as const;

// URLs for various services
export const SERVICE_URLS = {
  CAREER_HOUSING: 'https://www.megurim.org.il',
  OGEN_LOANS: 'https://www.ogen.org.il',
  TAX_AUTHORITY: 'https://www.gov.il/he/departments/israel_tax_authority',
  RESERVE_BENEFITS: 'https://www.miluim.idf.il',
} as const;

// Estimated values for various benefits
export const ESTIMATED_VALUES = {
  CAREER_HOUSING_SAVINGS: 200000, // Average savings on apartment
  RESERVE_BONUS_RATE: 0.25, // 25% additional compensation
} as const;
