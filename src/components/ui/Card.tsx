import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    variant?: 'default' | 'flat';
    style?: React.CSSProperties;
}

/**
 * Centralized Card component for consistent styling across dashboard
 * 
 * @param padding - Card padding size (default: 'md')
 * @param variant - Card style variant (default: 'default')
 * @param className - Additional CSS classes
 * @param style - Inline styles
 */
export default function Card({
    children,
    className = '',
    padding = 'md',
    variant = 'default',
    style
}: CardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    const variantClasses = {
        default: 'bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.08)]',
        flat: 'bg-white rounded-2xl border border-slate-200'
    };

    return (
        <div
            className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
            style={style}
        >
            {children}
        </div>
    );
}
