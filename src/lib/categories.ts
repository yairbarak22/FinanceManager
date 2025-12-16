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
  LucideIcon
} from 'lucide-react';

export interface CategoryInfo {
  id: string;
  name: string;
  nameHe: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  textColor: string;
}

export const expenseCategories: CategoryInfo[] = [
  {
    id: 'housing',
    name: 'Housing',
    nameHe: 'דיור',
    icon: Home,
    color: '#f97316',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
  },
  {
    id: 'food',
    name: 'Food',
    nameHe: 'מזון',
    icon: Utensils,
    color: '#eab308',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-600',
  },
  {
    id: 'transport',
    name: 'Transport',
    nameHe: 'תחבורה',
    icon: Car,
    color: '#3b82f6',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
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
    id: 'other',
    name: 'Other',
    nameHe: 'אחר',
    icon: MoreHorizontal,
    color: '#64748b',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
  },
];

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
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-600',
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
    id: 'other',
    name: 'Other',
    nameHe: 'אחר',
    icon: MoreHorizontal,
    color: '#64748b',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
  },
];

export const assetCategories: CategoryInfo[] = [
  {
    id: 'investments',
    name: 'Investments',
    nameHe: 'השקעות',
    icon: TrendingUp,
    color: '#0ea5e9',
    bgColor: 'bg-sky-100',
    textColor: 'text-sky-600',
  },
  {
    id: 'real_estate',
    name: 'Real Estate',
    nameHe: 'נדל"ן',
    icon: Building2,
    color: '#8b5cf6',
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-600',
  },
];

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
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-600',
  },
];

export function getCategoryInfo(categoryId: string, type: 'income' | 'expense' | 'asset' | 'liability'): CategoryInfo | undefined {
  switch (type) {
    case 'income':
      return incomeCategories.find(c => c.id === categoryId);
    case 'expense':
      return expenseCategories.find(c => c.id === categoryId);
    case 'asset':
      return assetCategories.find(c => c.id === categoryId);
    case 'liability':
      return liabilityTypes.find(c => c.id === categoryId);
    default:
      return undefined;
  }
}

export function getAllCategories(type: 'income' | 'expense'): CategoryInfo[] {
  return type === 'income' ? incomeCategories : expenseCategories;
}

