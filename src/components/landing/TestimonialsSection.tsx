'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';

/* ── Testimonial data — Haredi community ──────────────── */
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
    authorName: 'שרה גולדברג',
    authorRole: 'עקרת בית, בני ברק',
    avatarInitials: 'שג',
    avatarColor: '#0DBACC',
    rating: 5,
    content:
      '״עם שבעה ילדים ותקציב מדוד, לא יכולתי להרשות לעצמי הפתעות. myNETO נותנת לי שליטה מלאה — ידועה לכמה יש ולאן הכל הולך.״',
  },
  {
    id: '2',
    authorName: 'ישראל רוזנברג',
    authorRole: 'אברך כולל, ירושלים',
    avatarInitials: 'יר',
    avatarColor: '#69ADFF',
    rating: 5,
    content:
      '״הקצבה מהכולל מוגבלת, ואנחנו חייבים לנהל אותה בחוכמה. המערכת הזו עזרה לי ולאשתי לראות בדיוק לאן הולך כל שקל ולחסוך לשמחות.״',
  },
  {
    id: '3',
    authorName: 'דבורה שטיינר',
    authorRole: 'מנהלת בית, אלעד',
    avatarInitials: 'דש',
    avatarColor: '#F18AB5',
    rating: 5,
    content:
      '״שכר הלימוד לחמישה ילדים, הוצאות שמחות, קניות — הכל בפנים. אחרי שהעליתי את הקובץ, הכל התסדר תוך דקות. פשוט נפלא.״',
  },
  {
    id: '4',
    authorName: 'מנחם פרידמן',
    authorRole: 'אב למשפחה גדולה, בית שמש',
    avatarInitials: 'מפ',
    avatarColor: '#C9A84C',
    rating: 5,
    content:
      '״הגדרתי יעד לחתונת הבן הגדול. המערכת מחשבת כמה להפריש כל חודש ומזכירה לי לעמוד בזה. לראשונה אני בשקט אמיתי.״',
  },
  {
    id: '5',
    authorName: 'חנה ליפשיץ',
    authorRole: 'עקרת בית, מודיעין עילית',
    avatarInitials: 'חל',
    avatarColor: '#A78BFA',
    rating: 5,
    content:
      '״הממשק צנוע, נקי, וקל לשימוש — בלי בלגן מיותר. מעלה את הנתונים פעם בחודש וזה מספיק לי כדי לנהל את הבית בצורה מסודרת.״',
  },
];

/* ── Star rating ────────────────────────────────────────── */
function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`דירוג ${count} מתוך 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill={i < count ? '#C9A84C' : 'none'}
          stroke={i < count ? '#C9A84C' : '#BDBDCB'}
          strokeWidth="1.2"
          aria-hidden="true"
        >
          <path d="M8 1.5l1.75 3.55 3.91.57-2.83 2.76.67 3.9L8 10.27l-3.5 1.84.67-3.9L2.34 5.62l3.91-.57z" />
        </svg>
      ))}
    </div>
  );
}

/* ── Avatar ─────────────────────────────────────────────── */
function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white select-none"
      style={{
        background: `radial-gradient(circle at 35% 35%, ${color}EE, ${color}88)`,
        boxShadow: `0 0 0 2px ${color}30, 0 4px 10px ${color}25`,
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
// Exit rotates OUT to the right (+90), enter comes IN from the left (-90)
// For prev direction: exit left (-90), enter from right (+90)
const cardVariants = {
  enter: (dir: number) => ({
    rotateY: dir > 0 ? -90 : 90,
    opacity: 0,
    filter: 'brightness(0.5)',
    scale: 0.92,
  }),
  center: {
    rotateY: 0,
    opacity: 1,
    filter: 'brightness(1)',
    scale: 1,
    transition: {
      rotateY: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
      opacity: { duration: 0.25, ease: 'easeOut' },
      filter: { duration: 0.5, ease: 'easeOut' },
      scale: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
    },
  },
  exit: (dir: number) => ({
    rotateY: dir > 0 ? 90 : -90,
    opacity: 0,
    filter: 'brightness(0.5)',
    scale: 0.92,
    transition: {
      rotateY: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
      opacity: { duration: 0.2, ease: 'easeIn' },
      filter: { duration: 0.4, ease: 'easeIn' },
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

  /* Auto-advance every 6s, pause on hover/focus */
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(goNext, 6000);
    return () => clearInterval(id);
  }, [isPaused, goNext]);

  /* Swipe/drag handlers */
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
      id="testimonials"
      className="relative overflow-hidden py-20 md:py-28"
      style={{ background: '#F5F5F7' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-label="המלצות לקוחות"
    >
      {/* Top fade from previous section */}
      <div
        className="absolute inset-x-0 top-0 h-16 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, #FFFFFF, transparent)' }}
      />
      {/* Bottom fade to next section */}
      <div
        className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to top, #FFFFFF, transparent)' }}
      />

      <div className="relative z-20 max-w-2xl mx-auto px-6 flex flex-col items-center">
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
              background: 'rgba(105,173,255,0.1)',
              color: '#69ADFF',
              border: '1px solid rgba(105,173,255,0.22)',
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
              color: '#303150',
            }}
          >
            אלפי משפחות כבר{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              עושות סדר
            </span>
            <br />
            בכסף שלהן
          </h2>
        </motion.div>

        {/* 3D card stage */}
        <div
          className="relative w-full flex items-center justify-center"
          style={{ perspective: '1400px' }}
        >
          {/* Prev arrow */}
          <button
            onClick={goPrev}
            className="absolute z-30 p-2.5 rounded-full transition-all duration-200"
            style={{
              right: '-0.25rem',
              background: '#FFFFFF',
              border: '1px solid #E8E8ED',
              color: '#7E7F90',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            aria-label="המלצה קודמת"
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#69ADFF';
              (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#69ADFF';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
              (e.currentTarget as HTMLButtonElement).style.color = '#7E7F90';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E8E8ED';
            }}
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>

          {/* Next arrow */}
          <button
            onClick={goNext}
            className="absolute z-30 p-2.5 rounded-full transition-all duration-200"
            style={{
              left: '-0.25rem',
              background: '#FFFFFF',
              border: '1px solid #E8E8ED',
              color: '#7E7F90',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            aria-label="המלצה הבאה"
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#69ADFF';
              (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#69ADFF';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
              (e.currentTarget as HTMLButtonElement).style.color = '#7E7F90';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E8E8ED';
            }}
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>

          {/* Card wrapper — preserves 3D context */}
          <div
            className="w-full max-w-sm"
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
                className="relative w-full rounded-3xl p-8 select-none cursor-grab active:cursor-grabbing"
                aria-live="polite"
                aria-atomic="true"
              >
                {/* Card background */}
                <div
                  className="absolute inset-0 rounded-3xl"
                  aria-hidden="true"
                  style={{
                    background: '#FFFFFF',
                    boxShadow: '0 4px 40px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                />

                {/* Card content */}
                <div className="relative z-10 flex flex-col gap-7">
                  {/* Stars */}
                  <Stars count={current.rating} />

                  {/* Quote */}
                  <blockquote
                    style={{
                      fontFamily: 'var(--font-heebo)',
                      fontSize: 'clamp(1rem, 2.2vw, 1.15rem)',
                      fontWeight: 700,
                      color: '#303150',
                      lineHeight: 1.8,
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
                      background: '#F7F7F8',
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
                          color: '#303150',
                        }}
                      >
                        {current.authorName}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-nunito)',
                          fontWeight: 400,
                          fontSize: '13px',
                          color: '#7E7F90',
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

        {/* Timer progress bar */}
        <div className="w-full max-w-sm mt-8">
          <style>{`
            @keyframes testimonialTimer {
              from { width: 0%; }
              to   { width: 100%; }
            }
          `}</style>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: '3px', background: '#E8E8ED' }}
            aria-hidden="true"
          >
            <div
              key={`timer-${index}`}
              style={{
                height: '100%',
                width: '0%',
                borderRadius: '9999px',
                background: 'linear-gradient(90deg, #0DBACC, #69ADFF)',
                animationName: 'testimonialTimer',
                animationDuration: '6s',
                animationTimingFunction: 'linear',
                animationFillMode: 'forwards',
                animationPlayState: isPaused ? 'paused' : 'running',
              }}
            />
          </div>
        </div>

        {/* Dot navigation */}
        <div
          className="flex items-center gap-2.5 mt-5"
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
                background: i === index ? '#69ADFF' : '#BDBDCB',
                boxShadow: i === index ? '0 0 8px rgba(105,173,255,0.5)' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
