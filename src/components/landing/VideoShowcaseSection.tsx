'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Play, ArrowLeft } from 'lucide-react';
import { trackCtaClickServer } from '@/lib/utils';

/* ── Video data ──────────────────────────────────────── */
const videos = [
  {
    id: 'eSPdAfQmDRA',
    title: 'למה חיסכון בבנק כבר לא מספיק?',
    duration: '03:24',
    chapter: 'כדור השלג של הכסף',
  },
  {
    id: 'AvmYuJrEF18',
    title: 'למה הסטטיסטיקה מנצחת את המומחים?',
    duration: '03:41',
    chapter: 'סוד ה-S&P 500',
  },
  {
    id: 'SVZnToUSRMg',
    title: 'פותחים חשבון באלטשולר שחם',
    duration: '04:24',
    chapter: 'תכל׳ס - פתיחת חשבון',
  },
  {
    id: 'TdA1O5MeifQ',
    title: 'בחירת המסלול והוראת הקבע',
    duration: '02:34',
    chapter: 'טייס אוטומטי',
  },
];

const getThumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
const getEmbed = (id: string) =>
  `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&iv_load_policy=3&autoplay=1`;

/* ── Fixed positions for all 4 thumbnails (desktop) ──── */
const thumbPositions = [
  { top: '-1%', right: '0%' },
  { bottom: '0%', right: '1%' },
  { bottom: '-3%', left: '0%' },
  { top: '2%', left: '1%' },
];

/* ── Per-thumb breathing animation (always running) ──── */
const breatheKeyframes = [
  {
    y: [0, -8, 0, 5, 0],
    scale: [1, 1.03, 1, 0.97, 1],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const },
  },
  {
    y: [0, 6, 0, -7, 0],
    scale: [1, 0.97, 1, 1.04, 1],
    transition: { duration: 7.5, repeat: Infinity, ease: 'easeInOut' as const },
  },
  {
    y: [0, -6, 0, 8, 0],
    scale: [1, 1.04, 1, 0.97, 1],
    transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' as const },
  },
  {
    y: [0, 7, 0, -5, 0],
    scale: [1, 0.97, 1, 1.03, 1],
    transition: { duration: 6.5, repeat: Infinity, ease: 'easeInOut' as const },
  },
];

/* ── Reusable thumbnail card ─────────────────────────── */
function ThumbnailCard({
  video,
  index,
  isActive,
  onClick,
  compact,
}: {
  video: (typeof videos)[0];
  index: number;
  isActive?: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <motion.button
      type="button"
      className="w-full text-right rounded-2xl overflow-hidden cursor-pointer group relative block"
      style={{
        background: '#FFFFFF',
        border: isActive ? '2px solid #0DBACC' : '2px solid transparent',
        boxShadow: isActive
          ? '0 4px 20px rgba(13,186,204,0.2), 0 0 0 1px rgba(13,186,204,0.08)'
          : '0 4px 20px rgba(0, 0, 0, 0.08)',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      }}
      whileHover={{ scale: 1.06, boxShadow: '0 8px 30px rgba(0, 0, 0, 0.14)' }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
    >
      {/* Thumbnail image */}
      <div className="relative" style={{ paddingTop: '56.25%' }}>
        <img
          src={getThumb(video.id)}
          alt={video.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-20"
          style={{
            background: isActive ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.4)',
            opacity: isActive ? 0.3 : 0.5,
          }}
        />

        {/* Step number badge */}
        <div className="absolute top-2 right-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black transition-all duration-300"
            style={{
              background: isActive ? '#0DBACC' : 'rgba(255,255,255,0.92)',
              color: isActive ? '#FFFFFF' : '#303150',
              boxShadow: isActive
                ? '0 2px 8px rgba(13,186,204,0.4)'
                : '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            {index + 1}
          </div>
        </div>

        {/* Play icon (visible on hover for non-active) */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <Play className="w-4 h-4 text-white ms-0.5" fill="white" fillOpacity={0.9} />
            </div>
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-1.5 left-1.5">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.55)' }}
          >
            {video.duration}
          </span>
        </div>
      </div>

      {/* Info area */}
      {!compact && (
        <div className="p-2.5">
          <p
            className="text-[10px] font-medium mb-0.5"
            style={{
              color: isActive ? '#0DBACC' : '#7E7F90',
              fontFamily: 'var(--font-heebo)',
            }}
          >
            צעד {index + 1}
          </p>
          <h4
            className="text-[11px] font-bold leading-snug truncate"
            style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}
          >
            {video.title}
          </h4>
        </div>
      )}
    </motion.button>
  );
}

/* ── Main component ──────────────────────────────────── */
export default function VideoShowcaseSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();
  const noMotion = !!shouldReduceMotion;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const handleVideoSelect = useCallback((index: number) => {
    setActiveIndex(index);
    setIsPlaying(false);
  }, []);

  const handlePlayMain = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const activeVideo = videos[activeIndex];

  return (
    <section
      id="video-showcase"
      ref={sectionRef}
      className="py-20 md:py-28 relative overflow-hidden"
      style={{ background: '#F5F5F7' }}
    >
      {/* Top fade from previous section */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, #FFFFFF, transparent)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section header ── */}
        <motion.p
          className="text-sm font-bold tracking-widest text-center mb-4"
          style={{ color: '#2B4699', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5 }}
        >
          הקורס שלנו
        </motion.p>
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-5 leading-tight"
          style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5 }}
        >
          מחיסכון להשקעה{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ב-4 צעדים
          </span>
        </motion.h2>
        <motion.p
          className="text-lg text-center mb-14 md:mb-20 max-w-lg mx-auto"
          style={{ color: '#6E6E73', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          סדרת סרטונים קצרים שמסבירה איך לעבור מחיסכון רדום בבנק להשקעה חכמה
        </motion.p>

        {/* ── Video stage ── */}
        {isDesktop ? (
          /* ══════════════ Desktop: floating layout ══════════════ */
          <div className="relative" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            {/* Main video — centered, narrower */}
            <motion.div
              className="relative z-10 mx-auto"
              style={{ maxWidth: '680px' }}
              initial={noMotion ? undefined : { opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : undefined}
              transition={noMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            >
              <div
                className="rounded-3xl overflow-hidden"
                style={{
                  background: '#FFFFFF',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <AnimatePresence mode="wait">
                    {isPlaying ? (
                      <motion.iframe
                        key={`iframe-${activeVideo.id}`}
                        src={getEmbed(activeVideo.id)}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      <motion.div
                        key={`thumb-${activeVideo.id}`}
                        className="absolute inset-0 cursor-pointer group"
                        onClick={handlePlayMain}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img
                          src={getThumb(activeVideo.id)}
                          alt={activeVideo.title}
                          className="w-full h-full object-cover"
                        />

                        <div
                          className="absolute inset-0"
                          style={{
                            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.1) 100%)',
                          }}
                        />

                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            className="w-20 h-20 rounded-full flex items-center justify-center"
                            style={{
                              background: 'rgba(255,255,255,0.15)',
                              backdropFilter: 'blur(20px)',
                              border: '2px solid rgba(255,255,255,0.25)',
                              boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
                            }}
                            whileHover={{ scale: 1.08, borderColor: 'rgba(13,186,204,0.6)' }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Play className="w-8 h-8 text-white ms-1" fill="white" fillOpacity={0.9} />
                          </motion.div>
                        </div>

                        {/* Step badge */}
                        <div className="absolute top-4 right-4">
                          <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)' }}
                          >
                            <span
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black"
                              style={{ background: '#0DBACC', color: '#FFFFFF' }}
                            >
                              {activeIndex + 1}
                            </span>
                            <span
                              className="text-[12px] font-bold text-white/80"
                              style={{ fontFamily: 'var(--font-heebo)' }}
                            >
                              מתוך 4
                            </span>
                          </div>
                        </div>

                        {/* Bottom info */}
                        <div className="absolute bottom-0 inset-x-0 p-5">
                          <div className="flex items-end justify-between gap-4">
                            <div>
                              <p
                                className="text-[13px] font-medium mb-1"
                                style={{ color: '#0DBACC', fontFamily: 'var(--font-heebo)' }}
                              >
                                צעד {activeIndex + 1} · {activeVideo.chapter}
                              </p>
                              <h3
                                className="text-lg font-bold text-white leading-snug"
                                style={{ fontFamily: 'var(--font-heebo)' }}
                              >
                                {activeVideo.title}
                              </h3>
                            </div>
                            <span
                              className="text-[13px] font-bold flex-shrink-0 px-3 py-1.5 rounded-lg"
                              style={{
                                color: 'rgba(255,255,255,0.7)',
                                background: 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(8px)',
                              }}
                            >
                              {activeVideo.duration}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* ── All 4 thumbnails — always visible, breathing ── */}
            {videos.map((video, i) => {
              const pos = thumbPositions[i];
              return (
                <motion.div
                  key={video.id}
                  className="absolute z-20"
                  style={{
                    width: 'clamp(170px, 16vw, 210px)',
                    ...pos,
                  }}
                  animate={noMotion ? undefined : breatheKeyframes[i]}
                >
                  <ThumbnailCard
                    video={video}
                    index={i}
                    isActive={activeIndex === i}
                    onClick={() => handleVideoSelect(i)}
                  />
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* ══════════════ Mobile: stacked layout ══════════════ */
          <div className="space-y-5">
            {/* Main video */}
            <motion.div
              initial={noMotion ? undefined : { opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : undefined}
              transition={noMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#FFFFFF',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <AnimatePresence mode="wait">
                    {isPlaying ? (
                      <motion.iframe
                        key={`m-iframe-${activeVideo.id}`}
                        src={getEmbed(activeVideo.id)}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      <motion.div
                        key={`m-thumb-${activeVideo.id}`}
                        className="absolute inset-0 cursor-pointer"
                        onClick={handlePlayMain}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img
                          src={getThumb(activeVideo.id)}
                          alt={activeVideo.title}
                          className="w-full h-full object-cover"
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.1) 100%)',
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{
                              background: 'rgba(255,255,255,0.15)',
                              backdropFilter: 'blur(16px)',
                              border: '2px solid rgba(255,255,255,0.2)',
                            }}
                          >
                            <Play className="w-7 h-7 text-white ms-0.5" fill="white" fillOpacity={0.9} />
                          </div>
                        </div>

                        {/* Step badge */}
                        <div className="absolute top-3 right-3">
                          <div
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
                          >
                            <span
                              className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black"
                              style={{ background: '#0DBACC', color: '#FFFFFF' }}
                            >
                              {activeIndex + 1}
                            </span>
                            <span className="text-[11px] font-bold text-white/70" style={{ fontFamily: 'var(--font-heebo)' }}>
                              מתוך 4
                            </span>
                          </div>
                        </div>

                        {/* Bottom info */}
                        <div className="absolute bottom-0 inset-x-0 p-4">
                          <p className="text-[12px] font-medium mb-0.5" style={{ color: '#0DBACC', fontFamily: 'var(--font-heebo)' }}>
                            צעד {activeIndex + 1} · {activeVideo.chapter}
                          </p>
                          <h3 className="text-base font-bold text-white leading-snug" style={{ fontFamily: 'var(--font-heebo)' }}>
                            {activeVideo.title}
                          </h3>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Thumbnail row — all 4 always visible */}
            <div
              className="flex gap-3 overflow-x-auto pb-1 px-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' as React.CSSProperties['msOverflowStyle'] }}
            >
              {videos.map((video, i) => (
                <div key={video.id} className="flex-shrink-0" style={{ width: '140px' }}>
                  <ThumbnailCard
                    video={video}
                    index={i}
                    isActive={activeIndex === i}
                    onClick={() => handleVideoSelect(i)}
                    compact
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CTA ── */}
      <div className="relative text-center mt-14 md:mt-20 px-4 sm:px-6">
        {/* Gradient divider */}
        <motion.div
          className="mx-auto mb-8"
          style={{
            width: '64px',
            height: '3px',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, #2B4699, #0DBACC)',
          }}
          initial={noMotion ? undefined : { scaleX: 0, opacity: 0 }}
          animate={isInView ? { scaleX: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.6, delay: 0.2 }}
        />

        <motion.p
          className="text-lg sm:text-xl font-bold mb-2"
          style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          ראיתם את הסרטונים? עכשיו תעשו את הצעד.
        </motion.p>

        <motion.p
          className="text-[14px] mb-7 max-w-md mx-auto"
          style={{ color: '#8E8E93', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.4, delay: 0.38 }}
        >
          פתיחת חשבון מסחר באלטשולר שחם · פטור מדמי ניהול · 200 ₪ מתנה
        </motion.p>

        <motion.div
          initial={noMotion ? undefined : { opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.4, delay: 0.46 }}
        >
          <motion.a
            href="https://digitalsolutions.as-invest.co.il/trade_OnBoarding/?utm_source=Myneto&utm_medium=Link"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCtaClickServer('landing_video_cta')}
            className="group relative inline-flex items-center gap-2 px-7 py-3 rounded-2xl text-[15px] font-bold text-white cursor-pointer overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
              fontFamily: 'var(--font-heebo)',
            }}
            whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(43,70,153,0.28)' }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Shimmer sweep */}
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
                animation: 'ctaShimmer 3s ease-in-out infinite',
              }}
            />
            <span className="relative z-10">לפתיחת חשבון מסחר</span>
            <ArrowLeft className="relative z-10 w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" strokeWidth={2.5} />
          </motion.a>
        </motion.div>

        <motion.p
          className="text-[11px] mt-5"
          style={{ color: '#C7C7CC', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.4, delay: 0.55 }}
        >
          ההטבות בתוקף לפותחי חשבון דרך myNETO בלבד · אינו מהווה ייעוץ השקעות
        </motion.p>
      </div>

      {/* Shimmer keyframe */}
      <style jsx>{`
        @keyframes ctaShimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>

      {/* Bottom fade to FAQ */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #FFFFFF)' }}
      />
    </section>
  );
}
