'use client';

import type { LessonBadgeType } from './coursesData';

const badgeConfig: Record<LessonBadgeType, { label: string; bg: string; text: string }> = {
  FREE: { label: 'חינמי', bg: 'bg-[#0DBACC]/10', text: 'text-[#0DBACC]' },
  BEGINNER: { label: 'מתחילים', bg: 'bg-[#69ADFF]/10', text: 'text-[#69ADFF]' },
  INTERMEDIATE: { label: 'בינוני', bg: 'bg-[#9F7FE0]/10', text: 'text-[#9F7FE0]' },
  PREMIUM: { label: 'פרמיום', bg: 'bg-[#E9A800]/10', text: 'text-[#E9A800]' },
};

interface LessonBadgeProps {
  type: LessonBadgeType;
}

export default function LessonBadge({ type }: LessonBadgeProps) {
  const config = badgeConfig[type];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
