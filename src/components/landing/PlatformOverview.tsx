'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Landmark, Users, TrendingUp, Sparkles, FileSpreadsheet, Smartphone } from 'lucide-react';

/* ── Spring presets ────────────────────────────────────── */
const springBouncy = { type: 'spring' as const, stiffness: 120, damping: 20 };
const springFly = { type: 'spring' as const, stiffness: 90, damping: 18 };
const springSnappy = { type: 'spring' as const, stiffness: 200, damping: 22 };

/* ── Auto-play timing ─────────────────────────────────── */
const AUTO_PLAY_INTERVAL = 3200;
const ENTRANCE_DELAY = 1400;

/* ── Tool items ───────────────────────────────────────── */
const items = [
  {
    icon: Sparkles,
    title: 'סיווג אוטומטי עם AI',
    description: 'מעלים קובץ מהבנק והמערכת מסווגת את כל העסקאות אוטומטית.',
    color: '#0DBACC',
  },
  {
    icon: Landmark,
    title: 'מעקב הלוואות ומשכנתא',
    description: 'מעקב מלא אחר כל ההתחייבויות — לוח סילוקין, ריביות ותזכורות.',
    color: '#2B4699',
  },
  {
    icon: Users,
    title: 'חשבון משפחתי משותף',
    description: 'מזמינים בני משפחה לנהל ביחד — כולם רואים את אותו דשבורד.',
    color: '#F18AB5',
  },
  {
    icon: TrendingUp,
    title: 'מעקב השקעות במקום אחד',
    description: 'כל ההשקעות במבט אחד — מניות, קרנות, קופות גמל ופנסיה.',
    color: '#2B4699',
  },
  {
    icon: FileSpreadsheet,
    title: 'תמיכה בכל הבנקים',
    description: 'מעלים Excel או CSV מכל בנק. המערכת מזהה את המבנה אוטומטית.',
    color: '#0DBACC',
  },
  {
    icon: Smartphone,
    title: 'זמין בכל מכשיר',
    description: 'ממשק מותאם לנייד, טאבלט ומחשב. נגישים מכל מקום, בכל זמן.',
    color: '#F18AB5',
  },
];

/* ── Arch positions for all 6 items (px in 840px container) ── */
const archPositions = [
  { left: 50,  top: 180, rotate: -10 },
  { left: 185, top: 65,  rotate: -5 },
  { left: 320, top: 5,   rotate: -2 },
  { left: 455, top: 5,   rotate: 2 },
  { left: 590, top: 65,  rotate: 5 },
  { left: 720, top: 180, rotate: 10 },
];

/* ── Center target for the active card ── */
const CENTER_LEFT = 370; // (840 - 100) / 2
const CENTER_TOP = 85;

export default function PlatformOverview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();
  const noMotion = !!shouldReduceMotion;

  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  /* ── Start auto-play after entrance animations finish ── */
  useEffect(() => {
    if (isInView && !hasAnimatedIn) {
      const timer = setTimeout(() => {
        setHasAnimatedIn(true);
        setActiveIdx(0);
      }, ENTRANCE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [isInView, hasAnimatedIn]);

  /* ── Auto-cycle through cards ── */
  useEffect(() => {
    if (!isAutoPlaying || !hasAnimatedIn) return;
    const timer = setInterval(() => {
      setActiveIdx(prev => (prev === null ? 0 : (prev + 1) % items.length));
      setProgressKey(k => k + 1);
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isAutoPlaying, hasAnimatedIn]);

  /* ── Hover handlers ── */
  const handleHoverStart = useCallback((i: number) => {
    setIsAutoPlaying(false);
    setActiveIdx(i);
    setProgressKey(k => k + 1);
  }, []);

  const handleHoverEnd = useCallback(() => {
    setIsAutoPlaying(true);
    setProgressKey(k => k + 1);
  }, []);

  const handleDotClick = useCallback((i: number) => {
    setActiveIdx(i);
    setProgressKey(k => k + 1);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), AUTO_PLAY_INTERVAL * 2);
  }, []);

  const activeItem = activeIdx !== null ? items[activeIdx] : null;

  return (
    <section id="tools" className="py-24 md:py-32 relative overflow-hidden" style={{ background: '#FFFFFF' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative" ref={ref}>
        {/* Section icon */}
       

        {/* Header */}
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-5 leading-tight"
          style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          כלים פרקטיים{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #2B4699 0%, #0DBACC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            לניהול כספים נכון.
          </span>
        </motion.h2>
        <motion.p
          className="text-lg text-center mb-16 md:mb-20 max-w-2xl mx-auto"
          style={{ color: '#6E6E73', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          מעבר למיפוי, תכנית והשקעה — myNETO כולל כלים נוספים לניהול כספים נכון
        </motion.p>

        {/* ── Desktop: Arch with auto-cycling spotlight ── */}
        <div className="hidden md:block">
          <div className="relative mx-auto" style={{ maxWidth: 840, height: 310 }}>
            {items.map((item, i) => {
              const Icon = item.icon;
              const pos = archPositions[i];
              const isActive = hasAnimatedIn && activeIdx === i;
              const isDimmed = hasAnimatedIn && activeIdx !== null && activeIdx !== i;

              return (
                <motion.div
                  key={i}
                  className="absolute cursor-pointer"
                  style={{
                    left: pos.left,
                    top: pos.top,
                    zIndex: isActive ? 20 : 10,
                  }}
                  initial={noMotion ? undefined : { opacity: 0, scale: 0 }}
                  animate={
                    isInView
                      ? {
                          opacity: isDimmed ? 0.35 : 1,
                          scale: 1,
                          x: isActive ? CENTER_LEFT - pos.left : 0,
                          y: isActive ? CENTER_TOP - pos.top : 0,
                        }
                      : undefined
                  }
                  transition={
                    noMotion
                      ? { duration: 0 }
                      : hasAnimatedIn
                        ? springFly
                        : { ...springBouncy, delay: 0.2 + i * 0.08 }
                  }
                  onHoverStart={() => handleHoverStart(i)}
                  onHoverEnd={handleHoverEnd}
                  onClick={() => handleDotClick(i)}
                >
                  <motion.div
                    animate={
                      isActive
                        ? { scale: 1.25, rotate: 0 }
                        : { scale: 1, rotate: pos.rotate }
                    }
                    transition={springSnappy}
                  >
                    <div
                      className="w-[100px] h-[100px] rounded-3xl flex items-center justify-center"
                      style={{
                        background: isActive ? '#FFFFFF' : '#F5F5F7',
                        border: isActive
                          ? `2px solid ${item.color}40`
                          : '1px solid rgba(0,0,0,0.04)',
                        boxShadow: isActive
                          ? `0 24px 64px rgba(0,0,0,0.14), 0 0 0 1px ${item.color}20, 0 0 40px ${item.color}12`
                          : '0 4px 16px rgba(0,0,0,0.04)',
                        transition: 'box-shadow 0.4s, background 0.3s, border 0.3s',
                      }}
                    >
                      <Icon
                        className="w-10 h-10"
                        style={{ color: item.color }}
                        strokeWidth={1.8}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Description + dot indicators */}
          <div className="text-center mt-8" style={{ minHeight: 90 }}>
            <AnimatePresence mode="wait">
              {activeItem ? (
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <h3
                    className="text-xl font-black mb-1.5 inline-flex items-center gap-2 justify-center"
                    style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
                  >
                    <span>{activeItem.title}</span>
                    <activeItem.icon className="w-5 h-5" style={{ color: activeItem.color }} strokeWidth={2} />
                  </h3>
                  <p
                    className="text-sm max-w-sm mx-auto leading-relaxed"
                    style={{ color: '#6E6E73', fontFamily: 'var(--font-heebo)' }}
                  >
                    {activeItem.description}
                  </p>
                </motion.div>
              ) : (
                <motion.p
                  key="default"
                  className="text-sm"
                  style={{ color: '#86868B', fontFamily: 'var(--font-heebo)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  העבירו את העכבר מעל הכלים לפרטים נוספים
                </motion.p>
              )}
            </AnimatePresence>

            {/* Progress bar navigation */}
            {hasAnimatedIn && (
              <motion.div
                className="flex justify-center gap-2 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {items.map((item, i) => {
                  const isActive = activeIdx === i;
                  return (
                    <button
                      key={i}
                      onClick={() => handleDotClick(i)}
                      className="relative h-1 rounded-full cursor-pointer overflow-hidden transition-all duration-300"
                      style={{
                        width: isActive ? 40 : 20,
                        background: 'rgba(0,0,0,0.08)',
                      }}
                      aria-label={`כלי ${i + 1}: ${item.title}`}
                    >
                      {isActive && isAutoPlaying && (
                        <motion.div
                          className="absolute inset-y-0 right-0 rounded-full"
                          style={{ background: item.color }}
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: AUTO_PLAY_INTERVAL / 1000, ease: 'linear' }}
                          key={`progress-${progressKey}`}
                        />
                      )}
                      {isActive && !isAutoPlaying && (
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{ background: item.color }}
                        />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Mobile: Spotlight carousel (same concept as desktop) ── */}
        <div className="md:hidden">
          {/* Icon row — 3×2 grid on mobile to prevent overflow */}
          <motion.div
            className="grid grid-cols-3 gap-2.5 justify-items-center mb-8 max-w-[220px] mx-auto"
            initial={noMotion ? undefined : { opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {items.map((item, i) => {
              const Icon = item.icon;
              const isActive = hasAnimatedIn && activeIdx === i;
              const isDimmed = hasAnimatedIn && activeIdx !== null && activeIdx !== i;

              return (
                <motion.button
                  key={i}
                  className="cursor-pointer"
                  onClick={() => handleDotClick(i)}
                  animate={{
                    opacity: isDimmed ? 0.35 : 1,
                    scale: isActive ? 1.15 : 1,
                  }}
                  transition={springSnappy}
                >
                  <div
                    className="rounded-2xl flex items-center justify-center transition-all duration-300"
                    style={{
                      width: isActive ? 56 : 48,
                      height: isActive ? 56 : 48,
                      background: isActive ? '#FFFFFF' : '#F5F5F7',
                      border: isActive
                        ? `2px solid ${item.color}40`
                        : '1px solid rgba(0,0,0,0.04)',
                      boxShadow: isActive
                        ? `0 12px 32px rgba(0,0,0,0.1), 0 0 20px ${item.color}15`
                        : '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                  >
                    <Icon
                      className={isActive ? 'w-6 h-6' : 'w-5 h-5'}
                      style={{ color: item.color }}
                      strokeWidth={1.8}
                    />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Active item description */}
          <div className="text-center" style={{ minHeight: 90 }}>
            <AnimatePresence mode="wait">
              {activeItem && (
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <h3
                    className="text-lg font-black mb-1.5 inline-flex items-center gap-2 justify-center"
                    style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
                  >
                    <span>{activeItem.title}</span>
                    <activeItem.icon className="w-4.5 h-4.5" style={{ color: activeItem.color }} strokeWidth={2} />
                  </h3>
                  <p
                    className="text-sm max-w-xs mx-auto leading-relaxed"
                    style={{ color: '#6E6E73', fontFamily: 'var(--font-heebo)' }}
                  >
                    {activeItem.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress bar navigation */}
          {hasAnimatedIn && (
            <motion.div
              className="flex justify-center gap-2 mt-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {items.map((item, i) => {
                const isActive = activeIdx === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleDotClick(i)}
                    className="relative h-1 rounded-full cursor-pointer overflow-hidden transition-all duration-300"
                    style={{
                      width: isActive ? 36 : 16,
                      background: 'rgba(0,0,0,0.08)',
                    }}
                    aria-label={`כלי ${i + 1}: ${item.title}`}
                  >
                    {isActive && isAutoPlaying && (
                      <motion.div
                        className="absolute inset-y-0 right-0 rounded-full"
                        style={{ background: item.color }}
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: AUTO_PLAY_INTERVAL / 1000, ease: 'linear' }}
                        key={`progress-m-${progressKey}`}
                      />
                    )}
                    {isActive && !isAutoPlaying && (
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{ background: item.color }}
                      />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #F5F5F7)' }}
      />
    </section>
  );
}
