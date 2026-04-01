'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PieChart, ArrowRight } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { motion, useReducedMotion } from 'framer-motion';

const springSnappy = { type: 'spring' as const, stiffness: 200, damping: 22 };

export default function KnowledgeNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const noMotion = !!shouldReduceMotion;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo + back */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[13px] font-bold rounded-lg px-3 py-1.5 transition-colors hover:bg-[#F7F7F8]"
              style={{ color: '#7E7F90', fontFamily: 'var(--font-heebo)' }}
            >
              <ArrowRight className="w-4 h-4" />
              חזרה לדף הבית
            </Link>
            <div className="w-px h-5 bg-[#E8E8ED] hidden sm:block" />
            <Link href="/" className="flex items-center">
              <PieChart
                className="w-6 h-6 md:w-7 md:h-7 -ms-0.5"
                style={{ color: '#2B4699' }}
                strokeWidth={2.5}
              />
              <span
                className="text-2xl md:text-3xl font-black tracking-tight inline-flex items-center"
                style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
              >
                <span style={{ color: '#2B4699' }}>Net</span>My
              </span>
            </Link>
          </div>

          {/* CTA */}
          <motion.button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="px-3.5 sm:px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold cursor-pointer"
            style={{
              backgroundColor: '#1D1D1F',
              fontFamily: 'var(--font-heebo)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            whileHover={
              noMotion
                ? undefined
                : { scale: 1.05, y: -1, boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }
            }
            whileTap={noMotion ? undefined : { scale: 0.97 }}
            transition={springSnappy}
          >
            התחברות חינם
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
