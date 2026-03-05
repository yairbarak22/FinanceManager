'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';

/* ── Testimonial data ──────────────────────────────────── */
interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string;
  avatarInitials: string;
  avatarColor: string;
  rating: number;
  content: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    authorName: 'דנה כהן',
    authorRole: 'אמא לשלושה, ירושלים',
    avatarInitials: 'דכ',
    avatarColor: '#0DBACC',
    rating: 5,
    content:
      '״לפני myNETO הייתי בערפל מוחלט. היום אני יודעת בדיוק לאן הולך כל שקל, ואני ישנה טוב יותר בלילה.״',
  },
  {
    id: '2',
    authorName: 'יוסי לוי',
    authorRole: 'עצמאי בתחום הטכנולוגיה, תל אביב',
    avatarInitials: 'ילׁ',
    avatarColor: '#69ADFF',
    rating: 5,
    content:
      '״הגדרתי יעד לדירה וראיתי בדיוק כמה חסרים לי. שלושה חודשים אחרי — חסכתי כפול ממה שחשבתי שאוכל.״',
  },
  {
    id: '3',
    authorName: 'מיכל רוזן',
    authorRole: 'מורה ואמא, חיפה',
    avatarInitials: 'מר',
    avatarColor: '#F18AB5',
    rating: 5,
    content:
      '״פשוט מדהים. העלאתי קובץ ה-Excel מחברת האשראי ותוך שניות הכל היה מסודר בקטגוריות. חסכתי שעות של עבודה.״',
  },
  {
    id: '4',
    authorName: 'אבי שמש',
    authorRole: 'אב למשפחה בת 5, ראשון לציון',
    avatarInitials: 'אש',
    avatarColor: '#C9A84C',
    rating: 5,
    content:
      '״חשבון משותף עם אשתי שינה הכל. אנחנו סוף סוף מדברים על כסף בלי ריב. הכל שקוף ומסודר בשניהם.״',
  },
  {
    id: '5',
    authorName: 'נועה ברקוביץ',
    authorRole: 'סטודנטית לרפואה, באר שבע',
    avatarInitials: 'נב',
    avatarColor: '#A78BFA',
    rating: 5,
    content:
      '״כשגרה על תקציב קטן, כל שקל חשוב. myNETO עזרה לי להבין איפה אני "מבזבזת" בלי לשים לב ולהפסיק.״',
  },
];

/* ── Star rating component ─────────────────────────────── */
function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`דירוג ${count} מתוך 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill={i < count ? '#C9A84C' : 'none'}
          stroke={i < count ? '#C9A84C' : 'rgba(255,255,255,0.2)'}
          strokeWidth="1.2"
          aria-hidden="true"
        >
          <path d="M8 1.5l1.75 3.55 3.91.57-2.83 2.76.67 3.9L8 10.27l-3.5 1.84.67-3.9L2.34 5.62l3.91-.57z" />
        </svg>
      ))}
    </div>
  );
}

/* ── Avatar ────────────────────────────────────────────── */
function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white select-none"
      style={{
        background: `radial-gradient(circle at 35% 35%, ${color}EE, ${color}88)`,
        boxShadow: `0 0 0 2px ${color}40, 0 4px 12px ${color}30`,
        fontFamily: 'var(--font-heebo)',
        letterSpacing: '0.04em',
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

/* ── Animation variants ─────────────────────────────────── */
const cardVariants = {
  enter: (dir: number) => ({
    rotateY: dir > 0 ? 85 : -85,
    opacity: 0,
    filter: 'brightness(0.3)',
    scale: 0.92,
  }),
  center: {
    rotateY: 0,
    opacity: 1,
    filter: 'brightness(1)',
    scale: 1,
    transition: {
      rotateY: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] },
      opacity: { duration: 0.35, ease: 'easeOut' },
      filter: { duration: 0.6, ease: 'easeOut' },
      scale: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
    },
  },
  exit: (dir: number) => ({
    rotateY: dir > 0 ? -85 : 85,
    opacity: 0,
    filter: 'brightness(0.3)',
    scale: 0.92,
    transition: {
      rotateY: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
      opacity: { duration: 0.25, ease: 'easeIn' },
      filter: { duration: 0.45, ease: 'easeIn' },
      scale: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
    },
  }),
};

const reducedVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/* ── Main Component ─────────────────────────────────────── */
export default function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReduced = useReducedMotion();
  const dragStartX = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const total = TESTIMONIALS.length;
  const current = TESTIMONIALS[index];
  const variants = prefersReduced ? reducedVariants : cardVariants;

  const goNext = useCallback(() => {
    setDir(1);
    setIndex(i => (i + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setDir(-1);
    setIndex(i => (i - 1 + total) % total);
  }, [total]);

  const goTo = useCallback((i: number) => {
    setDir(i > index ? 1 : -1);
    setIndex(i);
  }, [index]);

  /* Auto-advance every 5s, pause on hover/focus */
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(goNext, 5000);
    return () => clearInterval(id);
  }, [isPaused, goNext]);

  /* Drag/swipe handlers */
  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragStartX.current = x;
  }, []);

  const handleDragEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (dragStartX.current === null) return;
    const x = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const delta = dragStartX.current - x;
    if (Math.abs(delta) > 60) {
      delta > 0 ? goNext() : goPrev();
    }
    dragStartX.current = null;
  }, [goNext, goPrev]);

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="relative overflow-hidden"
      style={{ background: '#080812' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-label="המלצות לקוחות"
    >
      {/* Top gradient fade from previous (light) section */}
      <div
        className="absolute inset-x-0 top-0 h-20 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, #ffffff 0%, transparent 100%)' }}
      />
      {/* Bottom gradient fade to next (light) section */}
      <div
        className="absolute inset-x-0 bottom-0 h-20 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to top, #ffffff 0%, transparent 100%)' }}
      />

      {/* Atmospheric background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(105,173,255,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-20 max-w-2xl mx-auto px-6 py-24 flex flex-col items-center">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-14"
        >
          <span
            className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
            style={{
              background: 'rgba(105,173,255,0.12)',
              color: '#69ADFF',
              border: '1px solid rgba(105,173,255,0.25)',
              fontFamily: 'var(--font-nunito)',
              letterSpacing: '0.14em',
            }}
          >
            מה אומרים עלינו
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold leading-tight"
            style={{
              fontFamily: 'var(--font-heebo)',
              color: '#FFFFFF',
              textShadow: '0 2px 24px rgba(105,173,255,0.18)',
            }}
          >
            אלפי משפחות כבר{' '}
            <span style={{ color: '#69ADFF' }}>עושות סדר</span>
            <br />
            בכסף שלהן
          </h2>
        </motion.div>

        {/* 3D card stage */}
        <div
          className="relative w-full flex items-center justify-center"
          style={{ perspective: '1200px' }}
        >
          {/* Previous arrow */}
          <button
            onClick={goPrev}
            className="absolute z-30 p-2.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
            style={{
              right: '-0.5rem',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(4px)',
            }}
            aria-label="המלצה קודמת"
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(105,173,255,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            <ChevronRight className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Next arrow */}
          <button
            onClick={goNext}
            className="absolute z-30 p-2.5 rounded-full transition-all duration-200 opacity-0 hover:opacity-100 focus:opacity-100"
            style={{
              left: '-0.5rem',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(4px)',
            }}
            aria-label="המלצה הבאה"
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(105,173,255,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Card wrapper — preserves 3D context */}
          <div
            className="w-full max-w-md"
            style={{ transformStyle: 'preserve-3d' }}
            onMouseDown={handleDragStart as React.MouseEventHandler}
            onMouseUp={handleDragEnd as React.MouseEventHandler}
            onTouchStart={handleDragStart as React.TouchEventHandler}
            onTouchEnd={handleDragEnd as React.TouchEventHandler}
          >
            <AnimatePresence mode="wait" custom={dir}>
              <motion.article
                key={current.id}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ transformStyle: 'preserve-3d' }}
                className="relative w-full rounded-3xl p-8 sm:p-10 select-none cursor-grab active:cursor-grabbing"
                aria-live="polite"
                aria-atomic="true"
              >
                {/* Card background with glassmorphism */}
                <div
                  className="absolute inset-0 rounded-3xl"
                  aria-hidden="true"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(16px)',
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(105,173,255,0.08)',
                  }}
                />

                {/* Card content */}
                <div className="relative z-10 flex flex-col gap-8">
                  {/* Stars */}
                  <Stars count={current.rating} />

                  {/* Quote */}
                  <blockquote
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
                      fontStyle: 'italic',
                      color: 'rgba(255,255,255,0.92)',
                      lineHeight: 1.75,
                      margin: 0,
                      textAlign: 'right',
                    }}
                  >
                    {current.content}
                  </blockquote>

                  {/* Divider */}
                  <div
                    style={{
                      height: '1px',
                      background:
                        'linear-gradient(to left, transparent, rgba(255,255,255,0.12), transparent)',
                    }}
                  />

                  {/* Author row */}
                  <footer className="flex items-center gap-3">
                    <Avatar initials={current.avatarInitials} color={current.avatarColor} />
                    <div className="flex flex-col gap-0.5 text-right">
                      <span
                        style={{
                          fontFamily: 'var(--font-heebo)',
                          fontWeight: 600,
                          fontSize: '15px',
                          color: 'rgba(255,255,255,0.95)',
                        }}
                      >
                        {current.authorName}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-nunito)',
                          fontWeight: 400,
                          fontSize: '13px',
                          color: 'rgba(255,255,255,0.45)',
                        }}
                      >
                        {current.authorRole}
                      </span>
                    </div>
                  </footer>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>

        {/* Dot navigation */}
        <div
          className="flex items-center gap-2.5 mt-10"
          role="tablist"
          aria-label="בחר המלצה"
        >
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={i === index}
              aria-label={`המלצה ${i + 1} מתוך ${total}`}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#69ADFF]"
              style={{
                width: i === index ? '28px' : '8px',
                height: '8px',
                background: i === index ? '#69ADFF' : 'rgba(255,255,255,0.2)',
                boxShadow: i === index ? '0 0 10px rgba(105,173,255,0.6)' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
