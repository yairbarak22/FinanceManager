import React from 'react';

interface SensitiveDataProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * Wraps sensitive information (prices, balances, names) with a semantic privacy marker.
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
      className={className} 
      data-privacy="masked"
      {...rest}
    >
      {children}
    </Component>
  );
};

export default SensitiveData;
