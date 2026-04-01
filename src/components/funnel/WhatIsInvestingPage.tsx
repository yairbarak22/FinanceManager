'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, useReducedMotion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  PieChart,
  ArrowLeft,
  ChevronDown,
  ShieldCheck,
  BadgeCheck,
  Scale,
  Building2,
  Briefcase,
  Bot,
  BookOpen,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { trackCtaClickServer } from '@/lib/utils';

/* ── Constants ─────────────────────────────────────────── */

const PARTNER_URL =
  'https://digitalsolutions.as-invest.co.il/trade_OnBoarding/?utm_source=MyNeto&utm_medium=Link';

const GRADIENT_STYLE = {
  background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

const FONT = { fontFamily: 'var(--font-heebo)' };

function handleCtaClick(source: string) {
  trackCtaClickServer(source);
  window.open(PARTNER_URL, '_blank', 'noopener,noreferrer');
}

/* ── Shared animation ──────────────────────────────────── */

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' as const },
  transition: { duration: 0.6, delay },
});

/* ── Animated number counter ───────────────────────────── */

function AnimatedCounter({
  value,
  noMotion,
  prefix = '',
  suffix = '',
}: {
  value: number;
  noMotion: boolean;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
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
    const duration = 1200;
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

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString('he-IL')}
      {suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 1, Hero
   ═══════════════════════════════════════════════════════════ */

function HeroSection({ noMotion }: { noMotion: boolean }) {
  const { scrollY } = useScroll();
  const arrowOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section
      className="relative min-h-[85vh] flex items-center overflow-hidden"
      style={{ background: '#F5F5F7' }}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          width: '90vw',
          height: '90vh',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background:
            'radial-gradient(ellipse at center, rgba(43,70,153,0.05) 0%, rgba(13,186,204,0.02) 40%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center pt-28 pb-24">
        <motion.div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
          style={{
            background: 'rgba(43,70,153,0.06)',
            border: '1px solid rgba(43,70,153,0.1)',
          }}
          {...(noMotion ? {} : fadeUp(0))}
        >
          <BookOpen className="w-3.5 h-3.5" style={{ color: '#2B4699' }} strokeWidth={2} />
          <span className="text-[12px] font-bold" style={{ color: '#2B4699', ...FONT }}>
            5 דקות קריאה ששוות 300,000 ש״ח
          </span>
        </motion.div>

        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black leading-[1.08] mb-6"
          style={{ color: '#1D1D1F', letterSpacing: '-0.02em', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.1))}
        >
          מדריך מעשי{' '}
          <span style={GRADIENT_STYLE}>להשקעה חכמה</span>
        </motion.h1>

        <motion.p
          className="text-base sm:text-lg mb-6 max-w-lg mx-auto leading-relaxed"
          style={{ color: '#6E6E73', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.2))}
        >
          איך לעבור מחיסכון רדום בבנק להשקעה פסיבית שעובדת בשבילכם, בלי להבין
          בגרפים, בלי להמר, ובכשרות מלאה.
        </motion.p>

        <motion.p
          className="text-[11px]"
          style={{ color: '#BDBDCB', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.3))}
        >
          המידע להלן הינו חומר לקריאה בלבד ואינו מהווה ייעוץ פיננסי
        </motion.p>
      </div>

      {/* Animated scroll arrow */}
      {mounted && (
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-20"
          style={{ opacity: arrowOpacity }}
          initial={noMotion ? undefined : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <motion.div
            className="w-6 h-10 rounded-full flex justify-center pt-2"
            style={{ border: '2px solid rgba(0,0,0,0.12)' }}
          >
            <motion.div
              className="w-1 h-2.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.25)' }}
              animate={
                noMotion
                  ? undefined
                  : { y: [0, 6, 0], opacity: [0.6, 0.15, 0.6] }
              }
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
          <motion.div
            animate={noMotion ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown
              size={18}
              strokeWidth={2}
              style={{ color: 'rgba(0,0,0,0.18)' }}
            />
          </motion.div>
          <span
            className="text-[11px] font-semibold"
            style={{ color: 'rgba(0,0,0,0.18)', ...FONT }}
          >
            גללו למטה
          </span>
        </motion.div>
      )}

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.3) 40%, #FFFFFF 100%)',
        }}
      />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 2, Inflation Erosion vs Investment Growth
   ═══════════════════════════════════════════════════════════ */

const INITIAL = 100_000;
const INFLATION_RATE = 0.03;
const INVEST_RATE = 0.07;
const YEARS = 20;
const BANK_AFTER = Math.round(INITIAL / Math.pow(1 + INFLATION_RATE, YEARS)); // ~55,368
const INVEST_AFTER = Math.round(INITIAL * Math.pow(1 + INVEST_RATE, YEARS)); // ~386,968

export function InflationSection({ noMotion }: { noMotion: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const bankPct = BANK_AFTER / INVEST_AFTER;
  const investPct = 1;

  return (
    <section
      ref={ref}
      className="relative py-24 md:py-36 px-4 sm:px-6"
      style={{ background: '#FFFFFF' }}
    >
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 leading-[1.12] text-center"
          style={{ ...GRADIENT_STYLE, ...FONT }}
          {...(noMotion ? {} : fadeUp())}
        >
          הכסף שלכם מאבד ערך
        </motion.h2>
        <motion.p
          className="text-[15px] sm:text-base max-w-md mx-auto leading-relaxed mb-16 md:mb-24 text-center"
          style={{ color: '#7E7F90', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.08))}
        >
          מה קורה ל₪100,000 אחרי 20 שנה?
        </motion.p>

        {/* Two-column comparison visualization */}
        <div className="flex flex-col sm:flex-row items-end justify-center gap-8 sm:gap-16 md:gap-24">
          {/* Bank column */}
          <motion.div
            className="flex flex-col items-center"
            {...(noMotion ? {} : fadeUp(0.15))}
          >
            <motion.div
              className="text-2xl sm:text-3xl font-black tabular-nums mb-3"
              style={{ color: '#F18AB5', ...FONT }}
            >
              ₪<AnimatedCounter value={BANK_AFTER} noMotion={noMotion} />
            </motion.div>

            {/* Animated bar */}
            <div
              className="relative w-28 sm:w-36 rounded-t-2xl overflow-hidden"
              style={{ height: 280 }}
            >
              <div
                className="absolute inset-0 rounded-t-2xl"
                style={{ background: 'rgba(241,138,181,0.06)' }}
              />
              <motion.div
                className="absolute bottom-0 left-0 right-0 rounded-t-2xl"
                style={{
                  background:
                    'linear-gradient(to top, #F18AB5, rgba(241,138,181,0.5))',
                }}
                initial={{ height: 0 }}
                animate={isInView ? { height: `${bankPct * 100}%` } : undefined}
                transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.div
                className="absolute bottom-3 left-0 right-0 flex justify-center"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : undefined}
                transition={{ duration: 0.4, delay: 1.2 }}
              >
                <TrendingDown size={24} strokeWidth={2} style={{ color: '#FFFFFF' }} />
              </motion.div>
            </div>

            <div className="mt-4 text-center">
              <span
                className="text-[14px] font-bold block"
                style={{ color: '#303150', ...FONT }}
              >
                חיסכון בבנק
              </span>
              <span className="text-[12px] block mt-0.5" style={{ color: '#BDBDCB', ...FONT }}>
                כוח קנייה בפועל
              </span>
              <span
                className="text-[11px] font-bold block mt-1.5 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(241,138,181,0.08)', color: '#F18AB5', ...FONT }}
              >
                אינפלציה 3% שנתית
              </span>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="hidden sm:flex flex-col items-center gap-2 pb-20">
            <span
              className="text-[11px] font-bold"
              style={{ color: '#BDBDCB', ...FONT }}
            >
              VS
            </span>
            <div style={{ width: 1, height: 180, background: '#E8E8ED' }} />
          </div>

          {/* Investment column */}
          <motion.div
            className="flex flex-col items-center"
            {...(noMotion ? {} : fadeUp(0.25))}
          >
            <motion.div
              className="text-2xl sm:text-3xl font-black tabular-nums mb-3"
              style={{ color: '#0DBACC', ...FONT }}
            >
              ₪<AnimatedCounter value={INVEST_AFTER} noMotion={noMotion} />
            </motion.div>

            <div
              className="relative w-28 sm:w-36 rounded-t-2xl overflow-hidden"
              style={{ height: 280 }}
            >
              <div
                className="absolute inset-0 rounded-t-2xl"
                style={{ background: 'rgba(13,186,204,0.04)' }}
              />
              <motion.div
                className="absolute bottom-0 left-0 right-0 rounded-t-2xl"
                style={{
                  background:
                    'linear-gradient(to top, #0DBACC, rgba(43,70,153,0.7))',
                }}
                initial={{ height: 0 }}
                animate={isInView ? { height: `${investPct * 100}%` } : undefined}
                transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.div
                className="absolute bottom-3 left-0 right-0 flex justify-center"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : undefined}
                transition={{ duration: 0.4, delay: 1.4 }}
              >
                <TrendingUp size={24} strokeWidth={2} style={{ color: '#FFFFFF' }} />
              </motion.div>
            </div>

            <div className="mt-4 text-center">
              <span
                className="text-[14px] font-bold block"
                style={{ color: '#303150', ...FONT }}
              >
                השקעה פסיבית
              </span>
              <span className="text-[12px] block mt-0.5" style={{ color: '#BDBDCB', ...FONT }}>
                ערך ריאלי
              </span>
              <span
                className="text-[11px] font-bold block mt-1.5 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(13,186,204,0.08)', color: '#0DBACC', ...FONT }}
              >
                תשואה ממוצעת 7% שנתית
              </span>
            </div>
          </motion.div>
        </div>

        {/* Insight callout */}
        <motion.div
          className="max-w-md mx-auto mt-14 text-center"
          {...(noMotion ? {} : fadeUp(0.35))}
        >
          <p className="text-[14px] leading-relaxed" style={{ color: '#7E7F90', ...FONT }}>
            כשאתם קונים מניה של חברה, אתם רוכשים{' '}
            <strong style={{ color: '#303150' }}>בעלות חלקית בעסק אמיתי</strong>, עסק
            שמוכר מוצרים, מעסיק עובדים ומייצר רווחים. חיסכון שומר על הכסף. השקעה
            גורמת לכסף <strong style={{ color: '#0DBACC' }}>לעבוד</strong>.
          </p>
        </motion.div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(245,245,247,0.4) 50%, #F5F5F7 100%)',
        }}
      />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 3, Compound Interest Interactive Chart
   ═══════════════════════════════════════════════════════════ */

function computeGrowth(monthly: number, annualRate: number, years: number) {
  const monthlyRate = annualRate / 12;
  const pts: { year: number; deposited: number; actual: number }[] = [];
  for (let y = 0; y <= years; y++) {
    const months = y * 12;
    const deposited = monthly * months;
    const actual =
      monthly === 0 || monthlyRate === 0
        ? deposited
        : monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    pts.push({ year: y, deposited, actual: Math.round(actual) });
  }
  return pts;
}

const CHART_W = 460;
const CHART_H = 200;
const PAD_L = 0;
const PAD_R = 60;
const PAD_Y = 16;

function formatAxisVal(val: number): string {
  if (val >= 1_000_000) return `₪${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `₪${Math.round(val / 1000)}K`;
  return `₪${val}`;
}

function chartX(year: number, maxYear: number) {
  return PAD_L + (year / maxYear) * (CHART_W - PAD_L - PAD_R);
}

function chartY(val: number, maxVal: number) {
  return CHART_H - PAD_Y - (val / maxVal) * (CHART_H - 2 * PAD_Y);
}

function buildPath(
  points: { year: number; deposited: number; actual: number }[],
  key: 'deposited' | 'actual',
  maxVal: number,
  maxYear: number,
) {
  return points
    .map((p, i) => {
      const x = chartX(p.year, maxYear);
      const y = chartY(p[key], maxVal);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function buildArea(
  points: { year: number; deposited: number; actual: number }[],
  key: 'deposited' | 'actual',
  maxVal: number,
  maxYear: number,
) {
  const linePath = buildPath(points, key, maxVal, maxYear);
  const lastX = chartX(points[points.length - 1].year, maxYear);
  const firstX = chartX(0, maxYear);
  const bottom = CHART_H - PAD_Y;
  return `${linePath} L${lastX.toFixed(1)},${bottom} L${firstX},${bottom} Z`;
}

export function CompoundInterestSection({ noMotion }: { noMotion: boolean }) {
  const [monthly, setMonthly] = useState(2500);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  const points = useMemo(() => computeGrowth(monthly, 0.07, 20), [monthly]);
  const totalDeposited = points[points.length - 1].deposited;
  const totalValue = points[points.length - 1].actual;
  const profit = totalValue - totalDeposited;
  const maxVal = 2_800_000;

  const depositedLine = useMemo(
    () => buildPath(points, 'deposited', maxVal, 20),
    [points, maxVal],
  );
  const actualLine = useMemo(
    () => buildPath(points, 'actual', maxVal, 20),
    [points, maxVal],
  );
  const actualArea = useMemo(
    () => buildArea(points, 'actual', maxVal, 20),
    [points, maxVal],
  );
  const depositedArea = useMemo(
    () => buildArea(points, 'deposited', maxVal, 20),
    [points, maxVal],
  );

  const pct = ((monthly - 300) / (5000 - 300)) * 100;

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-36 px-4 sm:px-6 overflow-hidden"
      style={{ background: '#F5F5F7' }}
    >
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 leading-[1.12] text-center"
          style={{ ...GRADIENT_STYLE, ...FONT }}
          {...(noMotion ? {} : fadeUp())}
        >
          ריבית דריבית: הקסם
        </motion.h2>
        <motion.p
          className="text-[15px] sm:text-base max-w-md mx-auto leading-relaxed mb-14 md:mb-20 text-center"
          style={{ color: '#7E7F90', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.08))}
        >
          הרווחים מייצרים רווחים, ואפקט כדור השלג הופך כל חיסכון קטן לסכום משמעותי
        </motion.p>

        {/* Chart card */}
        <motion.div
          className="rounded-3xl p-5 sm:p-8"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #F7F7F8',
          }}
          {...(noMotion ? {} : fadeUp(0.15))}
        >
          {/* Slider */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium" style={{ color: '#7E7F90', ...FONT }}>
              הפקדה חודשית
            </span>
            <span
              className="text-[16px] font-black tabular-nums"
              style={{ color: '#303150', ...FONT }}
            >
              ₪{monthly.toLocaleString('he-IL')}
            </span>
          </div>
          <div className="relative w-full h-6 flex items-center mb-8">
            <div
              className="absolute inset-x-0 h-1 rounded-full"
              style={{ background: '#E8E8ED' }}
            />
            <div
              className="absolute h-1 rounded-full"
              style={{ background: '#0DBACC', width: `${pct}%`, right: 0 }}
            />
            <input
              type="range"
              min={300}
              max={5000}
              step={100}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="compound-slider absolute inset-0 w-full appearance-none bg-transparent cursor-pointer z-10"
              style={{ direction: 'rtl' }}
            />
          </div>

          {/* SVG Chart */}
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H + 22}`}
              className="w-full"
              style={{ height: 'clamp(200px, 32vw, 280px)' }}
            >
              <defs>
                <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0DBACC" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0DBACC" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="depositedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#69ADFF" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#69ADFF" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Grid lines + Y-axis labels */}
              {[0.25, 0.5, 0.75, 1].map((frac) => {
                const y = chartY(maxVal * frac, maxVal);
                const val = Math.round(maxVal * frac);
                return (
                  <g key={frac}>
                    <line
                      x1={PAD_L}
                      y1={y}
                      x2={CHART_W - PAD_R}
                      y2={y}
                      stroke="#F7F7F8"
                      strokeWidth="1"
                    />
                    <text
                      x={CHART_W - PAD_R + 35}
                      y={y + 3}
                      textAnchor="start"
                      fontSize="9"
                      fill="#BDBDCB"
                      style={FONT}
                    >
                      {formatAxisVal(val)}
                    </text>
                  </g>
                );
              })}

              {/* Areas */}
              <motion.path
                d={actualArea}
                fill="url(#actualFill)"
                initial={noMotion ? undefined : { opacity: 0 }}
                animate={isInView ? { opacity: 1 } : undefined}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
              <motion.path
                d={depositedArea}
                fill="url(#depositedFill)"
                initial={noMotion ? undefined : { opacity: 0 }}
                animate={isInView ? { opacity: 1 } : undefined}
                transition={{ duration: 0.8, delay: 0.5 }}
              />

              {/* Lines */}
              <motion.path
                d={actualLine}
                fill="none"
                stroke="#0DBACC"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={noMotion ? undefined : { pathLength: 0 }}
                animate={isInView ? { pathLength: 1 } : undefined}
                transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
              />
              <motion.path
                d={depositedLine}
                fill="none"
                stroke="#69ADFF"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
                initial={noMotion ? undefined : { pathLength: 0 }}
                animate={isInView ? { pathLength: 1 } : undefined}
                transition={{ duration: 1.5, delay: 0.4, ease: 'easeOut' }}
              />

              {/* Year labels */}
              {[0, 5, 10, 15, 20].map((yr) => {
                const x = chartX(yr, 20);
                return (
                  <text
                    key={yr}
                    x={x}
                    y={CHART_H + 14}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#BDBDCB"
                    style={FONT}
                  >
                    {yr}
                  </text>
                );
              })}
              <text
                x={chartX(20, 20) + 18}
                y={CHART_H + 14}
                fontSize="9"
                fill="#BDBDCB"
                style={FONT}
              >
                שנים
              </text>
            </svg>
          </div>

          {/* Legend + stats */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-1.5 rounded-full"
                  style={{ background: '#0DBACC' }}
                />
                <span className="text-[12px] font-medium" style={{ color: '#7E7F90', ...FONT }}>
                  ערך בפועל
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-0.5 rounded-full"
                  style={{ background: '#69ADFF', borderTop: '1px dashed #69ADFF' }}
                />
                <span className="text-[12px] font-medium" style={{ color: '#7E7F90', ...FONT }}>
                  סה״כ הפקדות
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-center">
                <span
                  className="text-[11px] block"
                  style={{ color: '#BDBDCB', ...FONT }}
                >
                  הפקדתם
                </span>
                <span
                  className="text-[15px] font-bold tabular-nums"
                  style={{ color: '#69ADFF', ...FONT }}
                >
                  ₪{totalDeposited.toLocaleString('he-IL')}
                </span>
              </div>
              <div style={{ width: 1, height: 24, background: '#E8E8ED' }} />
              <div className="text-center">
                <span
                  className="text-[11px] block"
                  style={{ color: '#BDBDCB', ...FONT }}
                >
                  יש לכם
                </span>
                <span
                  className="text-[15px] font-bold tabular-nums"
                  style={{ color: '#0DBACC', ...FONT }}
                >
                  ₪{totalValue.toLocaleString('he-IL')}
                </span>
              </div>
              <div style={{ width: 1, height: 24, background: '#E8E8ED' }} />
              <div className="text-center">
                <span
                  className="text-[11px] block"
                  style={{ color: '#BDBDCB', ...FONT }}
                >
                  רווח נקי
                </span>
                <span
                  className="text-[15px] font-black tabular-nums"
                  style={{ ...GRADIENT_STYLE, ...FONT }}
                >
                  ₪{profit.toLocaleString('he-IL')}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p
          className="text-[13px] leading-relaxed mt-8 text-center max-w-md mx-auto"
          style={{ color: '#7E7F90', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.3))}
        >
          הסוד? <strong style={{ color: '#303150' }}>זמן.</strong> ככל שמתחילים מוקדם
          יותר, אפקט ריבית הדריבית חזק יותר, וההפרש בין מה שהפקדתם למה שיש לכם
          גדל בצורה מעריכית.
        </motion.p>
      </div>

      {/* Slider custom styles */}
      <style jsx>{`
        .compound-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          margin-top: -9px;
          border-radius: 50%;
          background: #ffffff;
          border: 2.5px solid #0dbacc;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .compound-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 3px 12px rgba(13, 186, 204, 0.3);
        }
        .compound-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ffffff;
          border: 2.5px solid #0dbacc;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
          cursor: pointer;
        }
        .compound-slider::-webkit-slider-runnable-track {
          height: 4px;
          background: transparent;
        }
        .compound-slider::-moz-range-track {
          height: 4px;
          background: transparent;
        }
      `}</style>

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.4) 50%, #FFFFFF 100%)',
        }}
      />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 4, S&P 500 + Passive vs Active
   ═══════════════════════════════════════════════════════════ */

const SP_CRISES = [
  { year: 1945, label: 'סוף מלה"ע' },
  { year: 1973, label: 'משבר הנפט' },
  { year: 1987, label: 'יום שני השחור' },
  { year: 2000, label: 'בועת הדוטקום' },
  { year: 2008, label: 'המשבר הפיננסי' },
  { year: 2020, label: 'קורונה' },
];

const SP_DATA = [
  { year: 1930, value: 8 },
  { year: 1940, value: 10 },
  { year: 1945, value: 14 },
  { year: 1950, value: 20 },
  { year: 1960, value: 55 },
  { year: 1970, value: 80 },
  { year: 1973, value: 60 },
  { year: 1980, value: 120 },
  { year: 1987, value: 90 },
  { year: 1990, value: 160 },
  { year: 2000, value: 280 },
  { year: 2003, value: 140 },
  { year: 2007, value: 300 },
  { year: 2009, value: 150 },
  { year: 2015, value: 350 },
  { year: 2020, value: 260 },
  { year: 2021, value: 430 },
  { year: 2025, value: 520 },
];

const SP_W = 560;
const SP_H = 180;
const SP_MAX = 550;
const SP_MIN_YEAR = 1930;
const SP_MAX_YEAR = 2025;
const SP_PAD = 30;

function spX(year: number) {
  return SP_PAD + ((year - SP_MIN_YEAR) / (SP_MAX_YEAR - SP_MIN_YEAR)) * (SP_W - 2 * SP_PAD);
}
function spY(value: number) {
  return SP_H - (value / SP_MAX) * (SP_H - 20);
}

const SP_LINE = SP_DATA.map(
  (d, i) => `${i === 0 ? 'M' : 'L'}${spX(d.year).toFixed(1)},${spY(d.value).toFixed(1)}`,
).join(' ');

const SP_AREA = `${SP_LINE} L${spX(SP_DATA[SP_DATA.length - 1].year).toFixed(1)},${SP_H} L${spX(SP_DATA[0].year).toFixed(1)},${SP_H} Z`;

export function ProofSection({ noMotion }: { noMotion: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const ringRef = useRef(null);
  const ringInView = useInView(ringRef, { once: true, margin: '-40px' });

  return (
    <section
      ref={ref}
      className="relative py-24 md:py-36 px-4 sm:px-6"
      style={{ background: '#FFFFFF' }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 leading-[1.12] text-center"
          style={{ ...GRADIENT_STYLE, ...FONT }}
          {...(noMotion ? {} : fadeUp())}
        >
          למה זה עובד?
        </motion.h2>
        <motion.p
          className="text-[15px] sm:text-base max-w-lg mx-auto leading-relaxed mb-14 md:mb-20 text-center"
          style={{ color: '#7E7F90', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.08))}
        >
          90 שנה של הוכחה. מדד S&P 500 תמיד עלה למעלה
        </motion.p>

        {/* S&P Chart */}
        <motion.div
          className="rounded-3xl p-5 sm:p-8"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #F7F7F8',
          }}
          {...(noMotion ? {} : fadeUp(0.15))}
        >
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${SP_W} ${SP_H + 30}`}
              className="w-full"
              style={{ height: 'clamp(180px, 30vw, 260px)' }}
            >
              <defs>
                <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2B4699" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0DBACC" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="spLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2B4699" />
                  <stop offset="100%" stopColor="#0DBACC" />
                </linearGradient>
              </defs>

              {/* Grid */}
              {[0.25, 0.5, 0.75].map((f) => (
                <line
                  key={f}
                  x1={SP_PAD}
                  y1={SP_H - f * (SP_H - 20)}
                  x2={SP_W - SP_PAD}
                  y2={SP_H - f * (SP_H - 20)}
                  stroke="#F7F7F8"
                  strokeWidth="1"
                />
              ))}

              {/* Area */}
              <motion.path
                d={SP_AREA}
                fill="url(#spGrad)"
                initial={noMotion ? undefined : { opacity: 0 }}
                animate={isInView ? { opacity: 1 } : undefined}
                transition={{ duration: 1, delay: 0.4 }}
              />

              {/* Line */}
              <motion.path
                d={SP_LINE}
                fill="none"
                stroke="url(#spLineGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={noMotion ? undefined : { pathLength: 0 }}
                animate={isInView ? { pathLength: 1 } : undefined}
                transition={{ duration: 2.5, delay: 0.3, ease: 'easeOut' }}
              />
              {/* Crisis markers */}
              {SP_CRISES.map((crisis, i) => {
                const dataPoint = SP_DATA.find((d) => d.year === crisis.year);
                if (!dataPoint) return null;
                const cx = spX(crisis.year);
                const cy = spY(dataPoint.value);
                return (
                  <g key={crisis.year}>
                    <motion.circle
                      cx={cx}
                      cy={cy}
                      r="4"
                      fill="#FFFFFF"
                      stroke="#F18AB5"
                      strokeWidth="2"
                      initial={noMotion ? undefined : { scale: 0, opacity: 0 }}
                      animate={isInView ? { scale: 1, opacity: 1 } : undefined}
                      transition={{ duration: 0.3, delay: 1.0 + i * 0.15 }}
                    />
                    <motion.text
                      x={cx}
                      y={cy - 12}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill="#F18AB5"
                      direction="rtl"
                      style={FONT}
                      initial={noMotion ? undefined : { opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : undefined}
                      transition={{ duration: 0.3, delay: 1.1 + i * 0.15 }}
                    >
                      {crisis.label}
                    </motion.text>
                  </g>
                );
              })}

              {/* Year axis labels */}
              {[1930, 1950, 1970, 1990, 2010, 2025].map((yr) => (
                <text
                  key={yr}
                  x={spX(yr)}
                  y={SP_H + 20}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#BDBDCB"
                  style={FONT}
                >
                  {yr}
                </text>
              ))}
            </svg>
          </div>

          <div
            className="flex items-center justify-center gap-3 mt-4"
            style={{ ...FONT }}
          >
            <div className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: '#F18AB5' }}
              />
              <span className="text-[11px]" style={{ color: '#7E7F90' }}>
                משברים
              </span>
            </div>
            <span className="text-[11px]" style={{ color: '#BDBDCB' }}>·</span>
            <span className="text-[11px] font-bold" style={{ color: '#0DBACC' }}>
              המדד תמיד תיקן את עצמו ועלה למעלה
            </span>
          </div>
        </motion.div>

        {/* Passive vs Active, 92% ring */}
        <div
          ref={ringRef}
          className="flex flex-col md:flex-row items-center gap-10 md:gap-16 mt-16 md:mt-24"
        >
          <motion.div
            className="flex-shrink-0"
            {...(noMotion ? {} : fadeUp(0.1))}
          >
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="65"
                fill="none"
                stroke="#F7F7F8"
                strokeWidth="8"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="65"
                fill="none"
                stroke="#F18AB5"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${0.92 * 408.4} ${408.4}`}
                transform="rotate(-90 80 80)"
                initial={
                  noMotion ? undefined : { strokeDasharray: `0 ${408.4}` }
                }
                animate={
                  ringInView
                    ? { strokeDasharray: `${0.92 * 408.4} ${408.4}` }
                    : undefined
                }
                transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
              />
              <text
                x="80"
                y="75"
                textAnchor="middle"
                fontSize="36"
                fontWeight="900"
                fill="#303150"
                style={FONT}
              >
                92%
              </text>
              <text
                x="80"
                y="95"
                textAnchor="middle"
                fontSize="10"
                fill="#7E7F90"
                style={FONT}
              >
                מפסידים למדד
              </text>
            </svg>
          </motion.div>

          <motion.div {...(noMotion ? {} : fadeUp(0.2))}>
            <h3
              className="text-xl sm:text-2xl font-black mb-3"
              style={{ color: '#303150', ...FONT }}
            >
              למה לא לנסות לנצח את השוק?
            </h3>
            <p
              className="text-[14px] leading-relaxed mb-3"
              style={{ color: '#7E7F90', ...FONT }}
            >
              92% מהמנהלים המקצועיים, אנליסטים, אלגוריתמים, צוותי מחקר עם
              מיליארדים, לא מצליחים להכות את מדד S&P 500 לאורך 15 שנה.
            </p>
            <p
              className="text-[14px] leading-relaxed"
              style={{ color: '#7E7F90', ...FONT }}
            >
              במקום לנחש, אנחנו{' '}
              <strong style={{ color: '#303150' }}>
                קונים את כל 500 החברות הגדולות בעולם
              </strong>
              , מגדירים הוראת קבע חודשית, ושוכחים מזה. בלי מסכים, בלי דופק.
              הכסף עובד לבד.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {['Google', 'Amazon', 'Apple', 'Microsoft'].map((name) => (
                <span
                  key={name}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
                  style={{
                    background: 'rgba(0,0,0,0.03)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    color: '#7E7F90',
                    ...FONT,
                  }}
                >
                  {name}
                </span>
              ))}
              <span
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
                style={{ color: '#0DBACC', ...FONT }}
              >
                +496 נוספות
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(245,245,247,0.4) 50%, #F5F5F7 100%)',
        }}
      />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 5, Kashrut
   ═══════════════════════════════════════════════════════════ */

export function KashrutSection({ noMotion }: { noMotion: boolean }) {
  return (
    <section
      className="relative py-24 md:py-36 px-4 sm:px-6"
      style={{ background: '#F5F5F7' }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 leading-[1.12]"
          style={{ ...GRADIENT_STYLE, ...FONT }}
          {...(noMotion ? {} : fadeUp())}
        >
          כשר למהדרין
        </motion.h2>
        <motion.p
          className="text-[15px] sm:text-base max-w-md mx-auto leading-relaxed mb-14 md:mb-20"
          style={{ color: '#7E7F90', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.08))}
        >
          השקעה פסיבית במדד = בעלות בעסקים, לא הלוואה בריבית
        </motion.p>

        <div className="space-y-5 text-start max-w-2xl mx-auto">
          {[
            {
              num: '01',
              title: 'בעלות חלקית בעסק',
              body: 'כשאתם קונים מניה, אתם שותפים בעסק אמיתי. הרווח מגיע מצמיחת ערך העסק, לא מריבית.',
            },
            {
              num: '02',
              title: 'היתר עסקה למהדרין',
              body: 'קרנות הסל הישראליות (הראל, קסם, תכלית, מגדל) פועלות תחת היתר עסקה, שותפות עסקית ולא הלוואה.',
            },
            {
              num: '03',
              title: 'פיקוח רגולטורי ורבני',
              body: 'הקרנות מפוקחות הלכתית וגם רגולטורית על ידי רשות ני"ע. ודאו שהקרן מחזיקה בהיתר עסקה בתוקף.',
            },
            {
              num: '04',
              title: 'זו לא הימורים',
              body: 'מסחר יומי = ניחוש. השקעה פסיבית = בעלות על 500 חברות אמיתיות שמייצרות ערך כלכלי.',
            },
          ].map((item, i) => (
            <motion.div
              key={item.num}
              className="flex items-start gap-4 rounded-2xl p-5 sm:p-6"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #F7F7F8',
              }}
              {...(noMotion ? {} : fadeUp(0.1 + i * 0.07))}
            >
              <span
                className="text-[22px] font-black shrink-0 mt-0.5"
                style={{ color: '#E8E8ED', ...FONT }}
              >
                {item.num}
              </span>
              <div>
                <h3
                  className="text-[15px] font-bold mb-1"
                  style={{ color: '#303150', ...FONT }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: '#7E7F90', ...FONT }}
                >
                  {item.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mt-10"
          {...(noMotion ? {} : fadeUp(0.35))}
        >
          {[
            { icon: BadgeCheck, label: 'היתר עסקה מהודר' },
            { icon: Scale, label: 'פיקוח רבני' },
            { icon: ShieldCheck, label: 'רשות ני"ע' },
          ].map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{
                  background: 'rgba(43,70,153,0.04)',
                  border: '1px solid rgba(43,70,153,0.08)',
                }}
              >
                <Icon size={14} strokeWidth={1.75} style={{ color: '#2B4699' }} />
                <span
                  className="text-[11px] font-bold"
                  style={{ color: '#2B4699', ...FONT }}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.4) 50%, #FFFFFF 100%)',
        }}
      />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 6, 3 Steps (Visual Timeline)
   ═══════════════════════════════════════════════════════════ */

const STEPS = [
  {
    icon: Building2,
    accent: '#0DBACC',
    title: 'פותחים חשבון בבית השקעות',
    body: 'לא דרך הבנק. פותחים חשבון בבית השקעות ישראלי מפוקח. הכסף על שמכם, בטוח לגמרי.',
  },
  {
    icon: Briefcase,
    accent: '#69ADFF',
    title: 'בוחרים קרן מחקה מדד',
    body: 'חשבון מסחר עצמאי, פטור מעמלות. אפילו 300 ש"ח בחודש. ניהול עצמאי, בלי יועץ.',
  },
  {
    icon: Bot,
    accent: '#2B4699',
    title: 'מגדירים אוטומט וזהו',
    body: 'הוראה אחת לקנות את המדד כל חודש. לא נוגעים. לא בודקים. הכסף עובד לבד.',
  },
];

export function PracticeSection({ noMotion }: { noMotion: boolean }) {
  return (
    <section
      className="relative py-24 md:py-36 px-4 sm:px-6"
      style={{ background: '#FFFFFF' }}
    >
      <div className="max-w-3xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 leading-[1.12] text-center"
          style={{ ...GRADIENT_STYLE, ...FONT }}
          {...(noMotion ? {} : fadeUp())}
        >
          3 צעדים וזהו
        </motion.h2>
        <motion.p
          className="text-[15px] sm:text-base max-w-md mx-auto leading-relaxed mb-14 md:mb-20 text-center"
          style={{ color: '#7E7F90', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.08))}
        >
          מכאן הכל עובד לבד
        </motion.p>

        {/* Steps timeline */}
        <div className="relative">
          {/* Vertical connector line */}
          <div
            className="absolute top-6 right-[23px] sm:right-[27px] w-px hidden sm:block"
            style={{
              height: 'calc(100% - 3rem)',
              background:
                'linear-gradient(to bottom, #0DBACC, #69ADFF, #2B4699)',
              opacity: 0.2,
            }}
          />

          <div className="space-y-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  className="flex items-start gap-5"
                  {...(noMotion ? {} : fadeUp(0.1 + i * 0.1))}
                >
                  {/* Step circle */}
                  <div className="shrink-0 relative z-10">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: `${step.accent}14`,
                        border: `2px solid ${step.accent}30`,
                      }}
                    >
                      <Icon
                        size={22}
                        strokeWidth={1.75}
                        style={{ color: step.accent }}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-1 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[11px] font-black px-2 py-0.5 rounded-md"
                        style={{
                          background: `${step.accent}10`,
                          color: step.accent,
                          ...FONT,
                        }}
                      >
                        צעד {i + 1}
                      </span>
                    </div>
                    <h3
                      className="text-[16px] font-bold mb-1"
                      style={{ color: '#303150', ...FONT }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-[13px] leading-relaxed"
                      style={{ color: '#7E7F90', ...FONT }}
                    >
                      {step.body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(245,245,247,0.4) 50%, #F5F5F7 100%)',
        }}
      />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 7, CTA (single, final)
   ═══════════════════════════════════════════════════════════ */

export function CtaSection({ noMotion }: { noMotion: boolean }) {
  return (
    <section
      className="relative py-24 md:py-36 px-4 sm:px-6 text-center overflow-hidden"
      style={{ background: '#F5F5F7' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(43,70,153,0.04), transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl font-black mb-4"
          style={{ color: '#303150', ...FONT }}
          {...(noMotion ? {} : fadeUp())}
        >
          מוכנים להתחיל?
        </motion.h2>
        <motion.p
          className="text-[14px] mb-5 max-w-md mx-auto leading-relaxed"
          style={{ color: '#7E7F90', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.08))}
        >
          הכנו קורס וידאו קצר שייקח אותך יד ביד. מפתיחת חשבון ועד ההשקעה
          הראשונה
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          {...(noMotion ? {} : fadeUp(0.16))}
        >
          <motion.a
            href="/invest"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white text-[15px] font-bold cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
              boxShadow: '0 4px 24px rgba(43,70,153,0.3)',
              ...FONT,
            }}
            whileHover={
              noMotion
                ? undefined
                : { scale: 1.04, boxShadow: '0 8px 32px rgba(43,70,153,0.4)' }
            }
            whileTap={noMotion ? undefined : { scale: 0.97 }}
          >
            <span>לצפייה בקורס הוידאו</span>
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          </motion.a>

          <motion.button
            onClick={() => handleCtaClick('guide_final_cta')}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-bold cursor-pointer"
            style={{
              background: '#69ADFF',
              color: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(105,173,255,0.3)',
              ...FONT,
            }}
            whileHover={
              noMotion
                ? undefined
                : { scale: 1.04, boxShadow: '0 8px 32px rgba(105,173,255,0.4)' }
            }
            whileTap={noMotion ? undefined : { scale: 0.97 }}
          >
            <span>פתיחת חשבון מסחר</span>
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          </motion.button>
        </motion.div>

        <motion.p
          className="text-[11px] mt-8 leading-relaxed"
          style={{ color: '#BDBDCB', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.24))}
        >
          המידע הוא לצורכי לימוד בלבד ואינו מהווה ייעוץ פיננסי, ייעוץ מס או
          המלצת השקעה. תשואות עבר אינן מעידות על תשואות עתידיות.
        </motion.p>
      </div>
    </section>
  );
}

/* ── Footer ────────────────────────────────────────────── */

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
          style={{ color: '#303150', ...FONT }}
        >
          NET
        </span>
      </div>
      <p
        className="text-[10px] max-w-md mx-auto leading-relaxed"
        style={{ color: '#BDBDCB', ...FONT }}
      >
        האמור אינו מהווה ייעוץ השקעות או שיווק השקעות ואינו תחליף לייעוץ אישי.
        מערכת MyNeto אינה בעלת רישיון ייעוץ השקעות. תשואות עבר אינן מעידות על
        תשואות עתידיות.
      </p>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Export
   ═══════════════════════════════════════════════════════════ */

export default function WhatIsInvestingPage() {
  const prefersReduced = useReducedMotion();
  const noMotion = !!prefersReduced;

  return (
    <>
      <HeroSection noMotion={noMotion} />
      <InflationSection noMotion={noMotion} />
      <CompoundInterestSection noMotion={noMotion} />
      <ProofSection noMotion={noMotion} />
      <KashrutSection noMotion={noMotion} />
      <PracticeSection noMotion={noMotion} />
      <CtaSection noMotion={noMotion} />
      <MiniFooter />
    </>
  );
}
