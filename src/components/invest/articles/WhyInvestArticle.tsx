'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Lightbulb,
  TrendingDown,
  Sprout,
  BarChart3,
  AlertCircle,
  ChevronsDown,
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
        targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

/* ── Section wrapper with inView ───────────────────────────── */

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

/* ── Main Article ──────────────────────────────────────────── */

export default function WhyInvestArticle() {
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section4Ref = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-8">
      {/* ── Section 1: Inflation ──────────────────────── */}
      <AnimatedSection>
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFF8E1] rounded-xl flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-[#E9A800]" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-[#303150]">
              למה כדאי להשקיע?
            </h2>
            <p className="text-xs text-[#7E7F90]">
              3 דברים שחשוב להבין לפני שמתחילים
            </p>
          </div>
        </div>

        {/* Card: Inflation */}
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
                  אינפלציה היא עליית מחירים כללית במשק. בישראל, הממוצע
                  בעשורים האחרונים עומד על כ-
                  <span className="font-medium text-[#303150]">
                    2-3% בשנה
                  </span>
                  . זה אומר שכסף שיושב בעו&quot;ש{' '}
                  <span className="font-medium text-[#303150]">
                    מפסיד ערך בכל יום שעובר
                  </span>
                  .
                </p>
                <div className="bg-[#F7F7F8] rounded-xl p-3 space-y-1.5">
                  <p className="text-xs text-[#7E7F90]">
                    <span className="font-semibold text-[#303150]">
                      דוגמה:
                    </span>{' '}
                    100,000₪ היום שווים בכוח קנייה:
                  </p>
                  <p className="text-xs text-[#7E7F90]">
                    אחרי 5 שנים:{' '}
                    <span className="font-semibold text-[#303150]">
                      ~₪86,000
                    </span>{' '}
                    · אחרי 10 שנים:{' '}
                    <span className="font-semibold text-[#303150]">
                      ~₪74,000
                    </span>{' '}
                    · אחרי 20 שנים:{' '}
                    <span className="font-semibold text-[#303150]">
                      ~₪55,000
                    </span>
                  </p>
                </div>
                <div className="bg-[#F7F7F8] rounded-xl p-3 space-y-1.5">
                  <p className="text-xs text-[#7E7F90]">
                    <span className="font-semibold text-[#303150]">
                      ההבדל מחיסכון:
                    </span>{' '}
                    חיסכון שומר על הכסף. אינפלציה אוכלת אותו. השקעה גורמת
                    לכסף{' '}
                    <span className="font-medium text-[#303150]">
                      לגדול מהר יותר מהאינפלציה
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={section2Ref} label="מה עושים עם זה?" />

      {/* ── Section 2: Compound Interest ──────────────── */}
      <AnimatedSection
        onRef={(el) => {
          (section2Ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
      >
        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#E6F9F9] rounded-xl flex items-center justify-center flex-shrink-0">
                <Sprout className="w-6 h-6 text-[#0DBACC]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">
                  ריבית דריבית — כדור השלג
                </h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  <span className="font-medium text-[#0DBACC]">
                    ריבית דריבית
                  </span>{' '}
                  זה כשהרווחים שהכסף שלכם מייצר{' '}
                  <span className="font-medium text-[#303150]">
                    גם הם מתחילים להרוויח
                  </span>
                  . ככל שעובר יותר זמן, אפקט כדור השלג הזה הופך לעצום.
                </p>
                <div className="bg-[#F7F7F8] rounded-xl p-3 space-y-1.5">
                  <p className="text-xs text-[#7E7F90]">
                    <span className="font-semibold text-[#303150]">
                      דוגמה:
                    </span>{' '}
                    1,000₪ בחודש × תשואה 8%
                  </p>
                  <p className="text-xs text-[#7E7F90]">
                    אחרי 5 שנים:{' '}
                    <span className="font-semibold text-[#303150]">
                      ~₪74,000
                    </span>{' '}
                    · 10 שנים:{' '}
                    <span className="font-semibold text-[#303150]">
                      ~₪186,000
                    </span>{' '}
                    · 20 שנים:{' '}
                    <span className="font-semibold text-[#303150]">
                      ~₪590,000
                    </span>
                  </p>
                  <p className="text-xs text-[#7E7F90]">
                    סך הפקדות: 240,000₪. הרווח מריבית דריבית:{' '}
                    <span className="font-semibold text-[#0DBACC]">
                      ~₪350,000
                    </span>{' '}
                    — כמעט כפול ממה שהפקדתם!
                  </p>
                </div>
                <div className="bg-[#F7F7F8] rounded-xl p-3 space-y-1.5">
                  <p className="text-xs text-[#7E7F90]">
                    <span className="font-semibold text-[#303150]">
                      כלל 72:
                    </span>{' '}
                    חלקו 72 בתשואה השנתית כדי לדעת תוך כמה שנים הכסף יוכפל.
                    בתשואה של 8%: 72÷8 ={' '}
                    <span className="font-semibold text-[#303150]">
                      9 שנים
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Key insight */}
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

      <ScrollToNext targetRef={section3Ref} label="כמה זה שווה?" />

      {/* ── Section 3: Channel Comparison ─────────────── */}
      <AnimatedSection
        onRef={(el) => {
          (section3Ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
      >
        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-5" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#C1DDFF]/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-[#69ADFF]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">
                  השוואת אפיקים
                </h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  מה קורה ל-
                  <span className="font-medium text-[#303150]">
                    ₪100,000 + ₪1,000/חודש
                  </span>{' '}
                  אחרי 20 שנה?
                </p>
              </div>
            </div>

            {/* Comparison boxes — staggered */}
            <ComparisonBoxes />

            {/* Key insight */}
            <div className="bg-[#E6F9F9] rounded-xl p-4 text-center space-y-1">
              <p className="text-sm font-semibold text-[#0DBACC]">
                ההפרש: ~₪700,000
              </p>
              <p className="text-xs text-[#7E7F90]">
                בין מסחר עצמאי לחיסכון בבנק — על אותו סכום הפקדה בדיוק.
              </p>
            </div>
          </div>
        </Card>
      </AnimatedSection>

      <ScrollToNext targetRef={section4Ref} label="מה חשוב לזכור?" />

      {/* ── Section 4: Important Notes ────────────────── */}
      <AnimatedSection
        onRef={(el) => {
          (section4Ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
      >
        <Card className="overflow-hidden" padding="none">
          <div className="p-6 space-y-4" dir="rtl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#F18AB5]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-[#F18AB5]" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-bold text-[#303150]">
                  חשוב לזכור
                </h3>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  תשואות עבר{' '}
                  <span className="font-medium text-[#303150]">
                    אינן מבטיחות
                  </span>{' '}
                  תשואות עתידיות. השקעה בשוק ההון כרוכה בסיכון, כולל אפשרות
                  להפסד. יחד עם זאת, ההיסטוריה מראה שמי שנשאר בשוק לאורך
                  זמן — בדרך כלל מרוויח.
                </p>
                <div className="bg-[#F7F7F8] rounded-xl p-3 space-y-1.5">
                  <p className="text-xs text-[#7E7F90]">
                    <span className="font-semibold text-[#303150]">
                      אופק השקעה:
                    </span>{' '}
                    מינימלי 5 שנים, אידיאלי 10 שנים ומעלה.
                  </p>
                  <p className="text-xs text-[#7E7F90]">
                    <span className="font-semibold text-[#303150]">
                      הסיכון הגדול ביותר:
                    </span>{' '}
                    לא להשקיע בכלל — ולתת לאינפלציה לאכול את הכסף.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Blockquote */}
        <blockquote
          className="border-e-4 border-[#69ADFF] pe-4 py-2 text-[#7E7F90] italic text-sm"
          dir="rtl"
        >
          &ldquo;הזמן הכי טוב להתחיל להשקיע היה לפני 20 שנה. הזמן השני הכי
          טוב — היום.&rdquo;
          <br />
          <span className="not-italic font-bold text-[#303150]">
            וורן באפט
          </span>
        </blockquote>

        {/* Disclaimer */}
        <p className="text-[10px] text-[#BDBDCB] text-center leading-relaxed">
          הנתונים להמחשה בלבד, מבוססים על תשואה שנתית ממוצעת היסטורית. אינם
          מהווים הבטחה לתשואה עתידית. האמור אינו מהווה ייעוץ השקעות.
        </p>
      </AnimatedSection>
    </div>
  );
}

/* ── Comparison Boxes (staggered animation) ────────────────── */

function ComparisonBoxes() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  const channels = [
    {
      label: 'מסחר עצמאי',
      detail: '8% תשואה · 0% דמי ניהול',
      value: '~₪1,050,000',
      bg: 'bg-[#0DBACC]/10',
      border: 'border-[#0DBACC]/20',
      color: 'text-[#0DBACC]',
    },
    {
      label: 'קופת גמל',
      detail: '8% תשואה · 0.7-1% דמי ניהול',
      value: '~₪960,000',
      bg: 'bg-[#69ADFF]/10',
      border: 'border-[#69ADFF]/20',
      color: 'text-[#69ADFF]',
    },
    {
      label: 'חיסכון בבנק',
      detail: '2% ריבית',
      value: '~₪390,000',
      bg: 'bg-[#F18AB5]/10',
      border: 'border-[#F18AB5]/20',
      color: 'text-[#F18AB5]',
    },
    {
      label: 'גמ"ח',
      detail: '0% תשואה',
      value: '~₪340,000',
      bg: 'bg-[#F7F7F8]',
      border: 'border-[#E8E8ED]',
      color: 'text-[#BDBDCB]',
    },
  ];

  return (
    <div ref={ref} className="space-y-2">
      {channels.map((ch, i) => (
        <motion.div
          key={ch.label}
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
          className={`${ch.bg} rounded-xl p-3 border ${ch.border} flex items-center justify-between`}
        >
          <div>
            <p className={`text-xs font-medium ${ch.color}`}>{ch.label}</p>
            <p className="text-[10px] text-[#7E7F90]">{ch.detail}</p>
          </div>
          <span className={`text-sm font-bold ${ch.color}`}>{ch.value}</span>
        </motion.div>
      ))}
      <p className="text-[10px] text-[#BDBDCB]">
        * הנתונים להמחשה בלבד, מבוססים על תשואה שנתית ממוצעת היסטורית.
      </p>
    </div>
  );
}
