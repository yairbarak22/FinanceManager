'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Target } from 'lucide-react';
import Image from 'next/image';

/* ── Spring presets ────────────────────────────────────── */
const springSmooth = { type: 'spring' as const, stiffness: 80, damping: 20 };

/* ── Auto-play timing ─────────────────────────────────── */
const AUTO_PLAY_INTERVAL = 5000;

/* ── Screens data ─────────────────────────────────────── */
const screens = [
  {
    id: 'dashboard',
    tab: 'דשבורד',
    icon: BarChart3,
    color: '#0DBACC',
    image: '/screenshots/dashboard.png',
    title: 'תמונה פיננסית מלאה',
    subtitle: 'במבט אחד',
    bullets: [
      'שווי נקי, נכסים והתחייבויות',
      'גרף מגמה לאורך זמן',
      'פילוח נכסים לפי קטגוריה',
      'תזרים חודשי — הכנסות מול הוצאות',
    ],
  },
  {
    id: 'portfolio',
    tab: 'תיק השקעות',
    icon: TrendingUp,
    color: '#2B4699',
    image: '/screenshots/portfolio.png',
    title: 'תיק מסחר עצמאי',
    subtitle: 'מנוהל ומנותח',
    bullets: [
      'כל האחזקות במקום אחד',
      'ניתוח סיכונים — Beta ורמת סיכון',
      'פיזור סקטוריאלי ושווי כולל',
      'שינויים יומיים ומגמות',
    ],
  },
  {
    id: 'goals',
    tab: 'יעדים',
    icon: Target,
    color: '#F18AB5',
    image: '/screenshots/goals.png',
    title: 'יעדים פיננסיים',
    subtitle: 'עם תכנית ברורה',
    bullets: [
      'הגדרת יעדים — דירה, חתונה, חירום',
      'מעקב התקדמות בזמן אמת',
      'חישוב הפרשה חודשית נדרשת',
      'סימולטור יעדים אינטראקטיבי',
    ],
  },
];

/* ── Stacked layer positions (back → front) ────────────── */
/* Each non-active screen gets a "behind" offset */
const stackOffsets = [
  { x: -40, y: 30, scale: 0.88, opacity: 0.25, z: 1 },
  { x: 20, y: 50, scale: 0.82, opacity: 0.15, z: 0 },
];

/* ── Main Component ───────────────────────────────────── */
export default function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();
  const noMotion = !!shouldReduceMotion;

  const [activeIdx, setActiveIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progressKey, setProgressKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  /* Detect mobile for disabling 3D transforms */
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  /* Auto-cycle */
  useEffect(() => {
    if (!isAutoPlaying || !isInView) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % screens.length);
      setProgressKey((k) => k + 1);
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isAutoPlaying, isInView]);

  const handleTabClick = useCallback((i: number) => {
    setActiveIdx(i);
    setProgressKey((k) => k + 1);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), AUTO_PLAY_INTERVAL * 2);
  }, []);

  const active = screens[activeIdx];

  /* Build the ordered layer stack: back screens first, active on top */
  const backScreens = screens
    .map((s, i) => ({ ...s, originalIdx: i }))
    .filter((_, i) => i !== activeIdx);

  return (
    <section
      id="screens"
      className="py-24 md:py-36 relative overflow-hidden"
      style={{ background: '#F5F5F7' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" ref={ref}>
        {/* ── Header ── */}
        <motion.p
          className="text-sm font-bold tracking-widest text-center mb-4"
          style={{ color: '#2B4699', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5 }}
        >
          הציצו פנימה
        </motion.p>
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-5 leading-tight"
          style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5 }}
        >
          ככה זה נראה{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            מבפנים.
          </span>
        </motion.h2>
        <motion.p
          className="text-lg text-center mb-12 md:mb-16 max-w-lg mx-auto"
          style={{ color: '#6E6E73', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          דשבורד ברור, תיק השקעות חכם, ויעדים עם תכנית - הכל במקום אחד
        </motion.p>

        {/* ── Tab selector ── */}
        <motion.div
          className="flex justify-center gap-1.5 sm:gap-2 mb-10 md:mb-14"
          initial={noMotion ? undefined : { opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {screens.map((screen, i) => {
            const isActive = activeIdx === i;
            return (
              <button
                key={screen.id}
                onClick={() => handleTabClick(i)}
                className="relative flex items-center gap-2 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold cursor-pointer transition-all duration-300 overflow-hidden"
                style={{
                  fontFamily: 'var(--font-heebo)',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? screen.color : '#86868B',
                  boxShadow: isActive
                    ? `0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px ${screen.color}20`
                    : 'none',
                }}
              >
                <span>{screen.tab}</span>
                {/* Progress bar */}
                {isActive && isAutoPlaying && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{ background: screen.color, transformOrigin: 'left' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: AUTO_PLAY_INTERVAL / 1000, ease: 'linear' }}
                    key={`progress-${progressKey}`}
                  />
                )}
              </button>
            );
          })}
        </motion.div>

        {/* ── Content: Perspective screenshots + Description ── */}
        <div className="flex flex-col-reverse lg:flex-row items-start gap-8 lg:gap-12 xl:gap-16">

          {/* ── Perspective screenshot stack ── */}
          <div className="lg:w-[62%] w-full">
            <div
              className="relative"
              style={{
                perspective: isMobile ? 'none' : '1400px',
                perspectiveOrigin: '50% 40%',
              }}
            >
              {/* Reserve space for the tilted image */}
              <div style={{ paddingBottom: isMobile ? '56%' : '62%' }} />

              {/* Back layers (non-active screens peeking behind) */}
              {backScreens.map((screen, i) => {
                const mobileOffsets = [
                  { x: -20, y: 15, scale: 0.88, opacity: 0.25, z: 1 },
                  { x: 10, y: 25, scale: 0.82, opacity: 0.15, z: 0 },
                ];
                const offsets = isMobile ? mobileOffsets : stackOffsets;
                return (
                <motion.div
                  key={screen.id}
                  className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                  style={{ zIndex: offsets[i].z }}
                  animate={{
                    x: offsets[i].x,
                    y: offsets[i].y,
                    scale: offsets[i].scale,
                    opacity: offsets[i].opacity,
                    rotateX: isMobile ? 0 : 12,
                    rotateY: isMobile ? 0 : -8,
                    rotateZ: isMobile ? 0 : 1.5,
                  }}
                  transition={noMotion ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className="w-full h-full rounded-2xl overflow-hidden"
                    style={{
                      boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
                      border: '1px solid rgba(255,255,255,0.6)',
                    }}
                  >
                    <Image
                      src={screen.image}
                      alt={screen.tab}
                      fill
                      unoptimized
                      className="object-cover object-top"
                      sizes="50vw"
                    />
                  </div>
                </motion.div>
                );
              })}

              {/* Active (front) layer */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{ zIndex: 10 }}
                  initial={noMotion ? undefined : {
                    opacity: 0,
                    rotateX: isMobile ? 0 : 18,
                    rotateY: isMobile ? 0 : -14,
                    rotateZ: isMobile ? 0 : 3,
                    scale: 0.85,
                    y: 60,
                  }}
                  animate={{
                    opacity: 1,
                    rotateX: isMobile ? 0 : 8,
                    rotateY: isMobile ? 0 : -6,
                    rotateZ: isMobile ? 0 : 1,
                    scale: 1,
                    y: 0,
                  }}
                  exit={noMotion ? undefined : {
                    opacity: 0,
                    rotateX: isMobile ? 0 : 4,
                    rotateY: isMobile ? 0 : -2,
                    scale: 0.92,
                    y: -30,
                  }}
                  transition={noMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className="w-full h-full rounded-2xl overflow-hidden relative"
                    style={{
                      boxShadow: `
                        0 40px 100px rgba(0,0,0,0.12),
                        0 16px 40px rgba(0,0,0,0.06),
                        0 0 0 1px rgba(255,255,255,0.8)
                      `,
                    }}
                  >
                    <Image
                      src={active.image}
                      alt={active.title}
                      fill
                      unoptimized
                      className="object-cover object-top"
                      sizes="(max-width: 1024px) 100vw, 62vw"
                      priority
                    />

                    {/* Gradient fade — bottom + edges for that floating feel */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `
                          linear-gradient(to top, rgba(245,245,247,0.5) 0%, transparent 25%),
                          linear-gradient(to right, rgba(245,245,247,0.3) 0%, transparent 15%),
                          linear-gradient(to left, rgba(245,245,247,0.3) 0%, transparent 15%)
                        `,
                      }}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Ambient glow behind the stack */}
              <div
                className="absolute pointer-events-none"
                style={{
                  width: '80%',
                  height: '60%',
                  left: '10%',
                  bottom: '-10%',
                  background: `radial-gradient(ellipse at center, ${active.color}12, transparent 70%)`,
                  filter: 'blur(40px)',
                  zIndex: -1,
                  transition: 'background 0.6s ease',
                }}
              />
            </div>
          </div>

          {/* ── Description side ── */}
          <div className="lg:w-[38%] w-full lg:pt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={noMotion ? undefined : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={noMotion ? undefined : { opacity: 0, y: -15 }}
                transition={noMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
              >
                {/* Color accent line */}
                <div
                  className="w-10 h-1 rounded-full mb-5"
                  style={{ background: active.color }}
                />

                <h3
                  className="text-2xl sm:text-3xl font-black leading-tight mb-1"
                  style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
                >
                  {active.title}
                </h3>
                <p
                  className="text-lg font-bold mb-6"
                  style={{ color: active.color, fontFamily: 'var(--font-heebo)' }}
                >
                  {active.subtitle}
                </p>

                {/* Bullet points */}
                <ul className="space-y-3">
                  {active.bullets.map((bullet, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-3"
                      initial={noMotion ? undefined : { opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={noMotion ? { duration: 0 } : { duration: 0.3, delay: 0.1 + i * 0.07 }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                        style={{ background: active.color }}
                      />
                      <span
                        className="text-[15px] leading-relaxed"
                        style={{ color: '#6E6E73', fontFamily: 'var(--font-heebo)' }}
                      >
                        {bullet}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Mobile swipe dots ── */}
        <div className="flex lg:hidden justify-center gap-2.5 mt-8">
          {screens.map((screen, i) => (
            <button
              key={i}
              onClick={() => handleTabClick(i)}
              className="w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300"
              style={{
                background: activeIdx === i ? screen.color : 'rgba(0,0,0,0.1)',
                transform: activeIdx === i ? 'scale(1.4)' : 'scale(1)',
                boxShadow: activeIdx === i ? `0 0 8px ${screen.color}50` : 'none',
              }}
              aria-label={`מסך ${i + 1}: ${screen.tab}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #FFFFFF)' }}
      />
    </section>
  );
}
