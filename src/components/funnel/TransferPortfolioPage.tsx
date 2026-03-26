'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, useReducedMotion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  PieChart,
  ArrowLeft,
  ChevronDown,
  ShieldCheck,
  Gift,
  FileText,
  RefreshCw,
  BadgeCheck,
  Clock,
  ChevronUp,
  Wallet,
  ArrowRightLeft,
  Landmark,
  CheckCircle2,
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

/* ═══════════════════════════════════════════════════════════
   Section 1 — Hero
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
            background: 'rgba(13,186,204,0.06)',
            border: '1px solid rgba(13,186,204,0.1)',
          }}
          {...(noMotion ? {} : fadeUp(0))}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" style={{ color: '#0DBACC' }} strokeWidth={2} />
          <span className="text-[12px] font-bold" style={{ color: '#0DBACC', ...FONT }}>
            חוסכים אלפי שקלים על דמי ניהול
          </span>
        </motion.div>

        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black leading-[1.08] mb-6"
          style={{ color: '#1D1D1F', letterSpacing: '-0.02em', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.1))}
        >
          יש לכם תיק?{' '}
          <span style={GRADIENT_STYLE}>העבירו אותו</span>
          <br />
          <span className="text-2xl sm:text-3xl md:text-4xl" style={{ color: '#303150' }}>
            ותיהנו מ-0₪ דמי ניהול לכל החיים
          </span>
        </motion.h1>

        <motion.p
          className="text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed"
          style={{ color: '#6E6E73', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.2))}
        >
          העברת תיק השקעות קיים לאלטשולר שחם דרכנו
          <br className="hidden sm:block" />
          תהליך פשוט שחוסך לכם כסף, לכל החיים
        </motion.p>

        <motion.p
          className="text-[11px] mt-2"
          style={{ color: '#BDBDCB', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.35))}
        >
          ההטבות בתוקף לפותחי חשבון דרך MyNeto בלבד · אינו מהווה ייעוץ השקעות
        </motion.p>
      </div>

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
              animate={noMotion ? undefined : { y: [0, 6, 0], opacity: [0.6, 0.15, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
          <motion.div
            animate={noMotion ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={18} strokeWidth={2} style={{ color: 'rgba(0,0,0,0.18)' }} />
          </motion.div>
          <span className="text-[11px] font-semibold" style={{ color: 'rgba(0,0,0,0.18)', ...FONT }}>
            גללו למטה
          </span>
        </motion.div>
      )}

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.3) 40%, #FFFFFF 100%)',
        }}
      />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 2 — Why Transfer (Benefits)
   ═══════════════════════════════════════════════════════════ */

const TRANSFER_BENEFITS = [
  {
    icon: ShieldCheck,
    accent: '#0DBACC',
    value: '0₪',
    title: 'פטור מלא מדמי ניהול לכל החיים',
    body: 'במקום לשלם 0.5% עד 1.5% דמי ניהול שנתיים, דרכנו אתם נהנים מפטור מלא. ההטבה תקפה לכל חיי החשבון, ללא הגבלת זמן.',
  },
  {
    icon: Gift,
    accent: '#69ADFF',
    value: '200₪',
    title: 'מתנת הצטרפות',
    body: 'מקבלים 200₪ ישר לחשבון, רק בפתיחה דרך MyNeto. בלי תנאים נסתרים.',
  },
  {
    icon: RefreshCw,
    accent: '#2B4699',
    value: '',
    title: 'ההשקעות שלכם לא נמכרות',
    body: 'התיק עובר כמו שהוא. אין צורך למכור ולקנות מחדש, אין אירוע מס, והמניות שלכם ממשיכות לצמוח.',
  },
  {
    icon: FileText,
    accent: '#F18AB5',
    value: '',
    title: 'תהליך מובנה עם ליווי',
    body: 'אלטשולר שחם טרייד מלווים אתכם בתהליך ומכינים את טופס ההעברה. אתם שולחים דו"ח אחזקות, הם מתאמים ומטפלים.',
  },
];

function WhyTransferSection({ noMotion }: { noMotion: boolean }) {
  return (
    <section
      className="relative py-24 md:py-36 px-4 sm:px-6"
      style={{ background: '#FFFFFF' }}
    >
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 leading-[1.12] text-center"
          style={{ ...GRADIENT_STYLE, ...FONT }}
          {...(noMotion ? {} : fadeUp())}
        >
          למה להעביר את התיק?
        </motion.h2>
        <motion.p
          className="text-[15px] sm:text-base max-w-md mx-auto leading-relaxed mb-14 md:mb-20 text-center"
          style={{ color: '#7E7F90', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.08))}
        >
          ארבע סיבות טובות לעבור
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TRANSFER_BENEFITS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                className="rounded-2xl p-6 sm:p-7"
                style={{
                  background: '#FFFFFF',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid #F7F7F8',
                }}
                {...(noMotion ? {} : fadeUp(0.1 + i * 0.07))}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${item.accent}14`, border: `1px solid ${item.accent}20` }}
                  >
                    <Icon size={20} strokeWidth={1.75} style={{ color: item.accent }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3
                        className="text-[15px] font-bold"
                        style={{ color: '#303150', ...FONT }}
                      >
                        {item.title}
                      </h3>
                      {item.value && (
                        <span
                          className="text-[14px] font-black"
                          style={{ color: item.accent, ...FONT }}
                        >
                          {item.value}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[13px] leading-relaxed"
                      style={{ color: '#7E7F90', ...FONT }}
                    >
                      {item.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(245,245,247,0.4) 50%, #F5F5F7 100%)',
        }}
      />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 3 — Fee Savings Calculator
   ═══════════════════════════════════════════════════════════ */

function computeFeeSavings(portfolioSize: number, feeRate: number, years: number) {
  let total = portfolioSize;
  let totalFees = 0;
  const annualReturn = 0.08;

  for (let y = 0; y < years; y++) {
    const fee = total * feeRate;
    totalFees += fee;
    total = (total - fee) * (1 + annualReturn);
  }

  return { totalFees: Math.round(totalFees), endValue: Math.round(total) };
}

function FeeSavingsSection({ noMotion }: { noMotion: boolean }) {
  const [portfolioSize, setPortfolioSize] = useState(300000);
  const [years, setYears] = useState(15);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  const withFees = useMemo(
    () => computeFeeSavings(portfolioSize, 0.008, years),
    [portfolioSize, years],
  );
  const withoutFees = useMemo(
    () => computeFeeSavings(portfolioSize, 0, years),
    [portfolioSize, years],
  );

  const feeSavings = withFees.totalFees;
  const valueDiff = withoutFees.endValue - withFees.endValue;

  const portfolioPct = ((portfolioSize - 50000) / (2000000 - 50000)) * 100;
  const yearsPct = ((years - 5) / (30 - 5)) * 100;

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
          כמה דמי ניהול אתם חוסכים?
        </motion.h2>
        <motion.p
          className="text-[15px] sm:text-base max-w-md mx-auto leading-relaxed mb-14 md:mb-20 text-center"
          style={{ color: '#7E7F90', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.08))}
        >
          הזיזו את הסליידרים וראו כמה כסף נשאר אצלכם במקום אצל הברוקר
        </motion.p>

        <motion.div
          className="rounded-3xl p-5 sm:p-8"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #F7F7F8',
          }}
          {...(noMotion ? {} : fadeUp(0.15))}
        >
          {/* Sliders */}
          <div className="mb-10">
            {/* Portfolio size slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium" style={{ color: '#7E7F90', ...FONT }}>
                  גודל התיק הנוכחי
                </span>
                <span className="text-[16px] font-black tabular-nums" style={{ color: '#303150', ...FONT }}>
                  ₪{portfolioSize.toLocaleString('he-IL')}
                </span>
              </div>
              <div className="relative w-full h-6 flex items-center">
                <div className="absolute inset-x-0 h-1 rounded-full" style={{ background: '#E8E8ED' }} />
                <div
                  className="absolute h-1 rounded-full"
                  style={{ background: '#0DBACC', width: `${portfolioPct}%`, right: 0 }}
                />
                <input
                  type="range"
                  min={50000}
                  max={2000000}
                  step={50000}
                  value={portfolioSize}
                  onChange={(e) => setPortfolioSize(Number(e.target.value))}
                  className="fee-slider absolute inset-0 w-full appearance-none bg-transparent cursor-pointer z-10"
                  style={{ direction: 'rtl' }}
                />
              </div>
            </div>

            {/* Years slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium" style={{ color: '#7E7F90', ...FONT }}>
                  תקופה
                </span>
                <span className="text-[16px] font-black tabular-nums" style={{ color: '#303150', ...FONT }}>
                  {years} שנים
                </span>
              </div>
              <div className="relative w-full h-6 flex items-center">
                <div className="absolute inset-x-0 h-1 rounded-full" style={{ background: '#E8E8ED' }} />
                <div
                  className="absolute h-1 rounded-full"
                  style={{ background: '#2B4699', width: `${yearsPct}%`, right: 0 }}
                />
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="fee-slider absolute inset-0 w-full appearance-none bg-transparent cursor-pointer z-10"
                  style={{ direction: 'rtl' }}
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(13,186,204,0.04) 0%, rgba(43,70,153,0.03) 100%)',
              border: '1px solid rgba(13,186,204,0.08)',
            }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0">
              {/* Fees saved */}
              <div className="text-center flex-1">
                <span className="text-[12px] block mb-1" style={{ color: '#7E7F90', ...FONT }}>
                  דמי ניהול שתחסכו
                </span>
                <span
                  className="text-3xl sm:text-4xl font-black tabular-nums"
                  style={{ ...GRADIENT_STYLE, ...FONT }}
                >
                  ₪{feeSavings.toLocaleString('he-IL')}
                </span>
                <span className="text-[11px] block mt-1" style={{ color: '#BDBDCB', ...FONT }}>
                  במקום לשלם 0.8% דמי ניהול שנתיים
                </span>
              </div>

              {/* Divider */}
              <div
                className="hidden sm:block mx-8"
                style={{ width: 1, height: 56, background: 'rgba(13,186,204,0.15)' }}
              />
              <div
                className="sm:hidden"
                style={{ height: 1, width: 80, background: 'rgba(13,186,204,0.15)' }}
              />

              {/* Extra value */}
              <div className="text-center flex-1">
                <span className="text-[12px] block mb-1" style={{ color: '#7E7F90', ...FONT }}>
                  עוד כסף בתיק שלכם
                </span>
                <span
                  className="text-3xl sm:text-4xl font-black tabular-nums"
                  style={{ color: '#0DBACC', ...FONT }}
                >
                  ₪{valueDiff.toLocaleString('he-IL')}
                </span>
                <span className="text-[11px] block mt-1" style={{ color: '#BDBDCB', ...FONT }}>
                  הפרש מצטבר לאורך {years} שנים
                </span>
              </div>
            </div>
          </div>

          {/* Comparison bars */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[12px] font-bold shrink-0 w-28 text-end" style={{ color: '#0DBACC', ...FONT }}>
                דרך MyNeto
              </span>
              <div className="flex-1 relative h-7 rounded-lg overflow-hidden" style={{ background: 'rgba(13,186,204,0.06)' }}>
                <motion.div
                  className="absolute inset-y-0 right-0 rounded-lg"
                  style={{ background: 'linear-gradient(to left, #0DBACC, #2B4699)' }}
                  initial={{ width: 0 }}
                  animate={isInView ? { width: '100%' } : undefined}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
                <span
                  className="absolute inset-0 flex items-center px-3 text-[11px] font-bold text-white z-10"
                  style={FONT}
                >
                  ₪{withoutFees.endValue.toLocaleString('he-IL')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold shrink-0 w-28 text-end" style={{ color: '#F18AB5', ...FONT }}>
                ברוקר רגיל
              </span>
              <div className="flex-1 relative h-7 rounded-lg overflow-hidden" style={{ background: 'rgba(241,138,181,0.06)' }}>
                <motion.div
                  className="absolute inset-y-0 right-0 rounded-lg"
                  style={{ background: 'linear-gradient(to left, #F18AB5, #D0729A)' }}
                  initial={{ width: 0 }}
                  animate={
                    isInView
                      ? { width: `${(withFees.endValue / withoutFees.endValue) * 100}%` }
                      : undefined
                  }
                  transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
                <span
                  className="absolute inset-0 flex items-center px-3 text-[11px] font-bold text-white z-10"
                  style={FONT}
                >
                  ₪{withFees.endValue.toLocaleString('he-IL')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-5" style={{ borderTop: '1px solid #F7F7F8' }}>
            <span className="text-[11px]" style={{ color: '#BDBDCB', ...FONT }}>
              * חישוב על בסיס תשואה ממוצעת של 8% שנתית · דמי ניהול 0.8% שנתיים אצל ברוקר רגיל · ההשוואה היא אילוסטרטיבית בלבד
            </span>
          </div>
        </motion.div>
      </div>

      {/* Slider styles */}
      <style jsx>{`
        .fee-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 2.5px solid #0DBACC;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          cursor: pointer;
          margin-top: -9px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .fee-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 3px 12px rgba(13,186,204,0.3);
        }
        .fee-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 2.5px solid #0DBACC;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          cursor: pointer;
        }
        .fee-slider::-webkit-slider-runnable-track {
          height: 4px;
          background: transparent;
        }
        .fee-slider::-moz-range-track {
          height: 4px;
          background: transparent;
        }
      `}</style>

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.4) 50%, #FFFFFF 100%)',
        }}
      />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 4 — Transfer Steps (Practical Guide)
   ═══════════════════════════════════════════════════════════ */

const TRANSFER_STEPS = [
  {
    icon: Wallet,
    accent: '#0DBACC',
    title: 'פותחים חשבון באלטשולר שחם טרייד',
    body: 'דרך הלינק שלנו, תהליך הצטרפות דיגיטלי מהיר. ככה מקבלים את ההטבות הבלעדיות (0₪ דמי ניהול + 200₪ מתנה).',
    tip: 'צריך תעודת זהות ופרטי חשבון בנק',
  },
  {
    icon: FileText,
    accent: '#69ADFF',
    title: 'מקבלים מספר חשבון ואישור ניהול',
    body: 'אחרי סיום ההצטרפות, יוצרים קשר עם אלטשולר שחם טרייד לקבלת מספר חשבון ואישור ניהול חשבון.',
    tip: 'מייל: alt-trade@altshul.co.il · ווטסאפ: 052-7781070',
  },
  {
    icon: Landmark,
    accent: '#2B4699',
    title: 'שולחים דו"ח אחזקות ופונים לברוקר',
    body: 'שולחים לאלטשולר את דו"ח האחזקות שלכם לתיאום. אחר כך פונים לבנק או הברוקר הנוכחי עם טופס ההעברה ואישור ניהול החשבון.',
    tip: 'אלטשולר מכינים לכם טופס העברה מוכן',
  },
  {
    icon: CheckCircle2,
    accent: '#10B981',
    title: 'ניירות הערך עוברים עם 0₪ דמי ניהול',
    body: 'ניירות הערך עוברים לחשבון החדש. כל ההשקעות שלכם נשמרות כמו שהן, רק עכשיו בלי דמי ניהול, לכל החיים.',
    tip: null,
  },
];

function TransferStepsSection({ noMotion }: { noMotion: boolean }) {
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
          איך מעבירים? 4 צעדים פשוטים
        </motion.h2>
        <motion.p
          className="text-[15px] sm:text-base max-w-md mx-auto leading-relaxed mb-14 md:mb-20 text-center"
          style={{ color: '#7E7F90', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.08))}
        >
          תהליך מובנה עם ליווי, אלטשולר מטפלים ברוב העבודה
        </motion.p>

        {/* Steps timeline */}
        <div className="relative">
          <div
            className="absolute top-6 right-[23px] sm:right-[27px] w-px hidden sm:block"
            style={{
              height: 'calc(100% - 3rem)',
              background: 'linear-gradient(to bottom, #0DBACC, #69ADFF, #2B4699, #10B981)',
              opacity: 0.2,
            }}
          />

          <div className="space-y-6">
            {TRANSFER_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  className="flex items-start gap-5"
                  {...(noMotion ? {} : fadeUp(0.1 + i * 0.1))}
                >
                  <div className="shrink-0 relative z-10">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: `${step.accent}14`,
                        border: `2px solid ${step.accent}30`,
                      }}
                    >
                      <Icon size={22} strokeWidth={1.75} style={{ color: step.accent }} />
                    </div>
                  </div>

                  <div className="pt-1 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[11px] font-black px-2 py-0.5 rounded-md"
                        style={{ background: `${step.accent}10`, color: step.accent, ...FONT }}
                      >
                        צעד {i + 1}
                      </span>
                    </div>
                    <h3 className="text-[16px] font-bold mb-1" style={{ color: '#303150', ...FONT }}>
                      {step.title}
                    </h3>
                    <p className="text-[13px] leading-relaxed" style={{ color: '#7E7F90', ...FONT }}>
                      {step.body}
                    </p>
                    {step.tip && (
                      <div
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-lg"
                        style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}
                      >
                        <Clock size={11} strokeWidth={2} style={{ color: '#BDBDCB' }} />
                        <span className="text-[11px]" style={{ color: '#7E7F90', ...FONT }}>
                          {step.tip}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA after steps */}
        <motion.div
          className="text-center mt-14"
          {...(noMotion ? {} : fadeUp(0.5))}
        >
          <motion.button
            onClick={() => handleCtaClick('transfer_steps_cta')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white text-[15px] font-bold cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
              boxShadow: '0 4px 24px rgba(43,70,153,0.3)',
              ...FONT,
            }}
            whileHover={noMotion ? undefined : {
              scale: 1.04,
              boxShadow: '0 8px 32px rgba(43,70,153,0.4)',
            }}
            whileTap={noMotion ? undefined : { scale: 0.97 }}
          >
            <span>להתחיל את ההעברה</span>
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          </motion.button>
        </motion.div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(245,245,247,0.4) 50%, #F5F5F7 100%)',
        }}
      />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 5 — FAQ
   ═══════════════════════════════════════════════════════════ */

const FAQ_ITEMS = [
  {
    q: 'מה קורה לניירות הערך שלי בזמן ההעברה?',
    a: 'ניירות הערך שלכם עוברים כמו שהם לחשבון החדש. אין מכירה, אין קנייה מחדש. אתם ממשיכים להחזיק בדיוק את אותם ניירות ערך.',
  },
  {
    q: 'איך מתחילים את תהליך ההעברה?',
    a: 'קודם פותחים חשבון באלטשולר שחם טרייד (דרכנו, כדי לקבל את ההטבות). אחרי ההצטרפות יוצרים קשר עם אלטשולר לקבלת מספר חשבון ואישור ניהול חשבון, שולחים דו"ח אחזקות לתיאום, ואז פונים לבנק/ברוקר הנוכחי עם טופס ההעברה.',
  },
  {
    q: 'יש עלות להעברת התיק?',
    a: 'אלטשולר שחם טרייד לא גובים על קבלת ניירות הערך. ייתכן שהבנק או הברוקר הנוכחי ייגבו עמלת העברה, כדאי לבדוק מולם מראש. בכל מקרה, החיסכון בדמי ניהול מכסה את זה תוך זמן קצר.',
  },
  {
    q: 'האם ההעברה יוצרת אירוע מס?',
    a: 'לא. העברת ניירות ערך בין חשבונות אינה אירוע מס כי אתם לא מוכרים את ניירות הערך. מחיר הרכישה המקורי נשמר.',
  },
  {
    q: 'אילו ניירות ערך אפשר להעביר?',
    a: 'ניתן להעביר ניירות ערך הנסחרים בישראל ובארה"ב. העברת ני"ע הנסחרים בארה"ב כפופה לאישור מראש של אלטשולר שחם טרייד. שלחו את דו"ח האחזקות שלכם לתיאום מראש.',
  },
  {
    q: 'איך יוצרים קשר עם אלטשולר שחם טרייד?',
    a: 'במייל: alt-trade@altshul.co.il או בוואטסאפ: 052-7781070. שירות לקוחות זמין בימים ב׳ עד ה׳ 09:00 עד 17:00, יום ו׳ 09:00 עד 14:00.',
  },
];

function FaqItem({
  item,
  isOpen,
  onToggle,
  index,
  noMotion,
}: {
  item: (typeof FAQ_ITEMS)[0];
  isOpen: boolean;
  onToggle: () => void;
  index: number;
  noMotion: boolean;
}) {
  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: isOpen ? '1px solid rgba(13,186,204,0.15)' : '1px solid #F7F7F8',
        transition: 'border-color 0.3s ease',
      }}
      {...(noMotion ? {} : fadeUp(0.1 + index * 0.06))}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-start cursor-pointer"
      >
        <h3 className="text-[15px] font-bold" style={{ color: '#303150', ...FONT }}>
          {item.q}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0"
        >
          <ChevronUp size={18} strokeWidth={2} style={{ color: isOpen ? '#0DBACC' : '#BDBDCB' }} />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ overflow: 'hidden' }}
      >
        <div className="px-5 sm:px-6 pb-5 sm:pb-6">
          <p className="text-[13px] leading-relaxed" style={{ color: '#7E7F90', ...FONT }}>
            {item.a}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FaqSection({ noMotion }: { noMotion: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="relative py-24 md:py-36 px-4 sm:px-6"
      style={{ background: '#F5F5F7' }}
    >
      <div className="max-w-2xl mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 leading-[1.12] text-center"
          style={{ ...GRADIENT_STYLE, ...FONT }}
          {...(noMotion ? {} : fadeUp())}
        >
          שאלות נפוצות
        </motion.h2>
        <motion.p
          className="text-[15px] sm:text-base max-w-md mx-auto leading-relaxed mb-14 md:mb-20 text-center"
          style={{ color: '#7E7F90', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.08))}
        >
          כל מה שצריך לדעת לפני שמעבירים
        </motion.p>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={item.q}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              index={i}
              noMotion={noMotion}
            />
          ))}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.4) 50%, #FFFFFF 100%)',
        }}
      />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 6 — Final CTA
   ═══════════════════════════════════════════════════════════ */

function FinalCtaSection({ noMotion }: { noMotion: boolean }) {
  return (
    <section
      className="relative py-24 md:py-36 px-4 sm:px-6 text-center overflow-hidden"
      style={{ background: '#FFFFFF' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(43,70,153,0.04), transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto">
        <motion.div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
          style={{
            background: 'rgba(13,186,204,0.06)',
            border: '1px solid rgba(13,186,204,0.12)',
          }}
          {...(noMotion ? {} : fadeUp())}
        >
          <BadgeCheck className="w-3.5 h-3.5" style={{ color: '#0DBACC' }} strokeWidth={2} />
          <span className="text-[12px] font-bold" style={{ color: '#0DBACC', ...FONT }}>
            הטבה בלעדית דרך MyNeto
          </span>
        </motion.div>

        <motion.h2
          className="text-3xl sm:text-4xl font-black mb-4"
          style={{ color: '#303150', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.08))}
        >
          מוכנים{' '}
          <span style={GRADIENT_STYLE}>להפסיק לשלם</span>
          {' '}דמי ניהול?
        </motion.h2>
        <motion.p
          className="text-[14px] mb-5 max-w-md mx-auto leading-relaxed"
          style={{ color: '#7E7F90', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.14))}
        >
          פתיחת חשבון לוקחת 3 דקות · ההעברה מתבצעת תוך שבועות ·
          ואתם חוסכים לכל החיים
        </motion.p>

        <motion.div
          {...(noMotion ? {} : fadeUp(0.2))}
        >
          <motion.button
            onClick={() => handleCtaClick('transfer_final_cta')}
            className="relative inline-flex items-center gap-2 px-8 py-4 sm:px-10 rounded-2xl text-base sm:text-lg font-bold text-white cursor-pointer overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
              boxShadow: '0 4px 24px rgba(43,70,153,0.4)',
              ...FONT,
            }}
            whileHover={noMotion ? undefined : {
              scale: 1.04,
              y: -3,
              boxShadow: '0 12px 40px rgba(43,70,153,0.5)',
            }}
            whileTap={noMotion ? undefined : { scale: 0.98 }}
          >
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
                animation: 'ctaShimmer2 3s ease-in-out infinite',
              }}
            />
            <span className="relative z-10">להעברת התיק שלי</span>
            <ArrowLeft className="relative z-10 w-4 h-4" strokeWidth={2.5} />
          </motion.button>
        </motion.div>

        <motion.div
          className="flex items-center gap-4 mt-8 justify-center"
          {...(noMotion ? {} : fadeUp(0.28))}
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} strokeWidth={2} style={{ color: '#BDBDCB' }} />
            <span className="text-[11px]" style={{ color: '#BDBDCB', ...FONT }}>מאובטח ומפוקח</span>
          </div>
          <div style={{ width: 1, height: 12, background: '#E8E8ED' }} />
          <div className="flex items-center gap-1.5">
            <Clock size={14} strokeWidth={2} style={{ color: '#BDBDCB' }} />
            <span className="text-[11px]" style={{ color: '#BDBDCB', ...FONT }}>3 דקות בלבד</span>
          </div>
        </motion.div>

        <motion.p
          className="text-[11px] mt-8 leading-relaxed"
          style={{ color: '#BDBDCB', ...FONT }}
          {...(noMotion ? {} : fadeUp(0.34))}
        >
          ההטבות בתוקף לפותחי חשבון דרך MyNeto בלבד · אינו מהווה ייעוץ השקעות
        </motion.p>
      </div>

      <style jsx>{`
        @keyframes ctaShimmer2 {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
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
        מערכת MyNeto אינה בעלת רישיון ייעוץ השקעות. תשואות עבר אינן מעידות על תשואות עתידיות.
      </p>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Export
   ═══════════════════════════════════════════════════════════ */

export default function TransferPortfolioPage() {
  const prefersReduced = useReducedMotion();
  const noMotion = !!prefersReduced;

  return (
    <>
      <HeroSection noMotion={noMotion} />
      <WhyTransferSection noMotion={noMotion} />
      <FeeSavingsSection noMotion={noMotion} />
      <TransferStepsSection noMotion={noMotion} />
      <FaqSection noMotion={noMotion} />
      <FinalCtaSection noMotion={noMotion} />
      <MiniFooter />
    </>
  );
}
