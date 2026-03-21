import {
  Plane,
  Car,
  Home,
  GraduationCap,
  Umbrella,
  Wallet,
  Shield,
} from 'lucide-react';
import type { ElementType } from 'react';

export const GOAL_ICONS: Record<string, ElementType> = {
  travel: Plane,
  car: Car,
  home: Home,
  education: GraduationCap,
  vacation: Umbrella,
  saving: Wallet,
  emergency: Shield,
};

export function getGoalIcon(category: string): ElementType {
  return GOAL_ICONS[category] || Wallet;
}
