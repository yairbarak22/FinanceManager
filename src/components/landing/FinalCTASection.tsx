'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';

/* ── Spring presets ────────────────────────────────────── */
const springSnappy = { type: 'spring' as const, stiffness: 200, damping: 22 };

interface FinalCTASectionProps {
  callbackUrl: string;
  onOpenLegal: (type: 'terms' | 'privacy') => void;
}

export default function FinalCTASection({ callbackUrl, onOpenLegal }: FinalCTASectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();
  const noMotion = !!shouldReduceMotion;

  return (
    <section
      ref={ref}
      className="py-24 md:py-32 relative overflow-hidden"
      style={{ background: '#E8EDF5' }}
    >
      {/* Subtle decorative circles — hidden on mobile to prevent horizontal scroll */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden sm:block">
        <div
          className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(43,70,153,0.04) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(13,186,204,0.04) 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        {/* Headline */}
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black mb-5 leading-tight"
          style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5 }}
        >
          הצעד הבא{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            לסדר כלכלי.
          </span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          className="text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed"
          style={{ color: '#6E6E73', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          מיפוי מלא, תכנית חודשית, והכוונה מעשית להשקעה במקום אחד, בחינם.
        </motion.p>

        {/* CTA card */}
        <motion.div
          className="inline-block"
          initial={noMotion ? undefined : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          
            <motion.button
              onClick={() => signIn('google', { callbackUrl })}
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 md:px-10 md:py-4.5 rounded-xl text-base md:text-lg font-bold cursor-pointer"
              style={{
                backgroundColor: '#1D1D1F',
                color: '#FFFFFF',
                fontFamily: 'var(--font-heebo)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              }}
              whileHover={noMotion ? undefined : {
                scale: 1.04,
                y: -2,
                boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
              }}
              whileTap={noMotion ? undefined : { scale: 0.97 }}
              transition={springSnappy}
            >
              
              <span>התחברות עם Google — בחינם</span>
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </motion.button>

            {/* Trust line inside card */}
            
          
        </motion.div>

        {/* Legal consent */}
        <motion.p
          className="mt-6 text-xs leading-relaxed"
          style={{ color: '#86868B', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          בלחיצה על הכפתור, את/ה מאשר/ת את{' '}
          <span
            onClick={() => onOpenLegal('terms')}
            className="underline cursor-pointer transition-colors"
            style={{ color: '#2B4699' }}
          >
            תנאי השימוש
          </span>
          {' '}ו
          <span
            onClick={() => onOpenLegal('privacy')}
            className="underline cursor-pointer transition-colors"
            style={{ color: '#2B4699' }}
          >
            מדיניות הפרטיות
          </span>
          {' '}שלנו.
        </motion.p>
      </div>
    </section>
  );
}
