'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Home, Shield, Calculator, ArrowDown, Sparkles } from 'lucide-react';

interface BentoCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  variant?: 'default' | 'featured' | 'cta';
}

function BentoCard({ 
  title, 
  description, 
  icon, 
  className = '', 
  style,
  onClick,
  variant = 'default' 
}: BentoCardProps) {
  const baseStyles = "relative overflow-hidden rounded-3xl p-6 md:p-8 cursor-pointer";
  
  const variantStyles = {
    default: "bg-white border border-slate-200 hover:border-slate-300",
    featured: "bg-slate-50 border border-slate-200",
    cta: "bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-white border-0",
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
      onClick={onClick}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
        variant === 'cta' 
          ? 'bg-white/20' 
          : 'bg-indigo-100'
      }`}>
        <div className={variant === 'cta' ? 'text-white' : 'text-indigo-600'}>
          {icon}
        </div>
      </div>

      {/* Content */}
      <h3 className={`text-lg md:text-xl font-bold mb-2 ${
        variant === 'cta' ? 'text-white' : 'text-slate-900'
      }`}>
        {title}
      </h3>
      <p className={`text-sm md:text-base leading-relaxed ${
        variant === 'cta' ? 'text-white/80' : 'text-slate-600'
      }`}>
        {description}
      </p>

      {/* Decorative elements for CTA */}
      {variant === 'cta' && (
        <>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-6 left-6"
          >
            <ArrowDown className="w-5 h-5 text-white/60" />
          </motion.div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        </>
      )}

      {/* Hover shine effect for default cards */}
      {variant !== 'cta' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-indigo-50/50 group-hover:via-transparent group-hover:to-transparent transition-all duration-500" />
      )}
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
      description: 'למה השקעה במדד S&P 500 היא אחת הדרכים הטובות ביותר לבנות הון לטווח ארוך. עמלות נמוכות, פיזור רחב וביצועים מוכחים.',
      icon: <TrendingUp className="w-6 h-6" />,
      variant: 'featured' as const,
      className: 'md:col-span-2',
    },
    {
      id: 'first-home',
      title: 'הדירה הראשונה',
      description: 'הכללים החשובים ביותר לרכישת דירה חכמה: הון עצמי, יחס החזר להכנסה וקרן חירום.',
      icon: <Home className="w-6 h-6" />,
      variant: 'default' as const,
    },
    {
      id: 'pension-taxes',
      title: 'פנסיה ומיסים',
      description: 'איך לנצל את הטבות המס בצורה מיטבית ולחסוך אלפי שקלים בשנה.',
      icon: <Shield className="w-6 h-6" />,
      variant: 'default' as const,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            למד את הבסיס
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto">
            עקרונות פיננסיים פשוטים שיעזרו לך לקבל החלטות חכמות יותר
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        >
          {cards.map((card) => (
            <motion.div key={card.id} variants={itemVariants} className={card.className}>
              <BentoCard
                title={card.title}
                description={card.description}
                icon={card.icon}
                variant={card.variant}
              />
            </motion.div>
          ))}

          {/* CTA Card - Wonder Calculator */}
          <motion.div variants={itemVariants} className="md:col-span-3">
            <BentoCard
              title="מחשבון הפלא"
              description="גלה כמה הכסף שלך יכול לצמוח עם הזמן. הכוח של ריבית דריבית הוא מדהים."
              icon={<Calculator className="w-6 h-6" />}
              variant="cta"
              onClick={onScrollToCalculator}
            />
          </motion.div>
        </motion.div>

        {/* Extra tip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>טיפ: התחל מוקדם. גם סכומים קטנים הופכים לגדולים עם הזמן.</span>
        </motion.div>
      </div>
    </section>
  );
}

