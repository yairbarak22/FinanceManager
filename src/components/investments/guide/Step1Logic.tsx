'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShoppingCart, Globe, BarChart3, Info } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import Card from '@/components/ui/Card';

// ============================================================================
// Historical S&P 500 Data (approximate, inflation-adjusted)
// ============================================================================

const SP500_FULL_DATA = [
  { year: 1935, value: 10, event: '' },
  { year: 1937, value: 13, event: '' },
  { year: 1938, value: 8, event: '' },
  { year: 1940, value: 11, event: '' },
  { year: 1942, value: 9, event: '' },
  { year: 1945, value: 16, event: 'סוף מלה"ע ה-2' },
  { year: 1948, value: 15, event: '' },
  { year: 1950, value: 20, event: '' },
  { year: 1955, value: 40, event: '' },
  { year: 1960, value: 56, event: '' },
  { year: 1965, value: 87, event: '' },
  { year: 1968, value: 100, event: '' },
  { year: 1970, value: 83, event: '' },
  { year: 1973, value: 107, event: '' },
  { year: 1974, value: 68, event: 'משבר הנפט' },
  { year: 1976, value: 102, event: '' },
  { year: 1980, value: 118, event: '' },
  { year: 1982, value: 103, event: '' },
  { year: 1985, value: 186, event: '' },
  { year: 1987, value: 247, event: 'יום שני השחור' },
  { year: 1988, value: 258, event: '' },
  { year: 1990, value: 334, event: '' },
  { year: 1993, value: 452, event: '' },
  { year: 1995, value: 541, event: '' },
  { year: 1997, value: 873, event: '' },
  { year: 1999, value: 1327, event: '' },
  { year: 2000, value: 1469, event: 'בועת הדוט-קום' },
  { year: 2002, value: 880, event: '' },
  { year: 2003, value: 964, event: '' },
  { year: 2005, value: 1181, event: '' },
  { year: 2007, value: 1468, event: '' },
  { year: 2008, value: 903, event: 'משבר 2008' },
  { year: 2009, value: 931, event: '' },
  { year: 2010, value: 1139, event: '' },
  { year: 2012, value: 1426, event: '' },
  { year: 2014, value: 2059, event: '' },
  { year: 2016, value: 2239, event: '' },
  { year: 2018, value: 2507, event: '' },
  { year: 2019, value: 3231, event: '' },
  { year: 2020, value: 2237, event: 'קורונה' },
  { year: 2021, value: 4766, event: '' },
  { year: 2022, value: 3840, event: '' },
  { year: 2023, value: 4770, event: '' },
  { year: 2024, value: 5880, event: '' },
  { year: 2025, value: 6050, event: '' },
];

// Events with significant crashes for annotation
const CRASH_EVENTS = SP500_FULL_DATA.filter(d => d.event !== '');

// ============================================================================
// Tooltip Component
// ============================================================================

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="text-[#BDBDCB] hover:text-[#7E7F90] transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        aria-label="מידע נוסף"
      >
        <Info className="w-4 h-4" />
      </button>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full right-0 mb-2 w-60 bg-[#303150] text-white text-xs p-3 rounded-xl shadow-lg z-50 leading-relaxed"
        >
          {text}
        </motion.div>
      )}
    </span>
  );
}

// ============================================================================
// Custom Chart Tooltip
// ============================================================================

// Current value of S&P 500 (2025)
const SP500_CURRENT_VALUE = SP500_FULL_DATA[SP500_FULL_DATA.length - 1].value;

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;

  const yearValue = payload[0].value;
  const year = Number(label);
  const dataPoint = SP500_FULL_DATA.find(d => d.year === year);

  // Calculate how much 1,000 ILS invested at that year would be worth today
  const returnValue = yearValue > 0
    ? Math.round((SP500_CURRENT_VALUE / yearValue) * 1000)
    : 0;

  return (
    <div className="bg-[#303150] text-white text-xs p-3 rounded-xl shadow-lg min-w-[200px]" dir="rtl">
      <p className="font-semibold">{label}</p>
      <p className="text-[#0DBACC] mt-0.5">{yearValue.toLocaleString()} נקודות</p>
      {dataPoint?.event && (
        <p className="text-[#F18AB5] mt-0.5 text-[10px]">{dataPoint.event}</p>
      )}
      {year < 2025 && returnValue > 0 && (
        <div className="mt-2 pt-2 border-t border-white/20">
          <p className="text-[10px] text-white/70">אם השקעתם 1,000 ש&quot;ח ב-{year}:</p>
          <p className="text-sm font-bold text-[#0DBACC] mt-0.5">
            היום זה שווה {returnValue.toLocaleString()} ש&quot;ח
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface Step1LogicProps {
  onInView: () => void;
}

export default function Step1Logic({ onInView }: Step1LogicProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const [sliderYear, setSliderYear] = useState(2025);

  // Trigger onInView when section comes into view (must be in useEffect to avoid setState during render)
  useEffect(() => {
    if (isInView) {
      onInView();
    }
  }, [isInView, onInView]);

  // Filter data based on slider
  const chartData = useMemo(() => {
    return SP500_FULL_DATA.filter(d => d.year <= sliderYear);
  }, [sliderYear]);

  // Visible events for reference lines
  const visibleEvents = useMemo(() => {
    return CRASH_EVENTS.filter(d => d.year <= sliderYear);
  }, [sliderYear]);

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
        <div className="w-10 h-10 bg-[#B4F1F1] rounded-xl flex items-center justify-center">
          <span className="text-[#0DBACC] font-bold text-lg">1</span>
        </div>
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-[#303150]">למה זה עובד?</h2>
          <p className="text-xs text-[#7E7F90]">המנוע המתמטי</p>
        </div>
      </div>

      {/* Logic Card */}
      <Card className="overflow-hidden">
        <div className="p-6 space-y-5" dir="rtl">
          {/* The Logic - Direct Explanation */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#E6F9F9] rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-6 h-6 text-[#0DBACC]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[#303150]">ההיגיון</h3>
              <p className="text-sm text-[#7E7F90] leading-relaxed">
                אנחנו <span className="text-[#303150] font-medium">לא מנחשים איזו חברה תצליח</span> ואיזו תיכשל. 
                במקום זה, אנחנו קונים חלק קטן <span className="text-[#303150] font-medium">בכל 500 החברות הגדולות בעולם בבת אחת</span> – 
                דרך קרן שמחקה את מדד S&P 500.
              </p>
              <div className="bg-[#F7F7F8] rounded-xl p-3 space-y-1.5">
                <p className="text-xs text-[#7E7F90]">
                  <span className="font-semibold text-[#303150]">למה זה עובד?</span>{' '}
                  הכלכלה העולמית צומחת באופן עקבי כבר מאות שנים. חברות בודדות יכולות לקרוס, 
                  אבל כשמחזיקים את כל 500 החברות המובילות – הצמיחה הכוללת מובטחת לאורך זמן.
                </p>
                <p className="text-xs text-[#7E7F90]">
                  <span className="font-semibold text-[#303150]">ואם חברה אחת נופלת?</span>{' '}
                  היא פשוט מוחלפת בחברה חזקה יותר. המדד תמיד מעדכן את עצמו ושומר על 500 החברות הטובות ביותר.
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#F7F7F8]" />

          {/* S&P 500 Explanation */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#C1DDFF]/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Globe className="w-6 h-6 text-[#69ADFF]" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#303150]">סל החברות הגדולות בעולם</h3>
                <InfoTooltip text="מדד S&P 500 מכיל את 500 החברות הגדולות בארה״ב. זה כולל חברות כמו גוגל, אמזון, קוקה קולה, אפל ומיקרוסופט." />
              </div>
              <p className="text-sm text-[#7E7F90] leading-relaxed">
                כשאתם קונים את המדד, אתם הופכים לשותפים ב-500 החברות החזקות בעולם. 
                אם העולם מתקדם – הכסף שלכם גדל איתו.
              </p>
              {/* Company logos placeholder */}
              <div className="flex items-center gap-3 flex-wrap">
                {['Google', 'Amazon', 'Apple', 'Microsoft', 'Coca Cola'].map(name => (
                  <span
                    key={name}
                    className="text-[10px] font-medium text-[#7E7F90] bg-[#F7F7F8] px-2.5 py-1 rounded-lg"
                  >
                    {name}
                  </span>
                ))}
                <span className="text-[10px] text-[#BDBDCB]">+495 נוספות</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Chart */}
      <Card className="overflow-hidden">
        <div className="p-6 space-y-4" dir="rtl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0DBACC]" />
              <h3 className="text-sm font-semibold text-[#303150]">ההוכחה המתמטית</h3>
            </div>
            <p className="text-xs text-[#BDBDCB]">S&P 500 (1935–{sliderYear})</p>
          </div>

          {/* Chart */}
          <div className="h-56 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="sp500Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0DBACC" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0DBACC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#7E7F90', fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#7E7F90', fontSize: 10 }}
                  tickFormatter={(value) => {
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                    return `${value}`;
                  }}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} />
                {/* Crash event reference lines */}
                {visibleEvents.map(event => (
                  <ReferenceLine
                    key={event.year}
                    x={event.year}
                    stroke="#F18AB5"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                ))}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0DBACC"
                  strokeWidth={2}
                  fill="url(#sp500Gradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#0DBACC', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#7E7F90]">
              מה קרה ב-90 השנים האחרונות?
            </label>
            <div dir="ltr">
              <input
                type="range"
                min={1940}
                max={2025}
                step={1}
                value={sliderYear}
                onChange={(e) => setSliderYear(Number(e.target.value))}
                className="w-full h-1.5 bg-[#E8E8ED] rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                           [&::-webkit-slider-thumb]:bg-[#0DBACC] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md
                           [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#BDBDCB] mt-1">
                <span>1940</span>
                <span className="text-xs font-semibold text-[#0DBACC]">{sliderYear}</span>
                <span>2025</span>
              </div>
            </div>
          </div>

          {/* Event tags */}
          {visibleEvents.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {visibleEvents.map(event => (
                <span
                  key={event.year}
                  className="text-[10px] text-[#F18AB5] bg-[#F18AB5]/10 px-2 py-0.5 rounded-lg"
                >
                  {event.year} {event.event}
                </span>
              ))}
            </div>
          )}

          {/* Message */}
          <div className="bg-[#E6F9F9] rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-[#0DBACC]">
              הזמן הוא החבר הכי טוב שלכם.
            </p>
            <p className="text-xs text-[#7E7F90] mt-1">
              גם כשהיו מלחמות, משברים ומגפות – המדד תמיד תיקן את עצמו ועלה למעלה.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

