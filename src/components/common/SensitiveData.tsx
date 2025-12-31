import React from 'react';
import { cn } from '@/lib/utils';

interface SensitiveDataProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * Wraps sensitive information (prices, balances, names) to mask it in Smartlook recordings.
 * 
 * This component applies:
 * - `data-sl="mask"` - Official Smartlook attribute that replaces text with *
 * - `.sl-mask` class - Backup for dashboard-based masking rules
 * - `data-privacy="masked"` - Custom attribute for additional targeting
 * 
 * Usage:
 * ```tsx
 * <SensitiveData>{formatCurrency(amount)}</SensitiveData>
 * <SensitiveData as="p" className="text-xl font-bold">{user.name}</SensitiveData>
 * <SensitiveData as="p" className="..." dir="ltr">{email}</SensitiveData>
 * ```
 */
export const SensitiveData = ({ 
  children, 
  className, 
  as: Component = 'span',
  ...rest
}: SensitiveDataProps) => {
  return (
    <Component 
      className={cn("sl-mask", className)} 
      data-sl="mask"
      data-privacy="masked"
      {...rest}
    >
      {children}
    </Component>
  );
};

export default SensitiveData;
