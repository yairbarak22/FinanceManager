'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Home, Shield, Calculator } from 'lucide-react';

interface BentoCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'featured';
}

function BentoCard({ 
  title, 
  description, 
  icon, 
  className = '', 
  onClick,
  variant = 'default' 
}: BentoCardProps) {
  const variantStyles = {
    default: "bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30",
    featured: "bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 hover:border-indigo-200",
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-colors ${variantStyles[variant]} ${className}`}
      onClick={onClick}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
        <div className="text-indigo-600">
          {icon}
        </div>
      </div>

      {/* Content */}
      <h3 className="text-base font-bold text-slate-900 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

interface AcademyGridProps {
  onScrollToCalculator?: () => void;
}

export default function AcademyGrid({ onScrollToCalculator }: AcademyGridProps) {
  const cards = [
    {
      id: 'passive-investing',
      title: 'מסלול ההשקעה הפסיבי',
      description: 'למה השקעה במדד S&P 500 היא אחת הדרכים הטובות ביותר לבנות הון לטווח ארוך.',
      icon: <TrendingUp className="w-5 h-5" />,
      variant: 'featured' as const,
      className: 'md:col-span-2',
    },
    {
      id: 'first-home',
      title: 'הדירה הראשונה',
      description: 'הכללים החשובים ביותר לרכישת דירה חכמה.',
      icon: <Home className="w-5 h-5" />,
      variant: 'default' as const,
    },
    {
      id: 'pension-taxes',
      title: 'פנסיה ומיסים',
      description: 'איך לנצל את הטבות המס ולחסוך אלפי שקלים בשנה.',
      icon: <Shield className="w-5 h-5" />,
      variant: 'default' as const,
    },
    {
      id: 'calculator',
      title: 'מחשבון ריבית דריבית',
      description: 'גלה כמה הכסף שלך יכול לצמוח עם הזמן.',
      icon: <Calculator className="w-5 h-5" />,
      variant: 'default' as const,
      onClick: onScrollToCalculator,
    },
  ];

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">למד את הבסיס</h2>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => (
          <BentoCard
            key={card.id}
            title={card.title}
            description={card.description}
            icon={card.icon}
            variant={card.variant}
            className={card.className}
            onClick={card.onClick}
          />
        ))}
      </div>
    </div>
  );
}
