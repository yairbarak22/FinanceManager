'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  Layers, Target, Briefcase, Wallet, Home, CreditCard, Brain,
  PiggyBank, Sparkles, ArrowLeft,
} from 'lucide-react';

/* ── Spring presets ────────────────────────────────────── */
const springBouncy = { type: 'spring' as const, stiffness: 120, damping: 20 };

/* ── Divider color ────────────────────────────────────── */
const DIVIDER = 'rgba(0,0,0,0.08)';

/* ══════════════════════════════════════════════════════════
   Mockup 1 — Financial Map: Rows with scanning effect
   ══════════════════════════════════════════════════════════ */
function FinancialMapMockup({ settled, noMotion }: { settled: boolean; noMotion: boolean }) {
  const rows = [
    { icon: Wallet, label: 'חיסכונות והשקעות', amount: '₪427,000', pct: 78, color: '#0DBACC' },
    { icon: Home, label: 'נדל״ן', amount: '₪1,200,000', pct: 95, color: '#2B4699' },
    { icon: CreditCard, label: 'התחייבויות', amount: '₪725,000', pct: 62, color: '#F18AB5' },
    { icon: Brain, label: 'הוצאות חודשיות', amount: '₪12,300', pct: 45, color: '#86868B' },
  ];

  return (
    <div className="relative max-w-sm">
      {/* Scanning line */}
      {!noMotion && settled && (
        <motion.div
          className="absolute inset-x-0 h-[1.5px] z-10 pointer-events-none rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #0DBACC60 30%, #0DBACC 50%, #0DBACC60 70%, transparent 100%)',
            boxShadow: '0 0 12px #0DBACC40',
          }}
          animate={{ top: ['-4px', 'calc(100% + 4px)'] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
        />
      )}

      <div className="space-y-3">
        {rows.map((row, i) => {
          const Icon = row.icon;
          return (
            <motion.div
              key={i}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={settled ? { opacity: 1, x: 0 } : undefined}
              transition={{ ...springBouncy, delay: 0.1 * i }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${row.color}0D` }}
              >
                <Icon className="w-4 h-4" style={{ color: row.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-bold truncate" style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}>
                    {row.label}
                  </span>
                  <span className="text-[12px] font-black tabular-nums ms-2" style={{ color: row.color, fontFamily: 'var(--font-heebo)' }}>
                    {row.amount}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: row.color }}
                    initial={{ width: 0 }}
                    animate={settled ? { width: `${row.pct}%` } : { width: 0 }}
                    transition={{ ...springBouncy, delay: 0.2 + 0.12 * i }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}

        <motion.div
          className="flex items-center gap-1.5 pt-2"
          initial={{ opacity: 0 }}
          animate={settled ? { opacity: 1 } : undefined}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <Brain className="w-3 h-3" style={{ color: '#0DBACC' }} />
          <span className="text-[10px] font-bold" style={{ color: '#0DBACC', fontFamily: 'var(--font-heebo)' }}>
            מסווג אוטומטית ע״י AI
          </span>
        </motion.div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Mockup 2 — Goals & Plan: Ring chart + cycling tabs
   ══════════════════════════════════════════════════════════ */
function GoalsPlanMockup({ settled, noMotion }: { settled: boolean; noMotion: boolean }) {
  const [activeGoal, setActiveGoal] = useState(0);
  const goals = [
    { name: 'קרן חירום', target: 50000, current: 42000, monthly: 2800, color: '#0DBACC', months: 3 },
    { name: 'חיסכון לדירה', target: 200000, current: 124000, monthly: 4200, color: '#2B4699', months: 18 },
    { name: 'חופשה משפחתית', target: 15000, current: 11200, monthly: 1900, color: '#F18AB5', months: 2 },
  ];

  useEffect(() => {
    if (!settled) return;
    const id = setInterval(() => setActiveGoal((p) => (p + 1) % 3), 3000);
    return () => clearInterval(id);
  }, [settled]);

  const goal = goals[activeGoal];
  const pct = Math.round((goal.current / goal.target) * 100);
  const circumference = 2 * Math.PI * 34;

  return (
    <div className="max-w-sm">
      {/* Tabs */}
      <div className="flex gap-1.5 mb-4">
        {goals.map((g, i) => (
          <button
            key={i}
            onClick={() => setActiveGoal(i)}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 cursor-pointer"
            style={{
              fontFamily: 'var(--font-heebo)',
              background: activeGoal === i ? `${g.color}14` : 'rgba(0,0,0,0.02)',
              color: activeGoal === i ? g.color : '#86868B',
              border: `1px solid ${activeGoal === i ? `${g.color}30` : 'transparent'}`,
            }}
          >
            {g.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeGoal}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="relative w-[72px] h-[72px] flex-shrink-0">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="5" />
                <motion.circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke={goal.color}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference}`}
                  initial={{ strokeDashoffset: circumference }}
                  animate={settled ? { strokeDashoffset: circumference * (1 - pct / 100) } : {}}
                  transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                />
              </svg>
              {!noMotion && settled && (
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ border: `2px solid ${goal.color}` }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-black" style={{ color: goal.color, fontFamily: 'var(--font-heebo)' }}>
                  {pct}%
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5">
              {[
                { l: 'יעד', v: `₪${goal.target.toLocaleString()}`, c: '#1D1D1F' },
                { l: 'נצבר', v: `₪${goal.current.toLocaleString()}`, c: goal.color },
                { l: 'נשאר', v: `${goal.months} חודשים`, c: '#1D1D1F' },
              ].map((r, i) => (
                <div key={i} className="flex justify-between text-[11px]" style={{ fontFamily: 'var(--font-heebo)' }}>
                  <span style={{ color: '#86868B' }}>{r.l}</span>
                  <span className="font-bold" style={{ color: r.c }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl p-2.5 flex items-center gap-2.5"
            style={{ background: `${goal.color}08`, border: `1px solid ${goal.color}12` }}
          >
            <PiggyBank className="w-4 h-4 flex-shrink-0" style={{ color: goal.color }} />
            <div className="flex-1">
              <div className="text-[10px]" style={{ color: '#86868B', fontFamily: 'var(--font-heebo)' }}>הפקדה חודשית</div>
              <div className="text-sm font-black" style={{ color: goal.color, fontFamily: 'var(--font-heebo)' }}>
                ₪{goal.monthly.toLocaleString()}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Mockup 3 — Investment Flow: Horizontal nodes with particles
   ══════════════════════════════════════════════════════════ */
function InvestmentFlowMockup({ settled, noMotion }: { settled: boolean; noMotion: boolean }) {
  const nodes = [
    { label: 'הגדרת יעדים', icon: Target, color: '#0DBACC' },
    { label: 'בחירת קרנות סל', icon: Layers, color: '#2B4699' },
    { label: 'פתיחת תיק מסחר עצמאי', icon: Briefcase, color: '#F18AB5' },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Inline flow: Node → Connector → Node → Connector → Node */}
      {/* Horizontal on sm+, vertical on mobile */}
      <div className="flex flex-col sm:flex-row items-center justify-center w-full max-w-lg">
        {nodes.map((node, i) => {
          const Icon = node.icon;
          return (
            <div key={i} className="flex flex-col sm:contents items-center">
              {/* Node */}
              <motion.div
                className="relative z-10 flex flex-col items-center gap-2 flex-shrink-0"
                initial={{ opacity: 0, scale: 0 }}
                animate={settled ? { opacity: 1, scale: 1 } : undefined}
                transition={{ ...springBouncy, delay: 0.15 + i * 0.2 }}
              >
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center relative"
                  style={{ background: `${node.color}10`, border: `1.5px solid ${node.color}25` }}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: node.color }} />
                  {!noMotion && settled && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ border: `1.5px solid ${node.color}` }}
                      animate={{ scale: [1, 1.25], opacity: [0.3, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: 1.5 + i * 0.4, ease: 'easeOut' }}
                    />
                  )}
                </div>
                <span className="text-[11px] font-bold text-center max-w-[120px]" style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}>
                  {node.label}
                </span>
              </motion.div>

              {/* Connector (between nodes, not after the last one) */}
              {i < nodes.length - 1 && (
                <>
                  {/* Horizontal connector — hidden on mobile */}
                  <div className="relative h-[2px] flex-1 mx-3 sm:mx-5 self-center mb-6 hidden sm:block">
                    {/* Track */}
                    <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }} />
                    {/* Colored fill */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(to right, ${nodes[i + 1].color}, ${node.color})`,
                        transformOrigin: 'left',
                      }}
                      initial={{ scaleX: 0 }}
                      animate={settled ? { scaleX: 1 } : { scaleX: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 + i * 0.3, ease: 'easeOut' }}
                    />
                    {/* Flowing particles (RTL: right to left) */}
                    {!noMotion && settled && [0, 1, 2].map((p) => (
                      <motion.div
                        key={p}
                        className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full z-10"
                        style={{ background: node.color, boxShadow: `0 0 6px ${node.color}80` }}
                        animate={{ right: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 + p * 0.5, ease: 'linear', repeatDelay: 0.5 }}
                      />
                    ))}
                  </div>
                  {/* Vertical connector — visible only on mobile */}
                  <div className="relative w-[2px] h-6 my-2 sm:hidden">
                    <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }} />
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(to bottom, ${node.color}, ${nodes[i + 1].color})`,
                        transformOrigin: 'top',
                      }}
                      initial={{ scaleY: 0 }}
                      animate={settled ? { scaleY: 1 } : { scaleY: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 + i * 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <motion.div
        className="flex items-center gap-2 mt-5"
        initial={{ opacity: 0, y: 8 }}
        animate={settled ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.4, delay: 0.9 }}
      >
      </motion.div>
    </div>
  );
}

/* ── Cell content data ────────────────────────────────── */
const cells = [
  {
    id: 'map',
    title: 'מיפוי מלא',
    subtitle: 'של מצב הכסף',
    description: 'מעלים נתונים מהבנק, והמערכת מסדרת תמונה אחת ברורה — הכנסות, הוצאות, התחייבויות ונכסים.',
    color: '#2B4699',
    Mockup: FinancialMapMockup,
  },
  {
    id: 'goals',
    title: 'תכנית אישית',
    subtitle: 'לפי היעדים שלכם',
    description: 'מגדירים יעד, והמערכת מסדרת תכנית חודשית ברורה לחיסכון והשקעה.',
    color: '#0DBACC',
    Mockup: GoalsPlanMockup,
  },
  {
    id: 'invest',
    title: 'השקעה פאסיבית',
    subtitle: 'פשוטה ומעשית',
    description: 'מדריך מפורט ומעשי לבנית תיק השקעות פאסיבי המתאים ליעדים שהגדרתם.',
    color: '#F18AB5',
    Mockup: InvestmentFlowMockup,
  },
];

/* ── Grid Cell (animated + settled state) ─────────────── */
function GridCell({
  cell,
  index,
  noMotion,
  className,
  mobileDivider,
}: {
  cell: (typeof cells)[0];
  index: number;
  noMotion: boolean;
  className?: string;
  mobileDivider?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [settled, setSettled] = useState(false);
  const Mockup = cell.Mockup;

  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(() => setSettled(true), noMotion ? 0 : 500 + index * 120);
    return () => clearTimeout(timer);
  }, [isInView, index, noMotion]);

  return (
    <motion.div
      ref={ref}
      className={`px-4 sm:px-6 py-8 sm:py-10 md:px-10 md:py-14 ${className || ''}`}
      style={mobileDivider ? { borderBottom: `1px solid ${DIVIDER}` } : undefined}
      initial={noMotion ? undefined : { opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={noMotion ? { duration: 0 } : { ...springBouncy, delay: index * 0.12 }}
    >
      {/* Title */}
      <h3
        className="text-[24px] sm:text-[28px] font-black leading-tight"
        style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
      >
        {cell.title}
      </h3>
      <p
        className="text-[13px] leading-relaxed mt-2 max-w-md"
        style={{ color: '#86868B', fontFamily: 'var(--font-heebo)' }}
      >
        {cell.description}
      </p>

      {/* Animated visual */}
      <div className="mt-8">
        <Mockup settled={settled} noMotion={noMotion} />
      </div>
    </motion.div>
  );
}

/* ── Main Section ─────────────────────────────────────── */
export default function FeaturesSection() {
  const shouldReduceMotion = useReducedMotion();
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' });
  const noMotion = !!shouldReduceMotion;

  return (
    <section id="features" className="relative py-20 md:py-28" style={{ background: '#F5F5F7' }}>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-14 md:mb-20">
          
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight"
            style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
            initial={noMotion ? undefined : { opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            מנתונים מפוזרים
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              לתכנית משפחתית ברורה.
            </span>
          </motion.h2>
        </div>

        {/* ── Flat grid with thin divider lines ── */}
        <div>
          {/* Top row: 2 columns with vertical divider */}
          <div
            className="relative grid grid-cols-1 md:grid-cols-2"
            style={{ borderBottom: `1px solid ${DIVIDER}` }}
          >
            {/* Vertical divider (desktop) */}
            <div
              className="hidden md:block absolute top-0 bottom-0 w-px"
              style={{ left: '50%', background: DIVIDER }}
            />

            {/* Cell 1 — Financial Map */}
            <GridCell
              cell={cells[0]}
              index={0}
              noMotion={noMotion}
              mobileDivider
            />

            {/* Cell 2 — Goals & Plan */}
            <GridCell
              cell={cells[1]}
              index={1}
              noMotion={noMotion}
            />
          </div>

          {/* Bottom row: full width */}
          <GridCell
            cell={cells[2]}
            index={2}
            noMotion={noMotion}
          />
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
