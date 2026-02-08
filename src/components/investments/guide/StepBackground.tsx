'use client';

import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Lightbulb, Sprout, TrendingUp, Armchair } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import Card from '@/components/ui/Card';

// ============================================================================
// Types
// ============================================================================

interface StepBackgroundProps {
  onInView: () => void;
}

// ============================================================================
// Compound Interest Chart Data
// ============================================================================

function generateCompoundData() {
  const monthlyDeposit = 1000;
  const annualRate = 0.09;
  const monthlyRate = annualRate / 12;
  const data: { year: number; deposit: number; total: number; growth: number }[] = [];

  for (let year = 0; year <= 20; year++) {
    const months = year * 12;
    const deposit = monthlyDeposit * months;
    const growthFactor = Math.pow(1 + monthlyRate, months);
    const total = monthlyRate > 0
      ? monthlyDeposit * ((growthFactor - 1) / monthlyRate)
      : deposit;
    data.push({
      year,
      deposit: Math.round(deposit),
      total: Math.round(total),
      growth: Math.round(total - deposit),
    });
  }
  return data;
}

const COMPOUND_DATA = generateCompoundData();

// ============================================================================
// Chart Tooltip
// ============================================================================

function CompoundTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number }>; label?: number }) {
  if (!active || !payload?.length) return null;
  const deposit = payload.find(p => p.dataKey === 'deposit')?.value ?? 0;
  const total = payload.find(p => p.dataKey === 'total')?.value ?? 0;
  const growth = total - deposit;

  return (
    <div className="bg-[#303150] text-white text-xs p-3 rounded-xl shadow-lg" dir="rtl">
      <p className="font-semibold">שנה {label}</p>
      <p className="mt-1"><span className="text-[#69ADFF]">הפקדות:</span> {deposit.toLocaleString()} ש&quot;ח</p>
      <p><span className="text-[#0DBACC]">רווחים:</span> {growth.toLocaleString()} ש&quot;ח</p>
      <p className="font-semibold mt-1 border-t border-white/20 pt-1">סה&quot;כ: {total.toLocaleString()} ש&quot;ח</p>
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
                השקעה היא <span className="font-medium text-[#303150]">הקצאת הון לנכסים שצפויים לגדול בערכם לאורך זמן</span>. 
                במקום שהכסף ישב בעו&quot;ש ויאבד מכוח הקנייה שלו בגלל האינפלציה (כ-3% בשנה), 
                אנחנו מפנים אותו לעסקים פעילים שמייצרים ערך כלכלי אמיתי.
              </p>
              <div className="bg-[#F7F7F8] rounded-xl p-3 space-y-1.5">
                <p className="text-xs text-[#7E7F90]">
                  <span className="font-semibold text-[#303150]">בפועל:</span> כשאתם קונים מניה של חברה, אתם רוכשים בעלות חלקית בעסק אמיתי – 
                  עסק שמוכר מוצרים, מעסיק עובדים ומייצר רווחים. ככל שהעסק גדל, הבעלות שלכם שווה יותר.
                </p>
                <p className="text-xs text-[#7E7F90]">
                  <span className="font-semibold text-[#303150]">ההבדל מחיסכון:</span> חיסכון שומר על הכסף. השקעה גורמת לכסף לעבוד ולייצר תשואה – הכסף מרוויח כסף נוסף.
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

          {/* Visual - Compound Interest Chart */}
          <div className="bg-[#F7F7F8] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#303150]">1,000 ש&quot;ח בחודש × 9% תשואה שנתית</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#69ADFF]" />
                  <span className="text-[10px] text-[#7E7F90]">הפקדות</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#0DBACC]" />
                  <span className="text-[10px] text-[#7E7F90]">סה&quot;כ (כולל רווחים)</span>
                </div>
              </div>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={COMPOUND_DATA} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="depositGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#69ADFF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#69ADFF" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0DBACC" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0DBACC" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#7E7F90', fontSize: 10 }}
                    tickFormatter={(v) => `שנה ${v}`}
                    interval={4}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#7E7F90', fontSize: 10 }}
                    tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`}
                    width={50}
                  />
                  <Tooltip content={<CompoundTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#0DBACC"
                    strokeWidth={2}
                    fill="url(#totalGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#0DBACC', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="deposit"
                    stroke="#69ADFF"
                    strokeWidth={2}
                    fill="url(#depositGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#69ADFF', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-[#BDBDCB] text-center">
              אחרי 20 שנה: הפקדתם 240,000 ש&quot;ח, אבל יש לכם ~670,000 ש&quot;ח. 
              <span className="text-[#0DBACC] font-medium"> הפער בין שני הקווים הוא הרווח הטהור – וככל שעובר זמן, הוא גדל מהר יותר.</span>
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

              <div className="border-t border-[#F7F7F8] pt-3 space-y-3">
                <p className="text-sm font-medium text-[#303150]">למה פסיבי עדיף?</p>
                <div className="space-y-2">
                  <div className="bg-[#F7F7F8] rounded-xl p-3">
                    <p className="text-xs text-[#7E7F90]">
                      <span className="font-semibold text-[#303150]">92% מהמנהלים המקצועיים מפסידים למדד.</span>{' '}
                      לפי דוח SPIVA של S&P Global, לאורך 15 שנה רוב מנהלי הקרנות האקטיביות בארה&quot;ב לא הצליחו להכות את מדד S&P 500. אם המקצוענים לא מצליחים – למה לנסות?
                    </p>
                  </div>
                  <div className="bg-[#F7F7F8] rounded-xl p-3">
                    <p className="text-xs text-[#7E7F90]">
                      <span className="font-semibold text-[#303150]">עלויות נמוכות משמעותית.</span>{' '}
                      דמי ניהול של קרן מחקה מדד: 0.1%-0.3%. קרן אקטיבית: 1%-2%. ההפרש הזה לאורך 20 שנה יכול להגיע למאות אלפי שקלים.
                    </p>
                  </div>
                  <div className="bg-[#F7F7F8] rounded-xl p-3">
                    <p className="text-xs text-[#7E7F90]">
                      <span className="font-semibold text-[#303150]">פיזור מקסימלי, סיכון מינימלי.</span>{' '}
                      במקום לשים את כל הכסף על חברה אחת או שתיים, אתם מפוזרים על 500 חברות מכל התחומים – טכנולוגיה, בריאות, צריכה, אנרגיה. אם חברה אחת נופלת, האחרות מאזנות.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

