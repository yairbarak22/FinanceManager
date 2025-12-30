/**
 * Financial Advisor Engine - Constants
 * קבועים למנוע הייעוץ הפיננסי
 */

// Interest rate thresholds
export const INTEREST_THRESHOLDS = {
  HIGH_INTEREST_RATE: 6, // Above this is considered high interest debt
  VERY_HIGH_INTEREST_RATE: 10, // Above this is very high (credit cards etc)
  KEREN_LOAN_RATE: 5, // Typical keren hishtalmut loan rate (prime minus)
} as const;

// Income thresholds
export const INCOME_THRESHOLDS = {
  WORK_GRANT_MIN: 2430,
  WORK_GRANT_MAX: 7520,
  OGEN_MIN: 3000,
  OGEN_MAX: 20000,
} as const;

// Age ranges for various benefits
export const AGE_RANGES = {
  CAREER_HOUSING_MIN: 24,
  CAREER_HOUSING_MAX: 45,
  YOUNG_PROFESSIONAL_MAX: 35,
} as const;

// Age thresholds for specific benefits
export const AGE_THRESHOLDS = {
  WORK_GRANT_WITH_CHILDREN: 21,
  WORK_GRANT_WITHOUT_CHILDREN: 55,
  HAR_HAKESEF_MIN: 25,
} as const;

// Balance thresholds
export const BALANCE_THRESHOLDS = {
  KEREN_HISHTALMUT_IRA: 300000, // Min for IRA consideration
  KEREN_HISHTALMUT_LEVERAGE: 50000, // Min for leverage consideration
  BANK_FEES_HIGH: 20, // Monthly fees threshold
  RENT_EXEMPTION: 5654, // Monthly rent income exemption (2024)
  SOLAR_ANNUAL_EXEMPTION: 24000,
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

// Keywords for transaction detection
export const KEYWORDS = {
  KEREN_HISHTALMUT: ['קרן השתלמות', 'קה"ש', 'hishtalmut', 'education_fund'],
  CONSUMER_CLUBS: ['חבר', 'אשמורת', 'הייטקזון', 'קרן ידע'],
  ARNONA: ['ארנונה', 'עירייה', 'מועצה מקומית'],
  LIFE_INSURANCE: ['ביטוח חיים', 'ריסק', 'ביטוח משכנתא'],
  RENT_INCOME: ['שכר דירה', 'דמי שכירות', 'שוכר'],
  SPECIAL_NEEDS: ['מכון התפתחות', 'נוירולוג', 'ריפוי בעיסוק', 'קלינאית תקשורת', 'התפתחות הילד'],
  DAYCARE: ['מעון', 'ויצו', 'נעמת', 'גן ילדים פרטי', 'צהרון'],
  BANK_FEES: ['עמלה', 'עמלות', 'דמי ניהול חשבון'],
  ELECTRICITY_INCOME: ['חברת חשמל', 'יצרן חשמל', 'זיכוי חשמל'],
  CHILD_SAVINGS: ['חיסכון לכל ילד', 'ביטוח לאומי ילדים'],
} as const;

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

// Asset categories that are inherently liquid (cash, stocks, etc.)
export const LIQUID_ASSET_CATEGORIES = [
  'cash',
  'מזומן',
  'עו"ש',
  'חשבון עו"ש',
  'checking',
  'savings',
  'חיסכון',
  'פקדון',
  'deposit',
  'stocks',
  'שוק ההון',
  'מניות',
  'crypto',
  'קריפטו',
  'investments',
  'השקעות',
] as const;

// URLs for various services
export const SERVICE_URLS = {
  // Existing
  CAREER_HOUSING: 'https://www.megurim.org.il',
  OGEN_LOANS: 'https://www.ogen.org.il',
  TAX_AUTHORITY: 'https://www.gov.il/he/departments/israel_tax_authority',
  RESERVE_BENEFITS: 'https://www.miluim.idf.il',
  
  // Category 1: Leverage & Arbitrage
  KEREN_LOAN: 'https://www.kolzchut.org.il/he/הלוואה_מהכספים_הצבורים_בקופת_גמל_או_בקרן_השתלמות',
  SPARKIL: 'https://www.sparkil.org/he',
  CONSUMER_CLUBS: 'https://www.hvr.co.il/',
  IRA_INFO: 'https://www.mygemel.net/ira',
  
  // Category 2: Tax Benefits
  WORK_GRANT: 'https://www.gov.il/he/service/work_grant_online_check',
  SPECIAL_NEEDS_CREDIT: 'https://www.kolzchut.org.il/he/נקודות_זיכוי_ממס_הכנסה_בגין_ילד_במסגרת_לחינוך_מיוחד',
  LIFE_INSURANCE_CREDIT: 'https://www.kolzchut.org.il/he/זיכוי_ממס_הכנסה_על_הפרשות_לביטוח_מנהלים_או_לביטוח_חיים',
  RENT_TAX_EXEMPTION: 'https://www.gov.il/he/service/income-tax-rental-residential-apartment',
  SOLAR_TAX_EXEMPTION: 'https://www.kolzchut.org.il/he/פטור_ממס_הכנסה_למפיקי_חשמל_באמצעות_אנרגיה_מתחדשת',
  
  // Category 3: Consumer Rights
  MILUIM_ARNONA: 'https://www.miluim.idf.il/',
  SAVINGS_FOR_CHILD: 'https://hly.gov.il/',
  HAR_HAKESEF: 'https://itur.mof.gov.il/',
  BITUACH_LEUMI_REFUND: 'https://www.btl.gov.il/',
  DAYCARE_SUBSIDY: 'https://www.gov.il/he/departments/topics/daycare-subsidies',
  BANK_FEES_INFO: 'https://www.boi.org.il/',
  STUDENT_BANK: 'https://www.kolzchut.org.il/he/חשבון_בנק_לסטודנטים',
  KEREN_HISHTALMUT_SELF: 'https://www.kolzchut.org.il/he/הפרשה_לקרן_השתלמות_לעצמאי',
} as const;

// Estimated values for various benefits
export const ESTIMATED_VALUES = {
  CAREER_HOUSING_SAVINGS: 200000, // Average savings on apartment
  RESERVE_BONUS_RATE: 0.25, // 25% additional compensation
  WORK_GRANT_MAX: 13000, // Max annual work grant
  SPECIAL_NEEDS_CREDIT: 5808, // 2 credit points value
  CHILD_SAVINGS_TOTAL: 20000, // Estimated total per child at 18
  KEREN_IRA_SAVINGS: 1500, // Annual savings from lower fees
  DAYCARE_SUBSIDY_MAX: 20000, // Max annual subsidy
} as const;
