import { BookOpen, Play, Zap, HelpCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type InvestCategoryId =
  | 'all'
  | 'invest-basics'
  | 'invest-course'
  | 'invest-action'
  | 'invest-faq';

export interface InvestCategory {
  id: InvestCategoryId;
  label: string;
  icon: LucideIcon;
  color: string;
  colorLight: string;
}

export const investCategories: InvestCategory[] = [
  {
    id: 'all',
    label: 'הכל',
    icon: BookOpen,
    color: '#303150',
    colorLight: '#F7F7F8',
  },
  {
    id: 'invest-basics',
    label: 'יסודות ההשקעה',
    icon: BookOpen,
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

export function getInvestCategoryById(
  id: InvestCategoryId
): InvestCategory | undefined {
  return investCategories.find((c) => c.id === id);
}
