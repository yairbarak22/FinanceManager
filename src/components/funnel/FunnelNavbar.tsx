'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PieChart, Menu, X, ArrowLeft } from 'lucide-react';
import { trackCtaClickServer } from '@/lib/utils';

const PARTNER_URL =
  'https://digitalsolutions.as-invest.co.il/trade_OnBoarding/?utm_source=MyNeto&utm_medium=Link';

const springSnappy = { type: 'spring' as const, stiffness: 200, damping: 22 };

const navLinks = [
  { label: 'ראשי', href: '/invest' },
  { label: 'מה זה השקעה?', href: '/invest/what-is-investing' },
  { label: 'העברת תיק קיים', href: '/invest/transfer' },
];

function handleCtaClick() {
  trackCtaClickServer('funnel_navbar_cta');
  window.open(PARTNER_URL, '_blank', 'noopener,noreferrer');
}

export default function FunnelNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const noMotion = !!shouldReduceMotion;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/invest" className="flex items-center">
            <PieChart
                  className="w-6 h-6 md:w-7 md:h-7 -ms-0.5"
                  style={{ color: '#2B4699' }}
                  strokeWidth={2.5}
                />
              <span
                className="text-2xl md:text-3xl font-black tracking-tight inline-flex items-center"
                style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
              >
                <span style={{ color: '#2B4699' }}>Net</span>
                My
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-4 py-2 rounded-lg text-[13px] font-bold transition-colors duration-200"
                    style={{
                      fontFamily: 'var(--font-heebo)',
                      color: isActive ? '#2B4699' : '#6E6E73',
                    }}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full"
                        style={{ background: '#2B4699' }}
                        layoutId="funnel-nav-indicator"
                        transition={springSnappy}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side: CTA + mobile hamburger */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleCtaClick}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
                  fontFamily: 'var(--font-heebo)',
                  boxShadow: '0 2px 8px rgba(43,70,153,0.2)',
                }}
                whileHover={noMotion ? undefined : {
                  scale: 1.05,
                  y: -1,
                  boxShadow: '0 6px 20px rgba(43,70,153,0.3)',
                }}
                whileTap={noMotion ? undefined : { scale: 0.97 }}
                transition={springSnappy}
              >
                <span>פתיחת חשבון מסחר</span>
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
              </motion.button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg cursor-pointer"
                style={{ color: '#1D1D1F' }}
                aria-label="תפריט ניווט"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              className="absolute top-16 left-4 right-4 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
              }}
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-3 flex flex-col gap-1" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-right w-full transition-colors duration-150"
                      style={{
                        fontFamily: 'var(--font-heebo)',
                        color: isActive ? '#2B4699' : '#1D1D1F',
                        background: isActive ? 'rgba(43,70,153,0.06)' : 'transparent',
                      }}
                    >
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#2B4699' }} />
                      )}
                      <span className="text-[15px] font-bold">{link.label}</span>
                    </Link>
                  );
                })}

                {/* Mobile CTA */}
                <button
                  onClick={handleCtaClick}
                  className="flex items-center justify-center gap-2 mt-2 px-4 py-3 rounded-xl text-white text-[15px] font-bold cursor-pointer w-full"
                  style={{
                    background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
                    fontFamily: 'var(--font-heebo)',
                  }}
                >
                  <span>פתיחת חשבון מסחר</span>
                  <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
