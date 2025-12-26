import {
  Home,
  Utensils,
  Car,
  Film,
  FileText,
  Heart,
  Briefcase,
  Gift,
  TrendingUp,
  MoreHorizontal,
  Building2,
  Banknote,
  LucideIcon,
  ShoppingBag,
  GraduationCap,
  CreditCard,
  PawPrint,
  PiggyBank,
  Sparkles,
  Wifi,
  Laptop,
  Wallet,
  Baby,
  Building,
  LineChart,
  Bitcoin,
  Landmark,
  Star,
} from 'lucide-react';

export interface CategoryInfo {
  id: string;
  name: string;
  nameHe: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  textColor: string;
  isCustom?: boolean;
}

// ============================================
// EXPENSE CATEGORIES (15)
// ============================================
export const expenseCategories: CategoryInfo[] = [
  {
    id: 'food',
    name: 'Food',
    nameHe: 'מזון',
    icon: Utensils, // Assuming Utensils is the closest LucideIcon for '🍽️'
    color: '#1E3269',
    bgColor: 'bg-blue-900', // Placeholder, as original instruction didn't provide these
    textColor: 'text-white', // Placeholder
  },
  {
    id: 'transportation',
    name: 'Transportation',
    nameHe: 'תחבורה',
    icon: Car, // Assuming Car is the closest LucideIcon for '🚗'
    color: '#2B4699',
    bgColor: 'bg-blue-800', // Placeholder
    textColor: 'text-white', // Placeholder
  },
  {
    id: 'utilities',
    name: 'Utilities',
    nameHe: 'חשבונות',
    icon: FileText, // Assuming FileText is the closest LucideIcon for '💡' (bills)
    color: '#4F5ECE',
    bgColor: 'bg-indigo-800', // Placeholder
    textColor: 'text-white', // Placeholder
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    nameHe: 'בילויים',
    icon: Film,
    color: '#a855f7',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
  },
  {
    id: 'bills',
    name: 'Bills',
    nameHe: 'חשבונות',
    icon: FileText,
    color: '#6b7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
  },
  {
    id: 'health',
    name: 'Health',
    nameHe: 'בריאות',
    icon: Heart,
    color: '#ef4444',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    nameHe: 'קניות',
    icon: ShoppingBag,
    color: '#ec4899',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-600',
  },
  {
    id: 'education',
    name: 'Education',
    nameHe: 'חינוך',
    icon: GraduationCap,
    color: '#8b5cf6',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600',
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    nameHe: 'מנויים',
    icon: CreditCard,
    color: '#0891b2',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-600',
  },
  {
    id: 'pets',
    name: 'Pets',
    nameHe: 'חיות מחמד',
    icon: PawPrint,
    color: '#d97706',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
  },
  {
    id: 'gifts',
    name: 'Gifts & Donations',
    nameHe: 'מתנות ותרומות',
    icon: Gift,
    color: '#e11d48',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-600',
  },
  {
    id: 'savings',
    name: 'Savings',
    nameHe: 'חיסכון',
    icon: PiggyBank,
    color: '#059669',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
  },
  {
    id: 'personal_care',
    name: 'Personal Care',
    nameHe: 'טיפוח',
    icon: Sparkles,
    color: '#f472b6',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-500',
  },
  {
    id: 'communication',
    name: 'Communication',
    nameHe: 'תקשורת',
    icon: Wifi,
    color: '#0284c7',
    bgColor: 'bg-sky-100',
    textColor: 'text-sky-600',
  },
  {
    id: 'other',
    name: 'Other',
    nameHe: 'אחר',
    icon: MoreHorizontal,
    color: '#64748b',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
  },
];

// ============================================
// INCOME CATEGORIES (8)
// ============================================
export const incomeCategories: CategoryInfo[] = [
  {
    id: 'salary',
    name: 'Salary',
    nameHe: 'משכורת',
    icon: Briefcase,
    color: '#22c55e',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
  },
  {
    id: 'bonus',
    name: 'Bonus',
    nameHe: 'בונוס',
    icon: Gift,
    color: '#14b8a6',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
  },
  {
    id: 'investment',
    name: 'Investment',
    nameHe: 'השקעות',
    icon: TrendingUp,
    color: '#0ea5e9',
    bgColor: 'bg-sky-100',
    textColor: 'text-sky-600',
  },
  {
    id: 'rental',
    name: 'Rental',
    nameHe: 'שכירות',
    icon: Building,
    color: '#8b5cf6',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600',
  },
  {
    id: 'freelance',
    name: 'Freelance',
    nameHe: 'פרילנס',
    icon: Laptop,
    color: '#f59e0b',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
  },
  {
    id: 'pension',
    name: 'Pension',
    nameHe: 'פנסיה',
    icon: Wallet,
    color: '#06b6d4',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-600',
  },
  {
    id: 'child_allowance',
    name: 'Child Allowance',
    nameHe: 'קצבת ילדים',
    icon: Baby,
    color: '#ec4899',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-600',
  },
  {
    id: 'other',
    name: 'Other',
    nameHe: 'אחר',
    icon: MoreHorizontal,
    color: '#64748b',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
  },
];

// ============================================
// ASSET CATEGORIES (10)
// ============================================
export const assetCategories: CategoryInfo[] = [
  {
    id: 'real_estate',
    name: 'Real Estate',
    nameHe: 'נדל"ן',
    icon: Building2,
    color: '#8b5cf6',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600',
  },
  {
    id: 'stocks',
    name: 'Stocks',
    nameHe: 'שוק ההון',
    icon: LineChart,
    color: '#22c55e',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
  },
  {
    id: 'crypto',
    name: 'Crypto',
    nameHe: 'קריפטו',
    icon: Bitcoin,
    color: '#f59e0b',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
  },
  {
    id: 'pension_fund',
    name: 'Pension Fund',
    nameHe: 'פנסיה',
    icon: Briefcase,
    color: '#06b6d4',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-600',
  },
  {
    id: 'education_fund',
    name: 'Education Fund',
    nameHe: 'קרן השתלמות',
    icon: GraduationCap,
    color: '#a855f7',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
  },
  {
    id: 'savings_account',
    name: 'Savings Account',
    nameHe: 'חיסכון בנקאי',
    icon: PiggyBank,
    color: '#3b82f6',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
  },
  {
    id: 'investments',
    name: 'Investments',
    nameHe: 'השקעות אחרות',
    icon: TrendingUp,
    color: '#0ea5e9',
    bgColor: 'bg-sky-100',
    textColor: 'text-sky-600',
  },
  {
    id: 'vehicle',
    name: 'Vehicle',
    nameHe: 'רכב',
    icon: Car,
    color: '#ef4444',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
  },
  {
    id: 'cash',
    name: 'Cash',
    nameHe: 'מזומן',
    icon: Banknote,
    color: '#10b981',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
  },
  {
    id: 'other',
    name: 'Other',
    nameHe: 'אחר',
    icon: MoreHorizontal,
    color: '#64748b',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
  },
];

// ============================================
// LIABILITY TYPES (5)
// ============================================
export const liabilityTypes: CategoryInfo[] = [
  {
    id: 'loan',
    name: 'Loan',
    nameHe: 'הלוואה',
    icon: Banknote,
    color: '#f97316',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
  },
  {
    id: 'mortgage',
    name: 'Mortgage',
    nameHe: 'משכנתא',
    icon: Home,
    color: '#ec4899',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-600',
  },
  {
    id: 'credit_card',
    name: 'Credit Card',
    nameHe: 'כרטיס אשראי',
    icon: CreditCard,
    color: '#8b5cf6',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600',
  },
  {
    id: 'car_loan',
    name: 'Car Loan',
    nameHe: 'הלוואת רכב',
    icon: Car,
    color: '#3b82f6',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
  },
  {
    id: 'student_loan',
    name: 'Student Loan',
    nameHe: 'הלוואת סטודנטים',
    icon: GraduationCap,
    color: '#14b8a6',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
  },
];

// ============================================
// ICON MAP - For custom categories
// ============================================
export const iconMap: { [key: string]: LucideIcon } = {
  Home,
  Utensils,
  Car,
  Film,
  FileText,
  Heart,
  Briefcase,
  Gift,
  TrendingUp,
  MoreHorizontal,
  Building2,
  Banknote,
  ShoppingBag,
  GraduationCap,
  CreditCard,
  PawPrint,
  PiggyBank,
  Sparkles,
  Wifi,
  Laptop,
  Wallet,
  Baby,
  Building,
  LineChart,
  Bitcoin,
  Landmark,
  Star,
};

// Default icon for custom categories
export const defaultCustomIcon = Star;

// Default colors for custom categories
export const customCategoryColors = [
  { color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-600' },
  { color: '#f97316', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
  { color: '#eab308', bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
  { color: '#22c55e', bgColor: 'bg-green-100', textColor: 'text-green-600' },
  { color: '#14b8a6', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
  { color: '#0ea5e9', bgColor: 'bg-sky-100', textColor: 'text-sky-600' },
  { color: '#8b5cf6', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' },
  { color: '#ec4899', bgColor: 'bg-rose-100', textColor: 'text-rose-600' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getCategoryInfo(
  categoryId: string,
  type: 'income' | 'expense' | 'asset' | 'liability',
  customCategories?: CategoryInfo[]
): CategoryInfo | undefined {
  // First check default categories
  let result: CategoryInfo | undefined;

  switch (type) {
    case 'income':
      result = incomeCategories.find(c => c.id === categoryId);
      break;
    case 'expense':
      result = expenseCategories.find(c => c.id === categoryId);
      break;
    case 'asset':
      result = assetCategories.find(c => c.id === categoryId);
      break;
    case 'liability':
      result = liabilityTypes.find(c => c.id === categoryId);
      break;
  }

  // If not found in defaults, check custom categories
  if (!result && customCategories) {
    result = customCategories.find(c => c.id === categoryId);
  }

  return result;
}

export function getAllCategories(type: 'income' | 'expense'): CategoryInfo[] {
  return type === 'income' ? incomeCategories : expenseCategories;
}

export function getDefaultCategories(type: 'expense' | 'income' | 'asset' | 'liability'): CategoryInfo[] {
  switch (type) {
    case 'expense':
      return expenseCategories;
    case 'income':
      return incomeCategories;
    case 'asset':
      return assetCategories;
    case 'liability':
      return liabilityTypes;
  }
}

// Convert custom category from DB to CategoryInfo
export function customCategoryToInfo(dbCategory: {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
  color?: string | null;
}): CategoryInfo {
  const colorIndex = dbCategory.name.length % customCategoryColors.length;
  const colorInfo = dbCategory.color
    ? customCategoryColors.find(c => c.color === dbCategory.color) || customCategoryColors[colorIndex]
    : customCategoryColors[colorIndex];

  return {
    id: dbCategory.id,
    name: dbCategory.name,
    nameHe: dbCategory.name,
    icon: dbCategory.icon && iconMap[dbCategory.icon] ? iconMap[dbCategory.icon] : defaultCustomIcon,
    color: colorInfo.color,
    bgColor: colorInfo.bgColor,
    textColor: colorInfo.textColor,
    isCustom: true,
  };
}
