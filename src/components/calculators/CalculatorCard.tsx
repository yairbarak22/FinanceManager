'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import Card from '@/components/ui/Card';

interface CalculatorCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  children: ReactNode;
  disabled?: boolean;
}

export default function CalculatorCard({
  title,
  description,
  icon: Icon,
  iconBg,
  iconColor,
  children,
  disabled = false,
}: CalculatorCardProps) {
  return (
    <Card padding="md" className={disabled ? 'opacity-80' : ''}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#303150]">{title}</h3>
          <p className="text-sm text-[#7E7F90]">{description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {children}
      </div>
    </Card>
  );
}

// Reusable placeholder input component
interface PlaceholderInputProps {
  label: string;
  placeholder: string;
  disabled?: boolean;
}

export function PlaceholderInput({ label, placeholder, disabled = true }: PlaceholderInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#7E7F90] mb-1.5">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 bg-[#F7F7F8] border border-[#E8E8ED] rounded-xl 
                   text-[#303150] placeholder-[#BDBDCB]
                   focus:outline-none focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20
                   disabled:cursor-not-allowed disabled:opacity-60
                   transition-all duration-200"
      />
    </div>
  );
}

