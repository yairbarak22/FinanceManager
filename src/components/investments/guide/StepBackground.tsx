'use client';

import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Lightbulb, Sprout, TrendingUp, Armchair } from 'lucide-react';
import Card from '@/components/ui/Card';

// ============================================================================
// Types
// ============================================================================

interface StepBackgroundProps {
  onInView: () => void;
}

// ============================================================================
// Visual: Compound Interest Growth
// ============================================================================

function CompoundGrowthVisual() {
  const bars = [
    { year: 1, height: 20, deposit: 12000, total: 12000 },
    { year: 5, height: 35, deposit: 60000, total: 73000 },
    { year: 10, height: 55, deposit: 120000, total: 185000 },
    { year: 15, height: 75, deposit: 180000, total: 370000 },
    { year: 20, height: 100, deposit: 240000, total: 680000 },
  ];

  return (
    <div className="flex items-end justify-around gap-2 h-36 px-4">
      {bars.map((bar, i) => (
        <div key={bar.year} className="flex flex-col items-center gap-1 flex-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${bar.height}%` }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="w-full max-w-10 rounded-t-lg relative overflow-hidden"
          >
            {/* Deposit portion */}
            <div
              className="absolute bottom-0 w-full bg-[#69ADFF]/40"
              style={{ height: `${(bar.deposit / bar.total) * 100}%` }}
            />
            {/* Growth portion */}
            <div
              className="absolute top-0 w-full bg-[#0DBACC]"
              style={{ height: `${((bar.total - bar.deposit) / bar.total) * 100}%` }}
            />
          </motion.div>
          <span className="text-[10px] text-[#7E7F90] font-medium">שנה {bar.year}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function StepBackground({ onInView }: StepBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  useEffect(() => {
    if (isInView) {
      onInView();
    }
  }, [isInView, onInView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FFF8E1] rounded-xl flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-[#E9A800]" />
        </div>
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-[#303150]">רגע, מה זה בכלל?</h2>
          <p className="text-xs text-[#7E7F90]">רקע בסיסי שחשוב להבין לפני שמתחילים</p>
        </div>
      </div>

      {/* Card 1: What is investing? */}
      <Card className="overflow-hidden">
        <div className="p-6 space-y-4" dir="rtl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#C1DDFF]/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-[#69ADFF]" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-bold text-[#303150]">מה זה השקעה?</h3>
              <p className="text-sm text-[#7E7F90] leading-relaxed">
                השקעה זה פשוט לשים כסף בצד <span className="font-medium text-[#303150]">כדי שהוא יגדל עם הזמן</span>. 
                במקום שהכסף ישב בארון ויאבד מערכו (בגלל יוקר המחיה שעולה כל שנה), 
                אנחנו שמים אותו במקום שבו הוא יכול לעבוד בשבילנו.
              </p>
              <div className="bg-[#F7F7F8] rounded-xl p-3">
                <p className="text-xs text-[#7E7F90]">
                  <span className="font-semibold text-[#303150]">דוגמה פשוטה:</span> אם קניתם דירה לפני 20 שנה ב-300,000 ש&quot;ח, היום היא שווה הרבה יותר. הדירה לא השתנתה – הערך שלה גדל. זו השקעה.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Card 2: Compound Interest */}
      <Card className="overflow-hidden">
        <div className="p-6 space-y-4" dir="rtl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#E6F9F9] rounded-xl flex items-center justify-center flex-shrink-0">
              <Sprout className="w-6 h-6 text-[#0DBACC]" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-bold text-[#303150]">מה זה ריבית דריבית?</h3>
              <p className="text-sm text-[#7E7F90] leading-relaxed">
                <span className="font-medium text-[#0DBACC]">ריבית דריבית</span> זה כשהרווחים שהכסף שלכם מייצר 
                <span className="font-medium text-[#303150]"> גם הם מתחילים להרוויח</span>.
              </p>
              <div className="bg-[#F7F7F8] rounded-xl p-3 space-y-1.5">
                <p className="text-xs text-[#7E7F90]">
                  <span className="font-semibold text-[#303150]">דוגמה:</span> שמתם 1,000 ש&quot;ח והרווחתם 10% = 100 ש&quot;ח.
                </p>
                <p className="text-xs text-[#7E7F90]">
                  בשנה הבאה, אתם מרוויחים 10% על <span className="font-medium text-[#303150]">1,100 ש&quot;ח</span> (הקרן + הרווח) = 110 ש&quot;ח.
                </p>
                <p className="text-xs text-[#7E7F90]">
                  בשנה שאחריה: 10% על 1,210 ש&quot;ח = 121 ש&quot;ח. וככה הלאה.
                </p>
              </div>
              <p className="text-sm text-[#7E7F90] leading-relaxed">
                ככל שעובר יותר זמן, <span className="font-medium text-[#303150]">אפקט כדור השלג הזה הופך לעצום</span> – 
                הרווחים גדלים מהר יותר ויותר, בלי שתעשו שום דבר.
              </p>
            </div>
          </div>

          {/* Visual */}
          <div className="bg-[#F7F7F8] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#303150]">1,000 ש&quot;ח בחודש × 9% תשואה שנתית</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#69ADFF]/40" />
                  <span className="text-[10px] text-[#7E7F90]">הפקדות</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#0DBACC]" />
                  <span className="text-[10px] text-[#7E7F90]">רווחים מצטברים</span>
                </div>
              </div>
            </div>
            <CompoundGrowthVisual />
            <p className="text-[10px] text-[#BDBDCB] text-center">
              אחרי 20 שנה: הפקדתם 240,000 ש&quot;ח, אבל יש לכם ~680,000 ש&quot;ח. 
              <span className="text-[#0DBACC] font-medium"> הרווחים המצטברים גדולים יותר מהסכום שהפקדתם!</span>
            </p>
          </div>

          {/* Key insight */}
          <div className="bg-[#E6F9F9] rounded-xl p-4 text-center space-y-1">
            <p className="text-sm font-semibold text-[#0DBACC]">
              הסוד? זמן.
            </p>
            <p className="text-xs text-[#7E7F90]">
              ככל שמתחילים מוקדם יותר, אפקט ריבית דריבית חזק יותר.
              <br />
              לכן כדאי להתחיל כשהילדים עוד קטנים.
            </p>
          </div>
        </div>
      </Card>

      {/* Card 3: Passive Investing */}
      <Card className="overflow-hidden">
        <div className="p-6 space-y-4" dir="rtl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#E3D6FF] rounded-xl flex items-center justify-center flex-shrink-0">
              <Armchair className="w-6 h-6 text-[#9F7FE0]" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-bold text-[#303150]">מה זה השקעה פסיבית?</h3>
              <p className="text-sm text-[#7E7F90] leading-relaxed">
                יש שני סוגי השקעה:
              </p>
              <div className="space-y-2">
                <div className="bg-[#F18AB5]/10 rounded-xl p-3 border border-[#F18AB5]/20">
                  <p className="text-xs font-medium text-[#F18AB5] mb-0.5">השקעה אקטיבית (מסחר יומי)</p>
                  <p className="text-xs text-[#7E7F90]">
                    לנסות לנחש מה יעלה ומה יירד. דורש ידע, זמן, עצבים – ורוב האנשים מפסידים כסף ככה.
                  </p>
                </div>
                <div className="bg-[#0DBACC]/10 rounded-xl p-3 border border-[#0DBACC]/20">
                  <p className="text-xs font-medium text-[#0DBACC] mb-0.5">השקעה פסיבית (מה שאנחנו עושים)</p>
                  <p className="text-xs text-[#7E7F90]">
                    קונים &quot;סל&quot; של 500 החברות הגדולות בעולם, מגדירים הוראת קבע חודשית, 
                    <span className="font-medium text-[#303150]"> ושוכחים מזה ל-20 שנה</span>. 
                    בלי מסכים, בלי דופק, בלי לחץ.
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#7E7F90] leading-relaxed">
                <span className="font-medium text-[#303150]">למה פסיבי עדיף?</span> 
                {' '}מחקרים הוכיחו שלאורך 20 שנה, השקעה פסיבית מנצחת את רוב המשקיעים המקצועיים. 
                פשוט כי אף אחד לא יודע לנחש את העתיד – אבל העולם כולו ממשיך לצמוח.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

