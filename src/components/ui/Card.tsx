import React, { forwardRef } from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    variant?: 'default' | 'flat' | 'hero' | 'income' | 'expense' | 'savings' | 'turquoise' | 'blue' | 'pink' | 'lavender';
    style?: React.CSSProperties;
    id?: string;
}

/**
 * Centralized Card component for consistent styling across dashboard
 * Updated for Fincheck design system
 * 
 * @param padding - Card padding size (default: 'md')
 * @param variant - Card style variant (default: 'default')
 * @param className - Additional CSS classes
 * @param style - Inline styles
 */
const Card = forwardRef<HTMLDivElement, CardProps>(({
    children,
    className = '',
    padding = 'md',
    variant = 'default',
    style,
    id
}, ref) => {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    const variantClasses = {
        // Default white card with soft shadow (Fincheck style)
        default: 'bg-white rounded-3xl border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)]',
        // Flat card without shadow
        flat: 'bg-white rounded-3xl border border-slate-100',
        // Hero gradient card (Turquoise to Blue)
        hero: 'rounded-3xl text-white border-0 shadow-[0_8px_32px_rgba(13,186,204,0.3)]',
        // Income card (Blue gradient)
        income: 'rounded-3xl text-white border-0 shadow-[0_4px_20px_rgba(105,173,255,0.25)]',
        // Expense card (Pink gradient)
        expense: 'rounded-3xl text-white border-0 shadow-[0_4px_20px_rgba(241,138,181,0.25)]',
        // Savings card (Lavender gradient)
        savings: 'rounded-3xl text-white border-0 shadow-[0_4px_20px_rgba(159,127,224,0.25)]',
        // Individual gradient variants
        turquoise: 'rounded-3xl text-white border-0 shadow-[0_4px_20px_rgba(13,186,204,0.25)]',
        blue: 'rounded-3xl text-white border-0 shadow-[0_4px_20px_rgba(105,173,255,0.25)]',
        pink: 'rounded-3xl text-white border-0 shadow-[0_4px_20px_rgba(241,138,181,0.25)]',
        lavender: 'rounded-3xl text-white border-0 shadow-[0_4px_20px_rgba(159,127,224,0.25)]'
    };

    const gradientStyles: Record<string, React.CSSProperties> = {
        hero: { background: 'linear-gradient(135deg, #0DBACC 0%, #69ADFF 100%)' },
        income: { background: 'linear-gradient(135deg, #C1DDFF 0%, #69ADFF 100%)' },
        expense: { background: 'linear-gradient(135deg, #FFC0DB 0%, #F18AB5 100%)' },
        savings: { background: 'linear-gradient(135deg, #E3D6FF 0%, #9F7FE0 100%)' },
        turquoise: { background: 'linear-gradient(135deg, #B4F1F1 0%, #0DBACC 100%)' },
        blue: { background: 'linear-gradient(135deg, #C1DDFF 0%, #69ADFF 100%)' },
        pink: { background: 'linear-gradient(135deg, #FFC0DB 0%, #F18AB5 100%)' },
        lavender: { background: 'linear-gradient(135deg, #E3D6FF 0%, #9F7FE0 100%)' }
    };

    const combinedStyle = gradientStyles[variant] 
        ? { ...gradientStyles[variant], ...style }
        : style;

    return (
        <div
            ref={ref}
            id={id}
            className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
            style={combinedStyle}
        >
            {children}
        </div>
    );
});

Card.displayName = 'Card';

export default Card;
