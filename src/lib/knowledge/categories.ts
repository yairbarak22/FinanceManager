import {
  Monitor,
  Wallet,
  TrendingUp,
  Home,
  Shield,
  CreditCard,
  Play,
  Zap,
  HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CategoryId =
  | 'all'
  | 'system-guides'
  | 'finance-basics'
  | 'investments'
  | 'housing'
  | 'pension-insurance'
  | 'debt-credit'
  | 'invest-basics'
  | 'invest-course'
  | 'invest-action'
  | 'invest-faq';

export interface Category {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  color: string;
  colorLight: string;
}

export const categories: Category[] = [
  {
    id: 'all',
    label: 'הכל',
    icon: Monitor,
    color: '#303150',
    colorLight: '#F7F7F8',
  },
  {
    id: 'system-guides',
    label: 'מדריכי המערכת',
    icon: Monitor,
    color: '#2B4699',
    colorLight: '#C1DDFF',
  },
  {
    id: 'finance-basics',
    label: 'ידע פיננסי בסיסי',
    icon: Wallet,
    color: '#0DBACC',
    colorLight: '#B4F1F1',
  },
  {
    id: 'investments',
    label: 'השקעות ושוק ההון',
    icon: TrendingUp,
    color: '#69ADFF',
    colorLight: '#C1DDFF',
  },
  {
    id: 'housing',
    label: 'דיור ומשכנתאות',
    icon: Home,
    color: '#9F7FE0',
    colorLight: '#E3D6FF',
  },
  {
    id: 'pension-insurance',
    label: 'פנסיה וביטוח',
    icon: Shield,
    color: '#F18AB5',
    colorLight: '#FFC0DB',
  },
  {
    id: 'debt-credit',
    label: 'חובות ואשראי',
    icon: CreditCard,
    color: '#7E7F90',
    colorLight: '#E8E8ED',
  },
  {
    id: 'invest-basics',
    label: 'יסודות ההשקעה',
    icon: TrendingUp,
    color: '#2B4699',
    colorLight: '#C1DDFF',
  },
  {
    id: 'invest-course',
    label: 'קורס מעשי',
    icon: Play,
    color: '#0DBACC',
    colorLight: '#B4F1F1',
  },
  {
    id: 'invest-action',
    label: 'התחל להשקיע',
    icon: Zap,
    color: '#F18AB5',
    colorLight: '#FFE0EC',
  },
  {
    id: 'invest-faq',
    label: 'שאלות נפוצות',
    icon: HelpCircle,
    color: '#9F7FE0',
    colorLight: '#E3D6FF',
  },
];

export function getCategoryById(id: CategoryId): Category | undefined {
  return categories.find((c) => c.id === id);
}
