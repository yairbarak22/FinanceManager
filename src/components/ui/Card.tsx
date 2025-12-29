import React, { forwardRef } from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    variant?: 'default' | 'flat';
    style?: React.CSSProperties;
    id?: string;
}

/**
 * Centralized Card component for consistent styling across dashboard
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
        default: 'bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)]',
        flat: 'bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200'
    };

    return (
        <div
            ref={ref}
            id={id}
            className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
            style={style}
        >
            {children}
        </div>
    );
});

Card.displayName = 'Card';

export default Card;
