'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import SearchBar from '@/components/knowledge/SearchBar';

interface InvestHeroProps {
  query: string;
  onQueryChange: (value: string) => void;
  embedded?: boolean;
}

export default function InvestHero({ query, onQueryChange, embedded }: InvestHeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const noMotion = !!shouldReduceMotion;

  return (
    <section
      className={
        embedded
          ? 'pt-6 pb-6 md:pt-8 md:pb-8 relative overflow-hidden'
          : 'pt-28 pb-10 md:pt-32 md:pb-14 relative overflow-hidden'
      }
      style={{
        background: embedded
          ? 'linear-gradient(180deg, #F5F9FE 0%, #FFFFFF 100%)'
          : 'linear-gradient(180deg, #F5F9FE 0%, #EAF3FC 60%, #FFFFFF 100%)',
        borderRadius: embedded ? '1.5rem' : undefined,
      }}
    >
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        {/* Icon */}
        {!embedded && (
          <motion.div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{
              background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
              boxShadow: '0 8px 24px rgba(43,70,153,0.2)',
            }}
            initial={noMotion ? undefined : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <TrendingUp className="w-7 h-7 text-white" />
          </motion.div>
        )}

        {/* Title */}
        {!embedded && (
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 leading-tight"
            style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
            initial={noMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            מרכז ההשקעות של MyNeto
          </motion.h1>
        )}

        {/* Subtitle */}
        <motion.p
          className={`${
            embedded ? 'text-sm mb-5' : 'text-base sm:text-lg mb-8'
          } max-w-lg mx-auto leading-relaxed`}
          style={{ color: '#86868B', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          למד איך להשקיע בחוכמה ולבנות עתיד כלכלי יציב — מדריכים, כלים וקורס וידאו
        </motion.p>

        {/* Search */}
        <motion.div
          initial={noMotion ? undefined : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <SearchBar value={query} onChange={onQueryChange} />
        </motion.div>
      </div>
    </section>
  );
}
