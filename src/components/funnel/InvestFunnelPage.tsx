'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform, useInView } from 'framer-motion';
import { PieChart, Play, ArrowLeft, ShieldCheck, Gift, BadgeCheck, Zap, Check, Clock } from 'lucide-react';
import { trackMixpanelEvent, onMixpanelReady } from '@/lib/mixpanel';
import { trackCtaClickServer } from '@/lib/utils';

/* ── Constants ─────────────────────────────────────────── */

const PARTNER_URL =
  'https://digitalsolutions.as-invest.co.il/trade_OnBoarding/?utm_source=Myneto&utm_medium=Link';

const VIDEOS = [
  { id: 'eSPdAfQmDRA', title: 'למה חיסכון בבנק כבר לא מספיק?', duration: '03:24', chapter: 'כדור השלג של הכסף' },
  { id: 'AvmYuJrEF18', title: 'למה הסטטיסטיקה מנצחת את המומחים?', duration: '03:41', chapter: 'סוד ה-S&P 500' },
  { id: 'SVZnToUSRMg', title: 'פותחים חשבון באלטשולר שחם', duration: '04:24', chapter: 'תכל׳ס - פתיחת חשבון' },
  { id: 'TdA1O5MeifQ', title: 'בחירת המסלול והוראת הקבע', duration: '02:34', chapter: 'טייס אוטומטי' },
];

const getThumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
const getEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&iv_load_policy=3&autoplay=1`;

const BENTO_BENEFITS = [
  {
    value: '0₪',
    title: 'פטור מלא מדמי ניהול',
    desc: 'ללא הגבלת זמן, לכל חיי החשבון. חסכון של אלפי שקלים לאורך השנים.',
    icon: ShieldCheck,
    accent: '#0DBACC',
  },
  {
    value: '200₪',
    title: 'מתנת הצטרפות',
    desc: 'לכל פותחי חשבון חדש דרכנו, ישר לחשבון.',
    icon: Gift,
    accent: '#69ADFF',
  },
  {
    value: 'כשר',
    title: 'מסלולי השקעה הלכתיים',
    desc: 'בפיקוח הלכתי מלא, בהכשר מהדרין.',
    icon: BadgeCheck,
    accent: '#74ACEF',
  },
  {
    value: 'אוטומט׳',
    title: 'הוראת קבע פעם אחת',
    desc: 'מגדירים והכסף עובד לבד. בלי לגעת.',
    icon: Zap,
    accent: '#F18AB5',
  },
  {
    value: '3 דק׳',
    title: 'פתיחת חשבון מהירה',
    desc: 'תהליך דיגיטלי פשוט ומהיר, בלי ביורוקרטיה.',
    icon: Clock,
    accent: '#2B4699',
  },
];


/* ── Investment calculator channel definitions ────────── */

const CHANNELS = [
  {
    key: 'selfTrade',
    label: 'מסחר עצמאי',
    annualReturn: 0.08,
    fee: 0,
    feeLabel: '0% דמי ניהול',
    feeColor: '#0DBACC',
    color: '#0DBACC',
    colorDark: '#0A9CAD',
    colorLight: '#3FD5E5',
    highlight: true,
  },
  {
    key: 'gemel',
    label: 'קופת גמל',
    annualReturn: 0.08,
    fee: 0.0085,
    feeLabel: '0.7-1% דמי ניהול',
    feeColor: '#69ADFF',
    color: '#69ADFF',
    colorDark: '#5494DD',
    colorLight: '#8FC3FF',
    highlight: false,
  },
  {
    key: 'bank',
    label: 'חיסכון בבנק',
    annualReturn: 0.02,
    fee: 0,
    feeLabel: 'ריבית 2% בלבד',
    feeColor: '#F18AB5',
    color: '#F18AB5',
    colorDark: '#D0729A',
    colorLight: '#FFA6CA',
    highlight: false,
  },
  {
    key: 'gmach',
    label: 'השקעה בגמ"ח',
    annualReturn: 0,
    fee: 0,
    feeLabel: '0% תשואה',
    feeColor: '#BDBDCB',
    color: '#BDBDCB',
    colorDark: '#9E9EAA',
    colorLight: '#D4D4DF',
    highlight: false,
  },
] as const;

function computeFutureValue(
  initialAmount: number,
  monthlyDeposit: number,
  years: number,
  annualReturn: number,
  fee: number,
): number {
  const netReturn = annualReturn - fee;
  const monthlyRate = netReturn / 12;
  const months = years * 12;
  if (monthlyRate === 0) {
    return initialAmount + monthlyDeposit * months;
  }
  const compounded = Math.pow(1 + monthlyRate, months);
  return initialAmount * compounded + monthlyDeposit * ((compounded - 1) / monthlyRate);
}

type ChannelResult = {
  label: string;
  endValue: number;
  heightPx: number;
  feeLabel: string;
  feeColor: string;
  color: string;
  colorDark: string;
  colorLight: string;
  highlight: boolean;
};

/* ── Gradient text helper ──────────────────────────────── */

const GRADIENT_STYLE = {
  background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

/* ── CTA click handler ─────────────────────────────────── */

function handleCtaClick(source: string) {
  trackCtaClickServer(source);
  window.open(PARTNER_URL, '_blank', 'noopener,noreferrer');
}

/* ── Spring presets (matching main landing) ───────────── */

const springBouncy = { type: 'spring' as const, stiffness: 120, damping: 20 };
const springSnappy = { type: 'spring' as const, stiffness: 200, damping: 22 };
const springPaper  = { type: 'spring' as const, stiffness: 60, damping: 14 };

/* ── Investment card positions & drift ────────────────── */

const investCards = [
  {
    id: 'growth',
    x: '5%', y: '8%', rotate: -5, z: 7, w: 220, h: 155,
    drift: { y: [0, -6, 0, 4, 0], rotate: [-5, -3.5, -5, -6.5, -5], duration: 7.2, delay: 0 },
  },
  {
    id: 'milestone',
    x: '50%', y: '4%', rotate: 4, z: 5, w: 175, h: 175,
    drift: { y: [0, 5, 0, -6, 0], rotate: [4, 5.5, 4, 2.5, 4], duration: 8.1, delay: 0.6 },
  },
  {
    id: 'returns',
    x: '15%', y: '44%', rotate: -3, z: 8, w: 230, h: 150,
    drift: { y: [0, -7, 0, 5, 0], rotate: [-3, -1, -3, -4.5, -3], duration: 6.8, delay: 1.2 },
  },
  {
    id: 'bonus',
    x: '52%', y: '48%', rotate: 6, z: 6, w: 195, h: 130,
    drift: { y: [0, 6, 0, -4, 0], rotate: [6, 7.5, 6, 4.5, 6], duration: 7.5, delay: 0.3 },
  },
];

const sparklineUp = 'M0,28 L8,24 L16,26 L24,18 L32,20 L40,12 L48,14 L56,6 L64,8 L72,2';

/* ── Investment Card Renderers ────────────────────────── */

function PortfolioGrowthCard() {
  return (
    <div className="h-full flex flex-col p-4 gap-2" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>ביצועי תיק</span>
        <span className="text-[11px] font-black" style={{ color: '#0DBACC' }}>+12.4%</span>
      </div>
      <div className="flex-1 flex items-end gap-[3px] pb-1">
        {[35, 42, 38, 55, 48, 62, 58, 72, 68, 80, 75, 88].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{
              height: `${h}%`,
              background: i >= 10
                ? 'linear-gradient(to top, #0DBACC, #2B4699)'
                : i >= 8
                  ? 'rgba(13,186,204,0.5)'
                  : 'rgba(255,255,255,0.1)',
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.8 + i * 0.06, duration: 0.4, ease: 'easeOut' }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>ינו׳</span>
        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>דצמ׳</span>
      </div>
    </div>
  );
}

function SavingsMilestoneCard() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-3 gap-1.5" style={{ fontFamily: 'var(--font-heebo)' }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <motion.circle
          cx="28" cy="28" r="23"
          fill="none" stroke="#0DBACC" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${0.67 * 144.5} ${144.5}`}
          transform="rotate(-90 28 28)"
          initial={{ strokeDasharray: '0 144.5' }}
          animate={{ strokeDasharray: `${0.67 * 144.5} ${144.5}` }}
          transition={{ delay: 0.9, duration: 1.2, ease: 'easeOut' }}
        />
        <text x="28" y="30" textAnchor="middle" fontSize="13" fontWeight="900" fill="#FFFFFF" style={{ fontFamily: 'var(--font-heebo)' }}>67%</text>
      </svg>
      <span className="text-[11px] font-bold" style={{ color: '#FFFFFF' }}>קרן מחקה S&P</span>
      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>₪33.5K / ₪50K</span>
    </div>
  );
}

function ReturnStatsCard() {
  return (
    <div className="h-full flex flex-col p-4" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>תשואה שנתית ממוצעת</span>
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-3xl font-black" style={{ color: '#FFFFFF' }}>7.2%</span>
        <span className="text-[10px]" style={{ color: '#0DBACC' }}>לאורך 30 שנה</span>
      </div>
      <svg width="100%" height="28" viewBox="0 0 72 30" preserveAspectRatio="none" className="mt-auto">
        <motion.path
          d={sparklineUp}
          fill="none" stroke="#0DBACC" strokeWidth="2" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1.1, duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>1994</span>
        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>2024</span>
      </div>
    </div>
  );
}

function WelcomeBonusCard() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 gap-2" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(105,173,255,0.15)' }}>
        <Gift className="w-4 h-4" style={{ color: '#69ADFF' }} strokeWidth={2} />
      </div>
      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>מתנת הצטרפות</span>
      <span className="text-2xl font-black tabular-nums" style={{ color: '#FFFFFF' }}>200₪</span>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0DBACC' }} />
        <span className="text-[9px]" style={{ color: '#0DBACC' }}>זמין מיידית</span>
      </div>
    </div>
  );
}

const investCardRenderers: Record<string, React.FC> = {
  growth: PortfolioGrowthCard,
  milestone: SavingsMilestoneCard,
  returns: ReturnStatsCard,
  bonus: WelcomeBonusCard,
};

/* ── Section 2: Hero ───────────────────────────────────── */

function HeroSection({ noMotion }: { noMotion: boolean }) {
  const { scrollY } = useScroll();
  const chevronOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const [mounted, setMounted] = useState(false);

  // Scroll-driven image effects: starts tilted & offset, straightens on scroll
  const imgRotateZ = useTransform(scrollY, [0, 500], [-4, 0]);
  const imgTranslateX = useTransform(scrollY, [0, 500], [-20, 0]);

  useEffect(() => { setMounted(true); }, []);

  const stagger = (i: number) =>
    noMotion ? { duration: 0 } : { duration: 0.7, delay: 0.1 + i * 0.1 };

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: '#F5F5F7' }}
      aria-label="צמיחה כלכלית"
    >
      {/* Subtle radial glow — matches landing page */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '80vw',
          height: '80vh',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(ellipse at center, rgba(43,70,153,0.04) 0%, rgba(13,186,204,0.02) 40%, transparent 70%)',
        }}
      />

      {/* Split layout content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8 xl:gap-16">

          {/* ── Text side (right in RTL — first child) ── */}
          <motion.div
            className="lg:w-1/2 text-center lg:text-start"
            initial={noMotion ? undefined : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={noMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Headline */}
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.75rem] xl:text-[4.25rem] font-black leading-[1.1] mb-6"
              style={{
                color: '#1D1D1F',
                fontFamily: 'var(--font-heebo)',
                letterSpacing: '-0.02em',
              }}
              initial={noMotion ? undefined : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={stagger(1)}
            >
              הכסף שלך  
              <span style={GRADIENT_STYLE}> עובד.</span>
              <br />
              <span style={{ position: 'relative', display: 'inline-block' }}>
                אתה 
                
                <span style={GRADIENT_STYLE}> לומד תורה.</span>
                
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-base sm:text-lg mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed"
              style={{ color: '#6E6E73', fontFamily: 'var(--font-heebo)', fontWeight: 400 }}
              initial={noMotion ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={noMotion ? { duration: 0 } : { duration: 0.7, delay: 0.35 }}
            >
              למד איך להתחיל להשקיע ולבנות עתיד כלכלי יציב <br /> בקלות ובלי ידע מוקדם
            </motion.p>

            {/* CTA button */}
            <motion.div
              className="flex justify-center lg:justify-start"
              initial={noMotion ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={noMotion ? { duration: 0 } : { ...springBouncy, delay: 0.4 }}
            >
              <motion.button
                onClick={() => handleCtaClick('funnel_hero_cta')}
                className="relative inline-flex items-center gap-2 px-8 py-3.5 sm:px-10 sm:py-4 rounded-2xl text-white text-base sm:text-lg font-bold cursor-pointer overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
                  fontFamily: 'var(--font-heebo)',
                  boxShadow: '0 4px 24px rgba(43,70,153,0.4)',
                }}
                whileHover={noMotion ? undefined : {
                  scale: 1.04,
                  y: -3,
                  boxShadow: '0 12px 40px rgba(43,70,153,0.5)',
                }}
                whileTap={noMotion ? undefined : { scale: 0.98 }}
                transition={springSnappy}
              >
                <span
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
                    animation: 'ctaShimmer 3s ease-in-out infinite',
                  }}
                />
                <span className="relative z-10">התחל להשקיע עכשיו</span>
                <ArrowLeft className="relative z-10 w-4 h-4" strokeWidth={2.5} />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* ── Image side (left in RTL — second child) — trading dashboard ── */}
          <div
            className="lg:w-1/2 w-full"
            style={{ perspective: '1200px' }}
          >
            <motion.div
              initial={noMotion ? undefined : { opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={noMotion ? { duration: 0 } : { type: 'spring', stiffness: 50, damping: 18, delay: 0.25 }}
            >
              <motion.div
                style={noMotion ? undefined : {
                  rotateZ: imgRotateZ,
                  rotateX: 6,
                  rotateY: -4,
                  x: imgTranslateX,
                  transformStyle: 'preserve-3d',
                }}
                animate={noMotion ? undefined : {
                  y: [0, -14, 0],
                }}
                transition={noMotion ? undefined : {
                  y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.85)',
                    border: '1px solid rgba(255,255,255,0.95)',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.15), 0 15px 35px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06)',
                  }}
                >
                  <img
                    src="/screenshots/trading-dashboard.png"
                    alt="פלטפורמת מסחר אלטשולר שחם"
                    className="w-full h-auto"
                    style={{ display: 'block' }}
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      {mounted && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1 pointer-events-none z-20"
          style={{ opacity: chevronOpacity }}
          initial={noMotion ? undefined : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <motion.div
            className="w-6 h-10 rounded-full flex justify-center pt-2"
            style={{ border: '2px solid rgba(0,0,0,0.12)' }}
            animate={noMotion ? undefined : { y: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              className="w-1 h-2.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.25)' }}
              animate={noMotion ? undefined : {
                y: [0, 6, 0],
                opacity: [0.6, 0.15, 0.6],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
          <span
            className="text-[11px] font-semibold mt-1"
            style={{ color: 'rgba(0,0,0,0.2)', fontFamily: 'var(--font-heebo)' }}
          >
            גללו למטה
          </span>
        </motion.div>
      )}

      {/* Bottom fade into WhyInvest (#FFFFFF) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #FFFFFF)' }}
      />

      <style jsx>{`
        @keyframes ctaShimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
}

/* ── Section 3: Why Invest ─────────────────────────────── */

/* ── Animated number counter ─────────────────────────── */

function AnimatedCounter({ value, noMotion }: { value: number; noMotion: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [display, setDisplay] = useState(noMotion ? value : 0);
  const prevValue = useRef(noMotion ? value : 0);

  useEffect(() => {
    if (!isInView || noMotion) {
      if (noMotion) setDisplay(value);
      return;
    }
    const from = prevValue.current;
    const to = value;
    prevValue.current = to;
    const duration = 800;
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isInView, value, noMotion]);

  return <span ref={ref}>{display.toLocaleString('he-IL')}</span>;
}

/* ── Section 3: Why Invest — 3D Isometric Bar Chart ──── */

/*
 * Isometric bar built with an SVG per bar.
 * Each bar = front rect + right-side parallelogram + top parallelogram.
 * Using SVG avoids all CSS 3D / skew alignment headaches.
 *
 * Iso angle = 30° ⟹  dx = depth × cos(30°),  dy = depth × sin(30°)
 */
const ISO_ANGLE = 30;                          // degrees
const COS = Math.cos((ISO_ANGLE * Math.PI) / 180); // ≈ 0.866
const SIN = Math.sin((ISO_ANGLE * Math.PI) / 180); // = 0.5
const BAR_FRONT_W = 64;                        // front face width
const DEPTH_PX = 18;                           // how "deep" the bar looks
const DX = Math.round(DEPTH_PX * COS);         // horizontal shift for depth
const DY = Math.round(DEPTH_PX * SIN);         // vertical   shift for depth
const CHART_H = 220;                           // max bar height (tallest bar)
const COL_W = BAR_FRONT_W + DX + 2;            // total column width including 3D offset

function IsometricBar({
  data,
  index,
  noMotion,
}: {
  data: ChannelResult;
  index: number;
  noMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const h = Math.max(data.heightPx, 12);

  const svgW = BAR_FRONT_W + DX;
  const svgH = CHART_H + DY;

  // Geometry anchored to the BOTTOM of the SVG, height = h
  const barBottom = svgH;
  const barTop = barBottom - h;
  const topFaceTop = barTop - DY;

  const rightSide = [
    [BAR_FRONT_W, barBottom],
    [BAR_FRONT_W + DX, barBottom - DY],
    [BAR_FRONT_W + DX, topFaceTop],
    [BAR_FRONT_W, barTop],
  ].map(([px, py]) => `${px},${py}`).join(' ');

  const topFace = [
    [0, barTop],
    [BAR_FRONT_W, barTop],
    [BAR_FRONT_W + DX, topFaceTop],
    [DX, topFaceTop],
  ].map(([px, py]) => `${px},${py}`).join(' ');

  return (
    <motion.div
      ref={ref}
      style={{ width: COL_W, height: svgH }}
      initial={noMotion ? undefined : { opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={`front-${index}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={data.colorDark} />
            <stop offset="100%" stopColor={data.color} />
          </linearGradient>
          <linearGradient id={`side-${index}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={data.colorDark} stopOpacity="0.75" />
            <stop offset="100%" stopColor={data.colorDark} />
          </linearGradient>
        </defs>
        <rect
          x={0}
          y={barTop}
          width={BAR_FRONT_W}
          height={h}
          rx={3}
          fill={`url(#front-${index})`}
        />
        <polygon points={rightSide} fill={`url(#side-${index})`} />
        <polygon points={topFace} fill={data.colorLight} />
        {data.highlight && (
          <rect
            x={0}
            y={barTop}
            width={BAR_FRONT_W}
            height={h}
            rx={3}
            fill="none"
            stroke={data.color}
            strokeWidth={1.5}
            opacity={0.25}
          />
        )}
      </svg>
    </motion.div>
  );
}

/* ── Styled range slider ─────────────────────────────── */

function CalcSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  format,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  format: (v: number) => string;
  onChange: (v: number) => void;
  accent: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[13px] font-medium"
          style={{ color: '#7E7F90', fontFamily: 'var(--font-heebo)' }}
        >
          {label}
        </span>
        <span
          className="text-[15px] font-bold tabular-nums"
          style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}
        >
          {format(value)} {suffix}
        </span>
      </div>
      <div className="relative w-full h-6 flex items-center">
        <div
          className="absolute inset-x-0 h-1 rounded-full"
          style={{ background: '#E8E8ED' }}
        />
        <div
          className="absolute h-1 rounded-full"
          style={{
            background: accent,
            width: `${pct}%`,
            right: 0,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="calc-slider absolute inset-0 w-full appearance-none bg-transparent cursor-pointer z-10"
          style={{ direction: 'rtl' }}
        />
      </div>
    </div>
  );
}

function WhyInvestSection({ noMotion }: { noMotion: boolean }) {
  const [initialAmount, setInitialAmount] = useState(100000);
  const [monthlyDeposit, setMonthlyDeposit] = useState(1000);
  const [years, setYears] = useState(20);

  const chartData = useMemo<ChannelResult[]>(() => {
    const results = CHANNELS.map((ch) => ({
      ...ch,
      endValue: Math.round(computeFutureValue(initialAmount, monthlyDeposit, years, ch.annualReturn, ch.fee)),
      heightPx: 0,
    }));
    const maxVal = Math.max(...results.map((r) => r.endValue), 1);
    const MIN_BAR = 18;
    return results.map((r) => ({
      ...r,
      heightPx: Math.round(MIN_BAR + ((r.endValue / maxVal) * (CHART_H - MIN_BAR))),
    }));
  }, [initialAmount, monthlyDeposit, years]);

  const bestVal = chartData[0]?.endValue ?? 0;
  const worstVal = chartData[chartData.length - 1]?.endValue ?? 0;
  const diffBestWorst = bestVal - worstVal;
  const multiplier = worstVal > 0 ? (bestVal / worstVal).toFixed(1) : '0';
  const totalDeposited = initialAmount + monthlyDeposit * years * 12;
  const netProfit = bestVal - totalDeposited;

  const fmtNIS = (v: number) => `₪${v.toLocaleString('he-IL')}`;

  return (
    <section
      className="relative py-24 md:py-36 px-4 sm:px-6"
      style={{ background: '#FFFFFF' }}
      aria-label="מחשבון השקעות"
    >
      <div className="relative z-10 max-w-5xl mx-auto">

        {/* ── Header ── */}
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 leading-[1.15] text-center"
          style={{ ...GRADIENT_STYLE, fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          כמה הכסף שלך יכול לגדול?
        </motion.h2>
        <motion.p
          className="text-[15px] sm:text-base max-w-lg mx-auto leading-relaxed mb-14 md:mb-20 text-center"
          style={{ color: '#7E7F90', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          הזיזו את הפרמטרים וראו בזמן אמת מה קורה לכסף שלכם בכל אפיק
        </motion.p>

        {/* ── Two-column: Controls + Chart ── */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">

          {/* ── Controls Panel (right in RTL) ── */}
          <motion.div
            className="lg:w-5/12 w-full"
            initial={noMotion ? undefined : { opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="rounded-3xl p-6 sm:p-8 h-full"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #F7F7F8',
              }}
            >
              <h3
                className="text-[16px] font-bold mb-6"
                style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}
              >
                הגדירו את הנתונים שלכם
              </h3>

              <CalcSlider
                label="סכום התחלתי"
                value={initialAmount}
                min={10000}
                max={1000000}
                step={10000}
                suffix="₪"
                format={(v) => v.toLocaleString('he-IL')}
                onChange={setInitialAmount}
                accent="#0DBACC"
              />
              <CalcSlider
                label="הפקדה חודשית"
                value={monthlyDeposit}
                min={0}
                max={10000}
                step={500}
                suffix="₪"
                format={(v) => v.toLocaleString('he-IL')}
                onChange={setMonthlyDeposit}
                accent="#69ADFF"
              />
              <CalcSlider
                label="תקופת השקעה"
                value={years}
                min={5}
                max={30}
                step={1}
                suffix="שנים"
                format={(v) => String(v)}
                onChange={setYears}
                accent="#2B4699"
              />

              <div
                className="mt-6 pt-5 flex items-center justify-between"
                style={{ borderTop: '1px solid #F7F7F8' }}
              >
                <span
                  className="text-[12px]"
                  style={{ color: '#BDBDCB', fontFamily: 'var(--font-heebo)' }}
                >
                  תשואה ממוצעת 8% · ריבית דריבית חודשית
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── Chart Panel (left in RTL) ── */}
          <motion.div
            className="lg:w-7/12 w-full"
            initial={noMotion ? undefined : { opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div
              className="rounded-3xl p-6 sm:p-8 h-full flex flex-col justify-between"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #F7F7F8',
              }}
            >
              {/* Fee badges */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-8 mb-3">
                {chartData.map((item) => (
                  <div key={item.label} className="flex justify-center" style={{ width: COL_W }}>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold whitespace-nowrap"
                      style={{
                        background: `${item.feeColor}12`,
                        color: item.feeColor,
                        fontFamily: 'var(--font-heebo)',
                        border: `1px solid ${item.feeColor}25`,
                      }}
                    >
                      {item.feeLabel}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bars */}
              <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-8">
                {chartData.map((item, i) => (
                  <IsometricBar key={item.label} data={item} index={i} noMotion={noMotion} />
                ))}
              </div>

              {/* Labels */}
              <div className="flex items-start justify-center gap-2 sm:gap-4 md:gap-8 mt-3">
                {chartData.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-center"
                    style={{ width: COL_W, fontFamily: 'var(--font-heebo)' }}
                  >
                    <span
                      className="text-[10px] sm:text-[12px] font-bold leading-tight text-center"
                      style={{ color: '#303150' }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Values */}
              <div className="flex items-start justify-center gap-2 sm:gap-4 md:gap-8 mt-1">
                {chartData.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-center"
                    style={{ width: COL_W, fontFamily: 'var(--font-heebo)' }}
                  >
                    <span
                      className="text-[13px] sm:text-[16px] font-black tabular-nums"
                      style={{ color: item.color }}
                    >
                      ₪<AnimatedCounter value={item.endValue} noMotion={noMotion} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Bottom dynamic stats ── */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-6 sm:gap-0 mt-12"
          initial={noMotion ? undefined : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >
          {[
            {
              value: fmtNIS(diffBestWorst),
              title: 'הפרש בין מסחר עצמאי לבנק',
              desc: `אחרי ${years} שנות השקעה`,
              accent: '#10B981',
            },
            {
              value: `×${multiplier}`,
              title: 'יחס תשואה',
              desc: 'מסחר עצמאי מול חיסכון בבנק',
              accent: '#0DBACC',
            },
            {
              value: fmtNIS(netProfit > 0 ? netProfit : 0),
              title: 'רווח נקי מהשקעה',
              desc: 'מעבר לסכום שהפקדתם',
              accent: '#69ADFF',
            },
          ].map((stat, i) => (
            <div key={stat.title} className="flex items-center">
              {i > 0 && (
                <div
                  className="hidden sm:block mx-6 md:mx-8"
                  style={{ width: 1, height: 32, background: '#E4E4EC' }}
                />
              )}
              <div className="flex items-center gap-3">
                <span
                  className="text-lg sm:text-xl font-black whitespace-nowrap"
                  style={{ color: stat.accent, fontFamily: 'var(--font-heebo)' }}
                >
                  {stat.value}
                </span>
                <div>
                  <span
                    className="block text-[13px] font-bold leading-tight"
                    style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}
                  >
                    {stat.title}
                  </span>
                  <span
                    className="block text-[11px] leading-tight mt-0.5"
                    style={{ color: '#7E7F90', fontFamily: 'var(--font-heebo)' }}
                  >
                    {stat.desc}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

      </div>

      {/* Slider custom styles */}
      <style jsx>{`
        .calc-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 2.5px solid #0DBACC;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .calc-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 3px 12px rgba(13,186,204,0.3);
        }
        .calc-slider::-webkit-slider-thumb:active {
          transform: scale(1.05);
        }
        .calc-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 2.5px solid #0DBACC;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          cursor: pointer;
        }
        .calc-slider::-webkit-slider-runnable-track {
          height: 4px;
          background: transparent;
        }
        .calc-slider::-moz-range-track {
          height: 4px;
          background: transparent;
        }
      `}</style>

      {/* Bottom fade into VideoCourse (#F5F5F7) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to bottom, transparent, #F5F5F7)' }}
      />
    </section>
  );
}

/* ── Section 4: Video Course (matches landing page layout) ── */

const thumbPositions = [
  { top: '-1%', right: '0%' },
  { bottom: '0%', right: '1%' },
  { bottom: '-3%', left: '0%' },
  { top: '2%', left: '1%' },
];

const breatheKeyframes = [
  { y: [0, -8, 0, 5, 0], scale: [1, 1.03, 1, 0.97, 1], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const } },
  { y: [0, 6, 0, -7, 0], scale: [1, 0.97, 1, 1.04, 1], transition: { duration: 7.5, repeat: Infinity, ease: 'easeInOut' as const } },
  { y: [0, -6, 0, 8, 0], scale: [1, 1.04, 1, 0.97, 1], transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' as const } },
  { y: [0, 7, 0, -5, 0], scale: [1, 0.97, 1, 1.03, 1], transition: { duration: 6.5, repeat: Infinity, ease: 'easeInOut' as const } },
];

function VideoThumbnailCard({
  video,
  index,
  isActive,
  onClick,
  compact,
}: {
  video: (typeof VIDEOS)[0];
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
      <div className="relative" style={{ paddingTop: '56.25%' }}>
        <img src={getThumb(video.id)} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-20"
          style={{ background: isActive ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.4)', opacity: isActive ? 0.3 : 0.5 }}
        />
        <div className="absolute top-2 right-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black transition-all duration-300"
            style={{
              background: isActive ? '#0DBACC' : 'rgba(255,255,255,0.92)',
              color: isActive ? '#FFFFFF' : '#303150',
              boxShadow: isActive ? '0 2px 8px rgba(13,186,204,0.4)' : '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            {index + 1}
          </div>
        </div>
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <Play className="w-4 h-4 text-white ms-0.5" fill="white" fillOpacity={0.9} />
            </div>
          </div>
        )}
        <div className="absolute bottom-1.5 left-1.5">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.55)' }}>
            {video.duration}
          </span>
        </div>
      </div>
      {!compact && (
        <div className="p-2.5">
          <p className="text-[10px] font-medium mb-0.5" style={{ color: isActive ? '#0DBACC' : '#7E7F90', fontFamily: 'var(--font-heebo)' }}>
            צעד {index + 1}
          </p>
          <h4 className="text-[11px] font-bold leading-snug truncate" style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}>
            {video.title}
          </h4>
        </div>
      )}
    </motion.button>
  );
}

function VideoCourseSection({ noMotion }: { noMotion: boolean }) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const activeVideo = VIDEOS[activeIndex];

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const handleSelect = useCallback((i: number) => {
    setActiveIndex(i);
    setIsPlaying(false);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  return (
    <section
      id="video-showcase"
      ref={sectionRef}
      className="py-20 md:py-28 relative overflow-hidden"
      style={{ background: '#F5F5F7' }}
      aria-label="הקורס שלנו"
    >
      {/* Top fade from WhyInvest (#FFFFFF) */}
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none z-[1]"
        style={{ background: 'linear-gradient(to bottom, #FFFFFF, transparent)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
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
          <span style={GRADIENT_STYLE}>ב-4 צעדים</span>
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

        {/* Video stage */}
        {isDesktop ? (
          <div className="relative" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            {/* Main video — centered */}
            <motion.div
              className="relative z-10 mx-auto"
              style={{ maxWidth: '680px' }}
              initial={noMotion ? undefined : { opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : undefined}
              transition={noMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            >
              <div
                className="rounded-3xl overflow-hidden"
                style={{ background: '#FFFFFF', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}
              >
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <AnimatePresence mode="wait">
                    {isPlaying ? (
                      <motion.iframe
                        key={`iframe-${activeVideo.id}`}
                        src={getEmbed(activeVideo.id)}
                        className="absolute inset-0 w-full h-full border-0"
                        referrerPolicy="strict-origin-when-cross-origin"
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
                        onClick={handlePlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img src={getThumb(activeVideo.id)} alt={activeVideo.title} className="w-full h-full object-cover" />
                        <div
                          className="absolute inset-0"
                          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.1) 100%)' }}
                        />
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
                        <div className="absolute top-4 right-4">
                          <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)' }}
                          >
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black" style={{ background: '#0DBACC', color: '#FFFFFF' }}>
                              {activeIndex + 1}
                            </span>
                            <span className="text-[12px] font-bold text-white/80" style={{ fontFamily: 'var(--font-heebo)' }}>מתוך 4</span>
                          </div>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-5">
                          <div className="flex items-end justify-between gap-4">
                            <div>
                              <p className="text-[13px] font-medium mb-1" style={{ color: '#0DBACC', fontFamily: 'var(--font-heebo)' }}>
                                צעד {activeIndex + 1} · {activeVideo.chapter}
                              </p>
                              <h3 className="text-lg font-bold text-white leading-snug" style={{ fontFamily: 'var(--font-heebo)' }}>
                                {activeVideo.title}
                              </h3>
                            </div>
                            <span
                              className="text-[13px] font-bold flex-shrink-0 px-3 py-1.5 rounded-lg"
                              style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
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

            {/* Floating thumbnails with breathing animation */}
            {VIDEOS.map((video, i) => {
              const pos = thumbPositions[i];
              return (
                <motion.div
                  key={video.id}
                  className="absolute z-20"
                  style={{ width: 'clamp(170px, 16vw, 210px)', ...pos }}
                  animate={noMotion ? undefined : breatheKeyframes[i]}
                >
                  <VideoThumbnailCard video={video} index={i} isActive={activeIndex === i} onClick={() => handleSelect(i)} />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Mobile: main video */}
            <motion.div
              initial={noMotion ? undefined : { opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : undefined}
              transition={noMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: '#FFFFFF', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}
              >
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <AnimatePresence mode="wait">
                    {isPlaying ? (
                      <motion.iframe
                        key={`m-iframe-${activeVideo.id}`}
                        src={getEmbed(activeVideo.id)}
                        className="absolute inset-0 w-full h-full border-0"
                        referrerPolicy="strict-origin-when-cross-origin"
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
                        onClick={handlePlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img src={getThumb(activeVideo.id)} alt={activeVideo.title} className="w-full h-full object-cover" />
                        <div
                          className="absolute inset-0"
                          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.1) 100%)' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)', border: '2px solid rgba(255,255,255,0.2)' }}
                          >
                            <Play className="w-7 h-7 text-white ms-0.5" fill="white" fillOpacity={0.9} />
                          </div>
                        </div>
                        <div className="absolute top-3 right-3">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
                            <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black" style={{ background: '#0DBACC', color: '#FFFFFF' }}>
                              {activeIndex + 1}
                            </span>
                            <span className="text-[11px] font-bold text-white/70" style={{ fontFamily: 'var(--font-heebo)' }}>מתוך 4</span>
                          </div>
                        </div>
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

            {/* Mobile: thumbnail row */}
            <div
              className="flex gap-3 overflow-x-auto pb-1 px-0.5"
              style={{ scrollbarWidth: 'none' }}
            >
              {VIDEOS.map((video, i) => (
                <div key={video.id} className="flex-shrink-0" style={{ width: '140px' }}>
                  <VideoThumbnailCard video={video} index={i} isActive={activeIndex === i} onClick={() => handleSelect(i)} compact />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="relative text-center mt-14 md:mt-20 px-4 sm:px-6">
        <motion.div
          className="mx-auto mb-8"
          style={{ width: '64px', height: '3px', borderRadius: '2px', background: 'linear-gradient(90deg, #2B4699, #0DBACC)' }}
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
            href={PARTNER_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleCtaClick('funnel_video_cta')}
            className="group relative inline-flex items-center gap-2 px-7 py-3 rounded-2xl text-[15px] font-bold text-white cursor-pointer overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2B4699, #0DBACC)', fontFamily: 'var(--font-heebo)' }}
            whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(43,70,153,0.28)' }}
            whileTap={{ scale: 0.97 }}
          >
            <span
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)', animation: 'ctaShimmer2 3s ease-in-out infinite' }}
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

      <style jsx>{`
        @keyframes ctaShimmer2 {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>

      {/* Bottom fade into Benefits (#FFFFFF) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #FFFFFF)' }}
      />
    </section>
  );
}

/* ── Section 5: Benefits — Product Showcase Grid ───────── */

/* ── Benefit row — compact inline benefit ── */

function BenefitRow({
  item,
  index,
  noMotion,
}: {
  item: typeof BENTO_BENEFITS[number];
  index: number;
  noMotion: boolean;
}) {
  const Icon = item.icon;
  return (
    <motion.div
      className="flex items-center gap-4"
      initial={noMotion ? undefined : { opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={noMotion ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20, delay: 0.15 + index * 0.08 }}
    >
      <div
        className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: `${item.accent}14`, border: `1px solid ${item.accent}20` }}
      >
        <Icon size={20} strokeWidth={1.75} style={{ color: item.accent }} />
      </div>
      <div style={{ fontFamily: 'var(--font-heebo)' }}>
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-bold" style={{ color: '#303150' }}>{item.title}</span>
          <span className="text-[13px] font-black" style={{ color: item.accent }}>{item.value}</span>
        </div>
        <p className="text-[12px] leading-snug mt-0.5" style={{ color: '#7E7F90' }}>
          {item.desc}
        </p>
      </div>
    </motion.div>
  );
}

function BenefitsSection({ noMotion }: { noMotion: boolean }) {
  return (
    <section
      className="relative overflow-hidden py-24 md:py-36 px-4 sm:px-6"
      style={{ background: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}
      aria-label="הטבות"
    >
      {/* Soft radial accents on white */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 20%, rgba(13,186,204,0.04), transparent)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 50% at 20% 80%, rgba(105,173,255,0.04), transparent)' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

          {/* ── Right in RTL: Headline + CTA ── */}
          <div className="lg:w-1/2 text-center lg:text-start">
            {/* Pill */}
            <motion.div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
              style={{ background: 'rgba(13,186,204,0.06)', border: '1px solid rgba(13,186,204,0.12)' }}
              initial={noMotion ? undefined : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0DBACC' }} />
              <span className="text-[12px] font-bold" style={{ color: '#0DBACC' }}>
                שיתוף פעולה בלעדי
              </span>
            </motion.div>

            <motion.h2
              className="text-3xl sm:text-4xl md:text-[2.75rem] font-black mb-5 leading-[1.15]"
              style={{ color: '#303150' }}
              initial={noMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.06 }}
            >
              פתחו חשבון{' '}
              <span style={{ ...GRADIENT_STYLE }}>דרכנו</span>
            </motion.h2>

            <motion.p
              className="text-[15px] sm:text-base leading-relaxed mb-10 max-w-sm mx-auto lg:mx-0"
              style={{ color: '#7E7F90' }}
              initial={noMotion ? undefined : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.12 }}
            >
              הטבות בלעדיות שלא תמצאו בשום מקום אחר, רק למצטרפים דרך myNETO.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={noMotion ? undefined : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <motion.button
                onClick={() => handleCtaClick('funnel_benefits_cta')}
                className="relative inline-flex items-center gap-2.5 px-8 py-4 sm:px-10 rounded-xl text-base sm:text-lg font-bold text-white cursor-pointer overflow-hidden"
                style={{
                  background: '#69ADFF',
                  boxShadow: '0 4px 20px rgba(105,173,255,0.3)',
                }}
                whileHover={noMotion ? undefined : {
                  scale: 1.04,
                  y: -2,
                  boxShadow: '0 8px 32px rgba(105,173,255,0.4)',
                }}
                whileTap={noMotion ? undefined : { scale: 0.97 }}
              >
                <span
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
                    animation: 'ctaShimmer 4s ease-in-out infinite',
                  }}
                />
                <span className="relative z-10">לפתיחת חשבון מסחר</span>
                <ArrowLeft className="relative z-10 w-4 h-4" strokeWidth={2.5} />
              </motion.button>
            </motion.div>

            {/* Trust line */}
            <motion.div
              className="flex items-center gap-4 mt-8 justify-center lg:justify-start"
              initial={noMotion ? undefined : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} strokeWidth={2} style={{ color: '#BDBDCB' }} />
                <span className="text-[11px]" style={{ color: '#BDBDCB' }}>מאובטח ומפוקח</span>
              </div>
              <div style={{ width: 1, height: 12, background: '#E8E8ED' }} />
              <div className="flex items-center gap-1.5">
                <Clock size={14} strokeWidth={2} style={{ color: '#BDBDCB' }} />
                <span className="text-[11px]" style={{ color: '#BDBDCB' }}>3 דקות בלבד</span>
              </div>
            </motion.div>
          </div>

          {/* ── Left in RTL: Benefits card ── */}
          <div className="lg:w-1/2 w-full max-w-md mx-auto lg:mx-0">
            <motion.div
              className="rounded-3xl p-6 sm:p-8"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #F7F7F8',
              }}
              initial={noMotion ? undefined : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Hero: 0₪ fees */}
              <motion.div
                className="rounded-xl p-5 mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(13,186,204,0.06) 0%, rgba(105,173,255,0.04) 100%)',
                  border: '1px solid rgba(13,186,204,0.1)',
                }}
                initial={noMotion ? undefined : { opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-bold" style={{ color: '#7E7F90' }}>
                    דמי ניהול דרכנו
                  </span>
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(13,186,204,0.08)' }}
                  >
                    <Check size={10} strokeWidth={3} style={{ color: '#0DBACC' }} />
                    <span className="text-[10px] font-bold" style={{ color: '#0DBACC' }}>לכל החיים</span>
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <span
                    className="text-4xl sm:text-5xl font-black leading-none"
                    style={{ ...GRADIENT_STYLE }}
                  >
                    0₪
                  </span>
                  <div className="flex items-center gap-1.5 pb-1.5">
                    <span className="text-[13px] line-through" style={{ color: '#BDBDCB' }}>1.5%</span>
                    <span className="text-[11px]" style={{ color: '#BDBDCB' }}>בבנק</span>
                  </div>
                </div>
              </motion.div>

              {/* Benefits list */}
              <div className="space-y-5">
                {BENTO_BENEFITS.slice(1).map((item, i) => (
                  <BenefitRow key={item.title} item={item} index={i} noMotion={noMotion} />
                ))}
              </div>
            </motion.div>
          </div>

        </div>

        {/* Disclaimer */}
        <motion.p
          className="text-[11px] text-center mt-16 leading-relaxed"
          style={{ color: '#BDBDCB' }}
          initial={noMotion ? undefined : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          ההטבות בתוקף לפותחי חשבון דרך myNETO בלבד · אינו מהווה ייעוץ השקעות
        </motion.p>
      </div>

      {/* Bottom fade into FinalCTA (#F5F5F7) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #F5F5F7)' }}
      />
    </section>
  );
}

/* ── Section 6: Final CTA ──────────────────────────────── */

function FinalCTASection({ noMotion }: { noMotion: boolean }) {
  return (
    <section
      className="relative py-20 md:py-28 px-4 sm:px-6 text-center overflow-hidden"
      style={{ background: '#F5F5F7' }}
      aria-label="פתיחת חשבון"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(105,173,255,0.04), transparent 60%)' }}
      />

      <div className="relative z-10 max-w-lg mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl font-black mb-4"
          style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          מוכנים להתחיל?
        </motion.h2>
        <motion.p
          className="text-base mb-10"
          style={{ color: '#7E7F90', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          פתיחת חשבון לוקחת 3 דקות בלבד
        </motion.p>

        <motion.div
          initial={noMotion ? undefined : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.16 }}
        >
          <motion.button
            onClick={() => handleCtaClick('funnel_final_cta')}
            className="inline-flex items-center gap-2 px-8 py-3.5 sm:px-10 sm:py-4 rounded-xl text-base sm:text-lg font-bold text-white cursor-pointer"
            style={{
              background: '#69ADFF',
              fontFamily: 'var(--font-heebo)',
              boxShadow: '0 4px 20px rgba(105,173,255,0.3)',
            }}
            whileHover={noMotion ? undefined : { scale: 1.04, y: -2, boxShadow: '0 8px 32px rgba(105,173,255,0.4)' }}
            whileTap={noMotion ? undefined : { scale: 0.97 }}
          >
            <span>לפתיחת חשבון מסחר</span>
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          </motion.button>
        </motion.div>

        <p
          className="text-[11px] mt-8 leading-relaxed"
          style={{ color: '#BDBDCB', fontFamily: 'var(--font-heebo)' }}
        >
          ההטבות בתוקף לפותחי חשבון דרך myNETO בלבד · אינו מהווה ייעוץ השקעות
        </p>
      </div>
    </section>
  );
}

/* ── Section 7: Mini Footer ────────────────────────────── */

function MiniFooter() {
  return (
    <footer
      className="py-8 px-4 sm:px-6 text-center"
      style={{ background: '#F5F5F7', borderTop: '1px solid #F7F7F8' }}
    >
      <div className="flex items-center justify-center gap-0 mb-3">
        <PieChart className="w-5 h-5" style={{ color: '#2B4699' }} strokeWidth={3} />
        <span
          className="text-base font-black tracking-tight"
          style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}
        >
          NET
        </span>
      </div>
      <p
        className="text-[10px] max-w-md mx-auto leading-relaxed"
        style={{ color: '#BDBDCB', fontFamily: 'var(--font-heebo)' }}
      >
        האמור אינו מהווה ייעוץ השקעות או שיווק השקעות ואינו תחליף לייעוץ אישי.
        מערכת myNETO אינה בעלת רישיון ייעוץ השקעות. תשואות עבר אינן מעידות על תשואות עתידיות.
      </p>
    </footer>
  );
}

/* ── Main Component ────────────────────────────────────── */

export default function InvestFunnelPage() {
  const searchParams = useSearchParams();
  const prefersReduced = useReducedMotion();
  const noMotion = !!prefersReduced;

  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (hasTrackedRef.current) return;
    hasTrackedRef.current = true;

    const source = searchParams.get('utm_source') || searchParams.get('source') || undefined;
    const campaign = searchParams.get('utm_campaign') || undefined;

    onMixpanelReady(() => {
      trackMixpanelEvent('Funnel Page Viewed', {
        page: 'invest',
        ...(source && { utm_source: source }),
        ...(campaign && { utm_campaign: campaign }),
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <HeroSection noMotion={noMotion} />
      <WhyInvestSection noMotion={noMotion} />
      <VideoCourseSection noMotion={noMotion} />
      <BenefitsSection noMotion={noMotion} />
      <FinalCTASection noMotion={noMotion} />
      <MiniFooter />
    </>
  );
}
