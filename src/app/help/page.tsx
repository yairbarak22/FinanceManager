'use client';

import { useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import AcademyHero from '@/components/academy/AcademyHero';
import AcademyGrid from '@/components/academy/AcademyGrid';
import CompoundInterest from '@/components/academy/CompoundInterest';
import FinancialPrinciples from '@/components/academy/FinancialPrinciples';

export default function HelpPage() {
  const router = useRouter();
  const calculatorRef = useRef<HTMLElement>(null);

  const scrollToCalculator = useCallback(() => {
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div 
      dir="rtl" 
      className="min-h-screen bg-gradient-to-b from-white via-slate-50/30 to-white"
    >
      {/* Sticky Header */}
      <header 
        className="sticky top-0 z-50 border-b border-white/20"
        style={{ 
          background: 'rgba(255, 255, 255, 0.85)', 
          backdropFilter: 'blur(20px)', 
          WebkitBackdropFilter: 'blur(20px)' 
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm font-medium">חזרה לדשבורד</span>
          </button>
          
          <h1 className="text-lg font-bold text-slate-900">מרכז הידע</h1>
          
          <div className="w-20" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <AcademyHero />

        {/* Bento Grid Navigation */}
        <AcademyGrid onScrollToCalculator={scrollToCalculator} />

        {/* Compound Interest Calculator */}
        <CompoundInterest ref={calculatorRef} id="calculator" />

        {/* Financial Principles Accordion */}
        <FinancialPrinciples />

        {/* Footer */}
        <footer className="py-12 border-t border-slate-200">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <p className="text-slate-600">
                רוצה לחזור לניהול הכספים שלך?
              </p>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
              >
                <ArrowRight className="w-4 h-4" />
                חזרה לדשבורד
              </button>
            </motion.div>

            <div className="mt-12 pt-8 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                המידע באתר זה הוא לצורכי לימוד והשכלה בלבד ואינו מהווה ייעוץ פיננסי, השקעות או מס.
                <br />
                מומלץ להתייעץ עם יועץ מוסמך לפני קבלת החלטות פיננסיות.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

