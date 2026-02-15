'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PieChart, Menu, X } from 'lucide-react';
import { signIn } from 'next-auth/react';

/* ── Spring presets ────────────────────────────────────── */
const springSnappy = { type: 'spring' as const, stiffness: 200, damping: 22 };

/* ── Nav links ───────────────────────────────────────── */
const navLinks = [
  { label: 'איך זה עובד?', href: '#features' },
  { label: 'כלים', href: '#tools' },
  { label: 'המערכת שלנו', href: '#screens' },
  { label: 'שאלות נפוצות', href: '#faq' },
];

interface NavbarProps {
  callbackUrl: string;
}

export default function Navbar({ callbackUrl }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const noMotion = !!shouldReduceMotion;

  /* Scroll detection */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Active section observer */
  useEffect(() => {
    const ids = navLinks.map((l) => l.href.replace('#', ''));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  /* Smooth scroll handler */
  const scrollTo = useCallback((href: string) => {
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileOpen(false);
  }, []);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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
            <div className="flex items-center gap-0">
              <PieChart
                className="w-8 h-8 md:w-9 md:h-9"
                style={{ color: '#2B4699' }}
                strokeWidth={3}
              />
              <span
                className="text-2xl md:text-3xl font-black tracking-tight"
                style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
              >
                NET
              </span>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = activeSection === link.href.replace('#', '');
                return (
                  <button
                    key={link.href}
                    onClick={() => scrollTo(link.href)}
                    className="relative px-4 py-2 rounded-lg text-[13px] font-bold cursor-pointer transition-colors duration-200"
                    style={{
                      fontFamily: 'var(--font-heebo)',
                      color: isActive ? '#2B4699' : '#6E6E73',
                    }}
                  >
                    {link.label}
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full"
                        style={{ background: '#2B4699' }}
                        layoutId="nav-indicator"
                        transition={springSnappy}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right side: CTA + mobile hamburger */}
            <div className="flex items-center gap-3">
              {/* CTA */}
              <motion.button
                onClick={() => signIn('google', { callbackUrl })}
                className="px-3.5 sm:px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold cursor-pointer"
                style={{
                  backgroundColor: '#1D1D1F',
                  fontFamily: 'var(--font-heebo)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
                whileHover={noMotion ? undefined : {
                  scale: 1.05,
                  y: -1,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                }}
                whileTap={noMotion ? undefined : { scale: 0.97 }}
                transition={springSnappy}
              >
                התחברות חינם
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
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Menu panel */}
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
                  const isActive = activeSection === link.href.replace('#', '');
                  return (
                    <button
                      key={link.href}
                      onClick={() => scrollTo(link.href)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-right w-full cursor-pointer transition-colors duration-150"
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
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
