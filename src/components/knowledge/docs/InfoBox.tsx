'use client';

import { Info, AlertTriangle, Lightbulb } from 'lucide-react';
import type { ReactNode } from 'react';

interface CalloutProps {
  children: ReactNode;
}

const variants = {
  info: {
    bg: 'rgba(193,221,255,0.2)',
    border: '#69ADFF',
    icon: Info,
    iconColor: '#69ADFF',
  },
  warning: {
    bg: 'rgba(255,192,219,0.2)',
    border: '#F18AB5',
    icon: AlertTriangle,
    iconColor: '#F18AB5',
  },
  tip: {
    bg: 'rgba(180,241,241,0.2)',
    border: '#0DBACC',
    icon: Lightbulb,
    iconColor: '#0DBACC',
  },
} as const;

function Callout({ children, variant }: CalloutProps & { variant: keyof typeof variants }) {
  const v = variants[variant];
  const Icon = v.icon;

  return (
    <div
      className="rounded-xl p-4 my-4 flex items-start gap-3"
      style={{
        background: v.bg,
        borderInlineStart: `4px solid ${v.border}`,
      }}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: v.iconColor }} />
      <div className="text-[14px] text-[#303150] leading-relaxed flex-1">
        {children}
      </div>
    </div>
  );
}

export function InfoBox({ children }: CalloutProps) {
  return <Callout variant="info">{children}</Callout>;
}

export function WarningBox({ children }: CalloutProps) {
  return <Callout variant="warning">{children}</Callout>;
}

export function TipBox({ children }: CalloutProps) {
  return <Callout variant="tip">{children}</Callout>;
}
