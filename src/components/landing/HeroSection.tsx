'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { signIn } from 'next-auth/react';

interface HeroSectionProps {
  callbackUrl: string;
  onOpenLegal: (type: 'terms' | 'privacy') => void;
}

/* ── Spring presets ────────────────────────────────────── */
const springBouncy = { type: 'spring' as const, stiffness: 120, damping: 20 };
const springSnappy = { type: 'spring' as const, stiffness: 200, damping: 22 };
const springPaper  = { type: 'spring' as const, stiffness: 60, damping: 14 };

/* ── Scattered document positions ────────────────────── */
/* Each document: absolute position, rotation, z-index, size, drift animation */
const documents = [
  {
    id: 'statement',
    x: '8%', y: '12%', rotate: -6, z: 6, w: 220, h: 160,
    drift: { y: [0, -6, 0, 4, 0], rotate: [-6, -4.5, -6, -7, -6], duration: 7.2, delay: 0 },
  },
  {
    id: 'receipt',
    x: '52%', y: '2%', rotate: 4, z: 5, w: 170, h: 200,
    drift: { y: [0, 5, 0, -7, 0], rotate: [4, 5.5, 4, 2.5, 4], duration: 8.1, delay: 0.6 },
  },
  {
    id: 'chart',
    x: '22%', y: '42%', rotate: -2, z: 8, w: 240, h: 170,
    drift: { y: [0, -8, 0, 5, 0], rotate: [-2, -0.5, -2, -3.5, -2], duration: 6.8, delay: 1.2 },
  },
  {
    id: 'budget',
    x: '58%', y: '38%', rotate: 7, z: 7, w: 190, h: 140,
    drift: { y: [0, 6, 0, -5, 0], rotate: [7, 8.5, 7, 5.5, 7], duration: 7.5, delay: 0.3 },
  },
  {
    id: 'savings',
    x: '2%', y: '60%', rotate: 3, z: 4, w: 180, h: 130,
    drift: { y: [0, -5, 0, 7, 0], rotate: [3, 4, 3, 1.5, 3], duration: 8.5, delay: 1.8 },
  },
  {
    id: 'alert',
    x: '48%', y: '65%', rotate: -8, z: 9, w: 200, h: 120,
    drift: { y: [0, 7, 0, -4, 0], rotate: [-8, -6, -8, -9.5, -8], duration: 6.5, delay: 0.9 },
  },
];

/* ── Mini sparkline path ─────────────────────────────── */
const sparklinePath = 'M0,28 L8,24 L16,26 L24,18 L32,20 L40,12 L48,14 L56,6 L64,8 L72,2';
const sparklineDown = 'M0,4 L8,8 L16,6 L24,14 L32,12 L40,20 L48,18 L56,26 L64,24 L72,28';

/* ── Google SVG ────────────────────────────────────────── */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/* ── Document card renderers ─────────────────────────── */
/* Each renders a unique "financial document" feel */

function BankStatement() {
  return (
    <div className="h-full flex flex-col p-4 gap-2" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold" style={{ color: '#86868B' }}>דף חשבון — ינואר 2026</span>
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: '#2B469910' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2B4699" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l4-4 4 4M7 5v14"/><path d="M21 15l-4 4-4-4m4 4V5"/></svg>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {[
          { label: 'שכר', amount: '+₪14,200', positive: true },
          { label: 'שכ"ד', amount: '-₪4,500', positive: false },
          { label: 'סופר', amount: '-₪1,820', positive: false },
          { label: 'חשמל', amount: '-₪340', positive: false },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: '#6E6E73' }}>{row.label}</span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: row.positive ? '#22C55E' : '#F18AB5' }}>
              {row.amount}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t pt-1.5" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold" style={{ color: '#1D1D1F' }}>יתרה</span>
          <span className="text-[13px] font-black tabular-nums" style={{ color: '#1D1D1F' }}>₪7,540</span>
        </div>
      </div>
    </div>
  );
}

function ReceiptCard() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 gap-2" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F18AB510' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F18AB5" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
      </div>
      <span className="text-[10px]" style={{ color: '#86868B' }}>קניות — 12.01</span>
      <span className="text-2xl font-black tabular-nums" style={{ color: '#1D1D1F' }}>₪347</span>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#F18AB5' }} />
        <span className="text-[9px]" style={{ color: '#F18AB5' }}>מעל התקציב</span>
      </div>
      {/* Dashed tear line at bottom */}
      <div className="w-full mt-auto" style={{ borderTop: '1.5px dashed rgba(0,0,0,0.08)' }} />
      <div className="flex items-center gap-3 w-full">
        {[1,2,3].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: 'rgba(0,0,0,0.04)' }} />
        ))}
      </div>
    </div>
  );
}

function ChartCard() {
  return (
    <div className="h-full flex flex-col p-4" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold" style={{ color: '#86868B' }}>מגמת חיסכון</span>
        <span className="text-[11px] font-black" style={{ color: '#22C55E' }}>+12.4%</span>
      </div>
      <div className="flex-1 flex items-end gap-[3px] pb-2">
        {[35, 42, 38, 55, 48, 62, 58, 72, 68, 80, 75, 88].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{
              height: `${h}%`,
              background: i >= 10
                ? 'linear-gradient(to top, #0DBACC, #2B4699)'
                : i >= 8
                  ? 'rgba(13,186,204,0.4)'
                  : 'rgba(0,0,0,0.06)',
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.8 + i * 0.06, duration: 0.4, ease: 'easeOut' }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px]" style={{ color: '#86868B' }}>ינו׳</span>
        <span className="text-[9px]" style={{ color: '#86868B' }}>דצמ׳</span>
      </div>
    </div>
  );
}

function BudgetNote() {
  return (
    <div className="h-full flex flex-col p-4 gap-2.5" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#9F7FE010' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9F7FE0" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
        <span className="text-[11px] font-bold" style={{ color: '#1D1D1F' }}>תקציב חודשי</span>
      </div>
      {[
        { cat: 'מזון', pct: 72, color: '#0DBACC' },
        { cat: 'תחבורה', pct: 45, color: '#2B4699' },
        { cat: 'בילויים', pct: 91, color: '#F18AB5' },
      ].map((item) => (
        <div key={item.cat} className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px]" style={{ color: '#6E6E73' }}>{item.cat}</span>
            <span className="text-[9px] font-bold tabular-nums" style={{ color: item.pct > 85 ? '#F18AB5' : '#6E6E73' }}>{item.pct}%</span>
          </div>
          <div className="h-1.5 rounded-full w-full" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: item.color, width: `${item.pct}%` }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1 + Math.random() * 0.3, duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SavingsGoal() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-3 gap-1.5" style={{ fontFamily: 'var(--font-heebo)' }}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="4" />
        <motion.circle
          cx="26" cy="26" r="22"
          fill="none" stroke="#0DBACC" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${0.67 * 138.2} ${138.2}`}
          transform="rotate(-90 26 26)"
          initial={{ strokeDasharray: '0 138.2' }}
          animate={{ strokeDasharray: `${0.67 * 138.2} ${138.2}` }}
          transition={{ delay: 0.9, duration: 1.2, ease: 'easeOut' }}
        />
        <text x="26" y="28" textAnchor="middle" fontSize="12" fontWeight="900" fill="#1D1D1F" style={{ fontFamily: 'var(--font-heebo)' }}>67%</text>
      </svg>
      <span className="text-[10px] font-bold" style={{ color: '#1D1D1F' }}>קרן חירום</span>
      <span className="text-[9px]" style={{ color: '#86868B' }}>₪20K / ₪30K</span>
    </div>
  );
}

function AlertCard() {
  return (
    <div className="h-full flex flex-col p-4 gap-2" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: '#F18AB512' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F18AB5" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <span className="text-[10px] font-bold" style={{ color: '#F18AB5' }}>חריגה מתקציב</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: '#6E6E73' }}>הוצאות השבוע</span>
        <span className="text-[13px] font-black tabular-nums" style={{ color: '#1D1D1F' }}>₪2,340</span>
      </div>
      {/* Mini sparkline */}
      <svg width="100%" height="28" viewBox="0 0 72 30" preserveAspectRatio="none" className="mt-auto">
        <motion.path
          d={sparklineDown}
          fill="none" stroke="#F18AB5" strokeWidth="2" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1.1, duration: 1, ease: 'easeOut' }}
        />
      </svg>
    </div>
  );
}

const cardRenderers: Record<string, React.FC> = {
  statement: BankStatement,
  receipt: ReceiptCard,
  chart: ChartCard,
  budget: BudgetNote,
  savings: SavingsGoal,
  alert: AlertCard,
};

/* ── Main Hero ─────────────────────────────────────────── */
export default function HeroSection({ callbackUrl, onOpenLegal }: HeroSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const scrollIndicatorOpacity = useTransform(scrollY, [0, 150], [1, 0]);
  const noMotion = !!shouldReduceMotion;

  useEffect(() => { setMounted(true); }, []);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: '#F5F5F7' }}
    >
      {/* Subtle radial glow */}
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

      {/* Main content — split layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8 xl:gap-16">

          {/* ── Text side (right in RTL) ── */}
          <div className="lg:w-1/2 text-center lg:text-start">
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.75rem] xl:text-[4.25rem] font-black leading-[1.1] mb-6"
              style={{
                color: '#1D1D1F',
                fontFamily: 'var(--font-heebo)',
                letterSpacing: '-0.02em',
              }}
              initial={noMotion ? undefined : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={noMotion ? { duration: 0 } : { duration: 0.7, delay: 0.1 }}
            >
              <>
תדאג לעתיד,                 <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #2B4699 0%, #0DBACC 50%, #2B4699 100%)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
של המשפחה שלך                </span>
              </>
            </motion.h1>

            <motion.p
              className="text-base sm:text-lg md:text-xl mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed"
              style={{ color: '#6E6E73', fontFamily: 'var(--font-heebo)', fontWeight: 400 }}
              initial={noMotion ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={noMotion ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
            >
              ממפים הכנסות והוצאות, מגדירים יעדים, ומקבלים תכנית חודשית ברורה לחיסכון והשקעה.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={noMotion ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={noMotion ? { duration: 0 } : { ...springBouncy, delay: 0.35 }}
            >
              <motion.button
                onClick={() => signIn('google', { callbackUrl })}
                className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 md:px-10 md:py-4.5 rounded-2xl text-white text-base sm:text-lg font-bold cursor-pointer"
                style={{
                  backgroundColor: '#1D1D1F',
                  fontFamily: 'var(--font-heebo)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}
                whileHover={noMotion ? undefined : {
                  scale: 1.04,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                  y: -3,
                }}
                whileTap={noMotion ? undefined : { scale: 0.98 }}
                transition={springSnappy}
              >
                <span>התחברות עם Google - בחינם</span>
                <GoogleIcon className="w-5 h-5 flex-shrink-0" />
              </motion.button>

              {/* Legal */}
              <p
                className="mt-4 text-xs leading-relaxed text-center lg:text-start"
                style={{ color: '#86868B', fontFamily: 'var(--font-heebo)' }}
              >
                בלחיצה על הכפתור, את/ה מאשר/ת את{' '}
                <span
                  onClick={() => onOpenLegal('terms')}
                  className="underline cursor-pointer hover:text-[#1D1D1F] transition-colors"
                >
                  תנאי השימוש
                </span>
                {' '}ו
                <span
                  onClick={() => onOpenLegal('privacy')}
                  className="underline cursor-pointer hover:text-[#1D1D1F] transition-colors"
                >
                  מדיניות הפרטיות
                </span>
                {' '}שלנו.
              </p>

              {/* Trust */}
              <div className="mt-3 flex items-center justify-center lg:justify-start gap-1.5">
               
                
              </div>
            </motion.div>
          </div>

          {/* ── Scattered documents pile (left in RTL) ── */}
          <div className="lg:w-1/2 w-full">
            {/* Desktop: absolute positioned overlapping pile */}
            <div className="hidden lg:block">
              <div className="relative mx-auto" style={{ width: '100%', maxWidth: 520, height: 440 }}>
                {mounted && documents.map((doc, i) => {
                  const Renderer = cardRenderers[doc.id];
                  return (
                    <motion.div
                      key={doc.id}
                      className="absolute"
                      style={{
                        left: doc.x,
                        top: doc.y,
                        width: doc.w,
                        height: doc.h,
                        zIndex: doc.z,
                      }}
                      initial={noMotion ? undefined : {
                        opacity: 0,
                        scale: 0.6,
                        rotate: doc.rotate + (i % 2 === 0 ? -15 : 15),
                        y: -60,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        rotate: doc.rotate,
                        y: 0,
                      }}
                      transition={noMotion ? { duration: 0 } : {
                        ...springPaper,
                        delay: 0.15 + i * 0.12,
                      }}
                    >
                      {/* Continuous gentle drift */}
                      <motion.div
                        animate={noMotion ? undefined : {
                          y: doc.drift.y,
                          rotate: doc.drift.rotate,
                        }}
                        transition={noMotion ? undefined : {
                          duration: doc.drift.duration,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: doc.drift.delay,
                        }}
                      >
                        <div
                          className="rounded-2xl overflow-hidden"
                          style={{
                            width: doc.w,
                            height: doc.h,
                            background: 'rgba(255,255,255,0.82)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            border: '1px solid rgba(255,255,255,0.95)',
                            boxShadow: `
                              0 ${4 + doc.z}px ${16 + doc.z * 4}px rgba(0,0,0,${0.04 + doc.z * 0.008}),
                              0 1px 3px rgba(0,0,0,0.03)
                            `,
                          }}
                        >
                          <Renderer />
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Mobile: cascading stack (2 visible + peek of others) */}
            <div className="lg:hidden flex justify-center px-4">
              <div className="relative w-full max-w-[300px]" style={{ aspectRatio: '300/290' }}>
                {mounted && documents.slice(0, 4).map((doc, i) => {
                  const Renderer = cardRenderers[doc.id];
                  const mobilePositions = [
                    { x: '3%', y: '5%', rotate: -4, z: 4 },
                    { x: '33%', y: '0%', rotate: 5,  z: 3 },
                    { x: '10%', y: '45%', rotate: -2, z: 6 },
                    { x: '38%', y: '52%', rotate: 6,  z: 5 },
                  ];
                  const pos = mobilePositions[i];
                  return (
                    <motion.div
                      key={doc.id}
                      className="absolute"
                      style={{
                        left: pos.x,
                        top: pos.y,
                        width: '58%',
                        zIndex: pos.z,
                      }}
                      initial={noMotion ? undefined : {
                        opacity: 0,
                        scale: 0.6,
                        rotate: pos.rotate + 10,
                        y: -40,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        rotate: pos.rotate,
                        y: 0,
                      }}
                      transition={noMotion ? { duration: 0 } : {
                        ...springPaper,
                        delay: 0.2 + i * 0.15,
                      }}
                    >
                      <motion.div
                        animate={noMotion ? undefined : {
                          y: [0, -4, 0, 3, 0],
                          rotate: [pos.rotate, pos.rotate + 1, pos.rotate, pos.rotate - 1, pos.rotate],
                        }}
                        transition={noMotion ? undefined : {
                          duration: 6 + i,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: i * 0.5,
                        }}
                      >
                        <div
                          className="rounded-xl overflow-hidden"
                          style={{
                            width: '100%',
                            aspectRatio: '180/140',
                            background: 'rgba(255,255,255,0.82)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.95)',
                            boxShadow: '0 6px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03)',
                          }}
                        >
                          <Renderer />
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      {mounted && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1 pointer-events-none z-20"
          style={{ opacity: scrollIndicatorOpacity }}
          initial={noMotion ? undefined : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <motion.div
            className="w-6 h-10 rounded-full flex justify-center pt-2"
            style={{ border: '2px solid rgba(29,29,31,0.15)' }}
            animate={noMotion ? undefined : { y: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              className="w-1 h-2.5 rounded-full"
              style={{ background: '#1D1D1F' }}
              animate={noMotion ? undefined : {
                y: [0, 6, 0],
                opacity: [0.6, 0.15, 0.6],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
          <span
            className="text-[11px] font-semibold mt-1"
            style={{ color: 'rgba(29,29,31,0.3)', fontFamily: 'var(--font-heebo)' }}
          >
            גללו למטה
          </span>
        </motion.div>
      )}

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #F5F5F7, transparent)' }}
      />
    </section>
  );
}
