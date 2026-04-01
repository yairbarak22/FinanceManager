'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Sprout,
  Globe,
  Repeat,
  Handshake,
  Rocket,
  ShieldCheck,
  AlertCircle,
  ChevronsDown,
  Plus,
  Minus,
  Check,
} from 'lucide-react';
import Card from '@/components/ui/Card';

/* ── ScrollToNext ──────────────────────────────────────────── */

function ScrollToNext({
  targetRef,
  label,
}: {
  targetRef: React.RefObject<HTMLDivElement | null>;
  label: string;
}) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      onClick={() =>
        targetRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
      className="flex flex-col items-center gap-1.5 mx-auto text-[#BDBDCB] hover:text-[#0DBACC] transition-colors py-4 cursor-pointer"
      aria-label={label}
    >
      <span className="text-xs font-medium">{label}</span>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <ChevronsDown className="w-5 h-5" />
      </motion.div>
    </motion.button>
  );
}

/* ── AnimatedSection ───────────────────────────────────────── */

function AnimatedSection({
  children,
  onRef,
}: {
  children: React.ReactNode;
  onRef?: (el: HTMLDivElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <motion.div
      ref={(el) => {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        onRef?.(el);
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}

/* ── Accordion ─────────────────────────────────────────────── */

function Accordion({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[#E8E8ED] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-right hover:bg-[#F7F7F8] transition-colors cursor-pointer"
      >
        <span className="text-sm font-medium text-[#303150]">{title}</span>
        <motion.div
          initial={false}
          animate={{ scale: isOpen ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <Minus className="w-4 h-4 text-[#0DBACC] flex-shrink-0" />
          ) : (
            <Plus className="w-4 h-4 text-[#7E7F90] flex-shrink-0" />
          )}
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-sm text-[#7E7F90] leading-relaxed border-t border-[#F7F7F8] pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Practice Step ─────────────────────────────────────────── */

function PracticeStep({
  number,
  icon,
  iconBg,
  title,
  children,
  delay = 0,
  isInView,
  isLast = false,
}: {
  number: number;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
  isInView: boolean;
  isLast?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="relative"
    >
      {!isLast && (
        <div className="absolute right-5 top-16 bottom-0 w-px bg-[#E8E8ED]" />
      )}
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div
            className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center relative z-10`}
          >
            {icon}
          </div>
          <span className="text-[10px] font-bold text-[#BDBDCB]">
            שלב {number}
          </span>
        </div>
        <div className="flex-1 pb-8">
          <h4 className="text-sm font-semibold text-[#303150] mb-2">
            {title}
          </h4>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Article ──────────────────────────────────────────── */

export default function WhatIsInvestingArticle() {
  const sec2Ref = useRef<HTMLDivElement>(null);
  const sec3Ref = useRef<HTMLDivElement>(null);
  const sec4Ref = useRef<HTMLDivElement>(null);
  const sec5Ref = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-8">
      {/* ── Section 1: What is investing ──────────── */}
      <AnimatedSection>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C1DDFF]/30 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#69ADFF]" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-[#303150]">
              מה זה השקעה?
            </h2>
            <p className="text-xs text-[#7E7F90]">מדריך שלם מאפס</p>
          </div>
        </div>

        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#C1DDFF]/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-[#69ADFF]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">
                  מה זה בכלל השקעה?
                </h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  השקעה היא{' '}
                  <span className="font-medium text-[#303150]">
                    הקצאת הון לנכסים שצפויים לגדול בערכם לאורך זמן
                  </span>
                  . במקום שהכסף ישב בעו&quot;ש ויאבד מכוח הקנייה שלו בגלל
                  האינפלציה, אנחנו מפנים אותו לעסקים פעילים שמייצרים ערך
                  כלכלי אמיתי.
                </p>
                <div className="bg-[#F7F7F8] rounded-xl p-3 space-y-1.5">
                  <p className="text-xs text-[#7E7F90]">
                    <span className="font-semibold text-[#303150]">
                      בפועל:
                    </span>{' '}
                    כשאתם קונים מניה של חברה, אתם רוכשים בעלות חלקית בעסק
                    אמיתי — עסק שמוכר מוצרים, מעסיק עובדים ומייצר רווחים.
                    ככל שהעסק גדל, הבעלות שלכם שווה יותר.
                  </p>
                  <p className="text-xs text-[#7E7F90]">
                    <span className="font-semibold text-[#303150]">
                      ההבדל מחיסכון:
                    </span>{' '}
                    חיסכון שומר על הכסף. השקעה גורמת לכסף לעבוד ולייצר
                    תשואה — הכסף מרוויח כסף נוסף.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={sec2Ref} label="למה כסף מפסיד ערך?" />

      {/* ── Section 2: Inflation + Compound Interest ── */}
      <AnimatedSection
        onRef={(el) => {
          (sec2Ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
      >
        {/* Inflation Card */}
        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#F18AB5]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-6 h-6 text-[#F18AB5]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">
                  אינפלציה — האויב השקט
                </h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  100,000₪ בעו&quot;ש שווים בעוד 10 שנים רק{' '}
                  <span className="font-medium text-[#303150]">
                    כ-74,000₪ בכוח קנייה
                  </span>{' '}
                  (אינפלציה 3%). כסף שלא מושקע —{' '}
                  <span className="font-medium text-[#303150]">
                    מפסיד ערך בכל יום שעובר
                  </span>
                  . זו הסיבה שהשקעה היא לא &quot;בונוס&quot; אלא{' '}
                  <span className="font-medium text-[#303150]">הכרח</span>.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Compound Interest Card */}
        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#E6F9F9] rounded-xl flex items-center justify-center flex-shrink-0">
                <Sprout className="w-6 h-6 text-[#0DBACC]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">
                  ריבית דריבית — הכוח הגדול ביותר בפיננסים
                </h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  <span className="font-medium text-[#0DBACC]">
                    ריבית דריבית
                  </span>{' '}
                  זה כשהרווחים{' '}
                  <span className="font-medium text-[#303150]">
                    גם הם מתחילים להרוויח
                  </span>
                  . הרעיון: שמתם 1,000₪ והרווחתם 10% = 100₪. בשנה הבאה
                  מרוויחים 10% על 1,100₪ = 110₪. וככה הלאה — הצמיחה מואצת.
                </p>
                <div className="bg-[#F7F7F8] rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-medium text-[#303150]">
                    1,000₪ בחודש × תשואה 8%:
                  </p>
                  <div className="flex justify-between text-xs text-[#7E7F90]">
                    <span>5 שנים</span>
                    <span className="font-semibold text-[#303150]">
                      ~₪74,000
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#7E7F90]">
                    <span>10 שנים</span>
                    <span className="font-semibold text-[#303150]">
                      ~₪186,000
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#7E7F90]">
                    <span>20 שנים</span>
                    <span className="font-semibold text-[#303150]">
                      ~₪590,000
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#7E7F90]">
                    <span>30 שנים</span>
                    <span className="font-semibold text-[#303150]">
                      ~₪1,500,000
                    </span>
                  </div>
                </div>
                <div className="bg-[#F7F7F8] rounded-xl p-3">
                  <p className="text-xs text-[#7E7F90]">
                    <span className="font-semibold text-[#303150]">
                      כלל 72:
                    </span>{' '}
                    72 ÷ תשואה שנתית = שנים להכפלה. בתשואה 8%: 72÷8 ={' '}
                    <span className="font-semibold text-[#303150]">
                      9 שנים
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#E6F9F9] rounded-xl p-4 text-center space-y-1">
              <p className="text-sm font-semibold text-[#0DBACC]">
                הסוד? זמן.
              </p>
              <p className="text-xs text-[#7E7F90]">
                ככל שמתחילים מוקדם יותר, אפקט ריבית דריבית חזק יותר.
              </p>
            </div>
          </div>
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={sec3Ref} label="מה זה S&P 500?" />

      {/* ── Section 3: S&P 500 + DCA ─────────────────── */}
      <AnimatedSection
        onRef={(el) => {
          (sec3Ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
      >
        {/* S&P 500 Card */}
        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-5" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#C1DDFF]/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-[#69ADFF]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">
                  מדד S&amp;P 500 — מה זה ולמה זה עובד
                </h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  S&amp;P 500 מכיל את{' '}
                  <span className="font-medium text-[#303150]">
                    500 החברות הגדולות ביותר בארה&quot;ב
                  </span>
                  . כשקונים קרן שעוקבת אחרי המדד, מחזיקים פיסה קטנה מכל
                  אחת מהן.
                </p>
              </div>
            </div>

            {/* 4 advantages — staggered */}
            <StaggeredPoints />

            {/* Crash recovery table */}
            <div className="bg-[#F7F7F8] rounded-xl p-3 space-y-2">
              <p className="text-xs font-medium text-[#303150]">
                משברים גדולים — והתאוששות
              </p>
              {[
                {
                  event: 'בועת הדוט-קום (2000)',
                  detail: '-49% → התאוששות תוך 7 שנים',
                },
                {
                  event: 'המשבר הפיננסי (2008)',
                  detail: '-57% → התאוששות תוך 5.5 שנים',
                },
                {
                  event: 'קורונה (2020)',
                  detail: '-34% → התאוששות תוך 5 חודשים',
                },
              ].map((item) => (
                <div
                  key={item.event}
                  className="flex justify-between text-xs text-[#7E7F90]"
                >
                  <span>{item.event}</span>
                  <span className="font-semibold text-[#303150]">
                    {item.detail}
                  </span>
                </div>
              ))}
            </div>

            {/* Company tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {['Google', 'Amazon', 'Apple', 'Microsoft', 'Nvidia'].map(
                (name) => (
                  <span
                    key={name}
                    className="text-[10px] font-medium text-[#7E7F90] bg-[#F7F7F8] px-2.5 py-1 rounded-lg"
                  >
                    {name}
                  </span>
                )
              )}
              <span className="text-[10px] text-[#BDBDCB]">+495 נוספות</span>
            </div>

            <div className="bg-[#E6F9F9] rounded-xl p-4 text-center space-y-1">
              <p className="text-sm font-semibold text-[#0DBACC]">
                94% מהמנהלים האקטיביים לא מנצחים את המדד.
              </p>
              <p className="text-xs text-[#7E7F90]">
                לפי מחקר SPIVA של S&amp;P Global לאורך 15 שנה.
              </p>
            </div>
          </div>
        </Card>

        {/* DCA Card */}
        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#E3D6FF] rounded-xl flex items-center justify-center flex-shrink-0">
                <Repeat className="w-6 h-6 text-[#9F7FE0]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">
                  DCA — ממוצע עלות דולרי
                </h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  במקום להשקיע סכום גדול בבת אחת, מפקידים{' '}
                  <span className="font-medium text-[#303150]">
                    סכום קבוע כל חודש
                  </span>
                  . כשהשוק יורד — קונים יותר יחידות. כשהוא עולה — קונים
                  פחות. בממוצע משלמים מחיר הוגן ומבטלים את הצורך בתזמון.
                </p>
                <div className="bg-[#E3D6FF]/30 rounded-xl p-3 border border-[#9F7FE0]/20">
                  <p className="text-xs font-medium text-[#9F7FE0] mb-0.5">
                    למה זה מושלם למשפחות?
                  </p>
                  <p className="text-xs text-[#7E7F90]">
                    הוראת קבע של 500-1,000₪ בחודש — פעם אחת ושכוחים. בלי
                    לחץ, בלי תזמון, בלי לבדוק מסכים.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={sec4Ref} label="מה עם ההלכה?" />

      {/* ── Section 4: Kashrut ────────────────────────── */}
      <AnimatedSection
        onRef={(el) => {
          (sec4Ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFF8E1] rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#E9A800]" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-[#303150]">
              כשרות הלכתית
            </h2>
            <p className="text-xs text-[#7E7F90]">
              האם מותר להשקיע על פי ההלכה?
            </p>
          </div>
        </div>

        <Card className="overflow-hidden border-2 border-[#E9A800]/30" padding="none">
          <div className="p-6 space-y-5" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#FFF8E1] rounded-xl flex items-center justify-center flex-shrink-0">
                <Handshake className="w-6 h-6 text-[#E9A800]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">
                  מה הופך קרנות מחקות מדד לכשרות?
                </h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  קניית מניות היא{' '}
                  <span className="font-medium text-[#303150]">
                    קניית בעלות חלקית בחברה — לא הלוואה
                  </span>
                  . הרווח מגיע מצמיחת ערך העסק, לא מריבית. לכן עצם קניית
                  מניות היא עסקה כשרה לחלוטין.
                </p>
                <div className="bg-[#FFF8E1] rounded-xl p-3">
                  <p className="text-xs text-[#7E7F90]">
                    <span className="font-medium text-[#E9A800]">
                      היתר עסקה:
                    </span>{' '}
                    שטר הלכתי שמגדיר שהכסף שניתן אינו הלוואה אלא השקעה
                    משותפת בעסק. מקובל על הפוסקים כבר מאות שנים.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#F7F7F8]" />

            <Accordion title="מה לגבי אגרות חוב בתוך הקרן?">
              <p>
                קרנות הסל הישראליות (הראל, קסם, תכלית, מגדל) פועלות תחת{' '}
                <span className="font-medium text-[#0DBACC]">
                  היתר עסקה למהדרין
                </span>{' '}
                — מנגנון הלכתי שמכסה את כל מרכיבי הקרן, כולל חברות פיננסיות
                ומכשירים שעשויים לכלול מרכיב של הלוואה.
              </p>
            </Accordion>

            <Accordion title="אילו קרנות מחקות מדד כשרות למהדרין?">
              <div className="space-y-2">
                <p>
                  קרנות ישראליות מחקות S&amp;P 500 שפועלות תחת פיקוח הלכתי:
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    'הראל סל S&P 500',
                    'קסם KTF S&P 500',
                    'תכלית סל S&P 500',
                    'מגדל S&P 500',
                  ].map((name) => (
                    <span
                      key={name}
                      className="text-[10px] font-medium text-[#E9A800] bg-[#FFF8E1] px-3 py-1.5 rounded-lg border border-[#E9A800]/20"
                    >
                      {name}
                    </span>
                  ))}
                </div>
                <div className="bg-[#FFF8E1] rounded-xl p-3 mt-2">
                  <p className="text-xs text-[#7E7F90]">
                    <span className="font-medium text-[#E9A800]">
                      שימו לב:
                    </span>{' '}
                    קרנות אמריקאיות (VOO, SPY) אינן מחזיקות בהיתר עסקה.
                    עדיף לרכוש קרנות ישראליות.
                  </p>
                </div>
              </div>
            </Accordion>

            <Accordion title='אבל בורסה זה הימורים, לא?'>
              <div className="space-y-2">
                <p>
                  <span className="font-medium text-[#303150]">
                    מסחר יומי
                  </span>{' '}
                  — כן, זה דומה להימורים. ניחוש מה יקרה מחר.
                </p>
                <p>
                  <span className="font-medium text-[#0DBACC]">
                    השקעה פסיבית לטווח ארוך
                  </span>{' '}
                  — זו בעלות על עסקים אמיתיים. 500 חברות שמייצרות מוצרים,
                  מעסיקות עובדים ומכניסות כסף.
                </p>
              </div>
            </Accordion>

            <div className="border-t border-[#F7F7F8]" />

            {/* Certification badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-medium text-[#0DBACC] bg-[#E6F9F9] px-3 py-1.5 rounded-lg border border-[#0DBACC]/20">
                היתר עסקה מהודר
              </span>
              <span className="text-[10px] font-medium text-[#E9A800] bg-[#FFF8E1] px-3 py-1.5 rounded-lg border border-[#E9A800]/20">
                פיקוח רבני
              </span>
              <span className="text-[10px] font-medium text-[#69ADFF] bg-[#C1DDFF]/30 px-3 py-1.5 rounded-lg border border-[#69ADFF]/20">
                רשות ני&quot;ע
              </span>
            </div>
          </div>
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={sec5Ref} label="איך מתחילים?" />

      {/* ── Section 5: Practice + Summary ─────────────── */}
      <AnimatedSection
        onRef={(el) => {
          (sec5Ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0DBACC]/20 rounded-xl flex items-center justify-center">
            <Rocket className="w-5 h-5 text-[#0DBACC]" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-[#303150]">
              3 צעדים להתחלה
            </h2>
            <p className="text-xs text-[#7E7F90]">הפרקטיקה</p>
          </div>
        </div>

        <Card className="overflow-hidden" padding="none">
          <PracticeStepsContent />
        </Card>

        {/* Tip */}
        <div className="bg-[#E6F9F9] rounded-xl p-4 text-center space-y-1">
          <p className="text-sm font-semibold text-[#0DBACC]">
            טיפ: אל תבדקו כל יום
          </p>
          <p className="text-xs text-[#7E7F90]">
            תנודות יומיות הן רעש. מה שחשוב זו המגמה לאורך שנים. הגדירו
            הוראת קבע ותבדקו פעם ברבעון.
          </p>
        </div>

        {/* Blockquote */}
        <blockquote
          className="border-e-4 border-[#69ADFF] pe-4 py-2 text-[#7E7F90] italic text-sm"
          dir="rtl"
        >
          &ldquo;אל תחפשו את המחט בערימת השחת. פשוט קנו את כל ערימת
          השחת.&rdquo;
          <br />
          <span className="not-italic font-bold text-[#303150]">
            ג&apos;ון בוגל
          </span>
          , מייסד Vanguard ואבי ההשקעה הפסיבית
        </blockquote>

        {/* Disclaimer */}
        <p className="text-[10px] text-[#BDBDCB] text-center leading-relaxed">
          האמור אינו מהווה ייעוץ השקעות או שיווק השקעות ואינו תחליף לייעוץ
          אישי. תשואות עבר אינן מעידות על תשואות עתידיות. כל השקעה כרוכה
          בסיכון, כולל הפסד קרן.
        </p>
      </AnimatedSection>
    </div>
  );
}

/* ── S&P 500 staggered points ──────────────────────────────── */

function StaggeredPoints() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  const points = [
    {
      text: (
        <>
          <strong>תשואה ממוצעת ~10% בשנה</strong> לאורך 30+ שנה (כולל
          דיבידנדים).
        </>
      ),
    },
    {
      text: (
        <>
          <strong>94% מהמנהלים האקטיביים</strong> לא מצליחים לנצח את המדד
          לאורך 15 שנה.
        </>
      ),
    },
    {
      text: (
        <>
          <strong>פיזור אוטומטי:</strong> 500 חברות ממגוון ענפים — טכנולוגיה,
          בריאות, פיננסים, אנרגיה.
        </>
      ),
    },
    {
      text: (
        <>
          <strong>דמי ניהול אפסיים:</strong> קרנות מחקות גובות בין 0.03%
          ל-0.2% בשנה.
        </>
      ),
    },
  ];

  return (
    <div ref={ref} className="space-y-2">
      {points.map((pt, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
          className="flex items-start gap-3"
        >
          <div className="w-6 h-6 bg-[#0DBACC]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-3.5 h-3.5 text-[#0DBACC]" />
          </div>
          <p className="text-sm text-[#7E7F90]">{pt.text}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Practice Steps Content ────────────────────────────────── */

function PracticeStepsContent() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <div ref={ref} className="p-6 space-y-2" dir="rtl">
      <PracticeStep
        number={1}
        icon={<TrendingUp className="w-5 h-5 text-[#69ADFF]" />}
        iconBg="bg-[#C1DDFF]/30"
        title="פתחו חשבון מסחר עצמאי"
        delay={0.1}
        isInView={isInView}
      >
        <div className="space-y-2">
          <p className="text-sm text-[#7E7F90] leading-relaxed">
            בבית השקעות ישראלי מפוקח — IBI, מיטב, אלטשולר שחם או כל ברוקר
            אחר. דרכנו אפשר לפתוח באלטשולר עם{' '}
            <span className="font-medium text-[#303150]">
              0₪ דמי ניהול
            </span>
            .
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {['IBI', 'מיטב', 'אלטשולר שחם'].map((name) => (
              <span
                key={name}
                className="text-xs font-medium text-[#303150] bg-[#F7F7F8] px-3 py-1.5 rounded-lg"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </PracticeStep>

      <PracticeStep
        number={2}
        icon={<Globe className="w-5 h-5 text-[#0DBACC]" />}
        iconBg="bg-[#E6F9F9]"
        title="בחרו קרן מחקה S&P 500"
        delay={0.2}
        isInView={isInView}
      >
        <div className="space-y-2">
          <p className="text-sm text-[#7E7F90] leading-relaxed">
            קרן עם דמי ניהול נמוכים שעוקבת אחרי המדד. אם חשובה לכם כשרות
            — בחרו מהרשימה למעלה (הראל, קסם, תכלית, מגדל).
          </p>
          <div className="bg-[#0DBACC]/10 rounded-xl p-3 border border-[#0DBACC]/20">
            <p className="text-xs text-[#7E7F90]">
              <span className="font-medium text-[#0DBACC]">טיפ:</span> דמי
              ניהול של 0.1% לעומת 1% — ההפרש לאורך 20 שנה יכול להגיע
              למאות אלפי שקלים.
            </p>
          </div>
        </div>
      </PracticeStep>

      <PracticeStep
        number={3}
        icon={<Repeat className="w-5 h-5 text-[#9F7FE0]" />}
        iconBg="bg-[#E3D6FF]"
        title="הגדירו הוראת קבע חודשית"
        delay={0.3}
        isInView={isInView}
        isLast
      >
        <div className="space-y-2">
          <p className="text-sm text-[#7E7F90] leading-relaxed">
            זהו צעד DCA. קבעו סכום קבוע (500₪, 1,000₪, 2,000₪ — לפי
            היכולת שלכם) ותנו לו לרוץ.{' '}
            <span className="font-medium text-[#303150]">
              פעם אחת ושכוחים
            </span>
            .
          </p>
          <div className="bg-[#E6F9F9] rounded-xl p-3">
            <p className="text-xs text-[#7E7F90]">
              הכסף רשום על שמכם בטאבו — בטוח לגמרי, גם אם בית ההשקעות נסגר.
            </p>
          </div>
        </div>
      </PracticeStep>
    </div>
  );
}
