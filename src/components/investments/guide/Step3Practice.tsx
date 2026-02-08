'use client';

import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Building2, Briefcase, Bot, Info, Check } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useState } from 'react';

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
// Step Item Component
// ============================================================================

interface PracticeStepProps {
  number: number;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
  isInView: boolean;
}

function PracticeStep({ number, icon, iconBg, title, children, delay = 0, isInView }: PracticeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="relative"
    >
      {/* Connection line */}
      {number < 3 && (
        <div className="absolute right-5 top-16 bottom-0 w-px bg-[#E8E8ED]" />
      )}

      <div className="flex items-start gap-4">
        {/* Step number + icon */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center relative z-10`}>
            {icon}
          </div>
          <span className="text-[10px] font-bold text-[#BDBDCB]">שלב {number}</span>
        </div>

        {/* Content */}
        <div className="flex-1 pb-8">
          <h4 className="text-sm font-semibold text-[#303150] mb-2">{title}</h4>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface Step3PracticeProps {
  onInView: () => void;
}

export default function Step3Practice({ onInView }: Step3PracticeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  // Trigger onInView when section comes into view (must be in useEffect to avoid setState during render)
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
        <div className="w-10 h-10 bg-[#C1DDFF]/30 rounded-xl flex items-center justify-center">
          <span className="text-[#69ADFF] font-bold text-lg">3</span>
        </div>
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-[#303150]">איך תכל&apos;ס עושים את זה?</h2>
          <p className="text-xs text-[#7E7F90]">הפרקטיקה</p>
        </div>
      </div>

      {/* Steps Card */}
      <Card className="overflow-hidden">
        <div className="p-6 space-y-2" dir="rtl">
          {/* Step 1: Broker */}
          <PracticeStep
            number={1}
            icon={<Building2 className="w-5 h-5 text-[#69ADFF]" />}
            iconBg="bg-[#C1DDFF]/30"
            title="איפה הכסף יושב?"
            delay={0.1}
            isInView={isInView}
          >
            <div className="space-y-3">
              <p className="text-sm text-[#7E7F90] leading-relaxed">
                אנחנו לא משקיעים דרך הבנק (יקר ומסורבל). 
                אנחנו פותחים חשבון ב<span className="font-medium text-[#303150]">בית השקעות ישראלי מפוקח</span>.
              </p>
              {/* Broker examples */}
              <div className="flex items-center gap-2 flex-wrap">
                {['IBI', 'מיטב', 'אקסלנס'].map(name => (
                  <span
                    key={name}
                    className="text-xs font-medium text-[#303150] bg-[#F7F7F8] px-3 py-1.5 rounded-lg"
                  >
                    {name}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-[#E6F9F9] rounded-xl p-3">
                <InfoTooltip text="הכסף רשום על שמכם בטאבו. גם אם בית ההשקעות נסגר מחר – הכסף שלכם נשאר שלכם." />
                <p className="text-xs text-[#7E7F90]">
                  הכסף רשום על שמכם בטאבו – בטוח לגמרי.
                </p>
              </div>
            </div>
          </PracticeStep>

          {/* Step 2: Account Type */}
          <PracticeStep
            number={2}
            icon={<Briefcase className="w-5 h-5 text-[#0DBACC]" />}
            iconBg="bg-[#B4F1F1]"
            title="ה&quot;קופסה&quot; הנכונה"
            delay={0.2}
            isInView={isInView}
          >
            <div className="space-y-3">
              <div className="bg-[#0DBACC]/10 rounded-xl p-3 border border-[#0DBACC]/20">
                <p className="text-xs font-medium text-[#0DBACC] mb-1">המלצה:</p>
                <p className="text-sm font-semibold text-[#303150]">
                  חשבון מסחר עצמאי
                </p>
                <p className="text-xs text-[#7E7F90] mt-1">
                  פטור מעמלות קנייה בקרנות מחקות
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-[#303150]">למה זה מתאים לחרדים?</p>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#0DBACC] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#7E7F90]">
                    מאפשר הוראת קבע קטנה – אפילו 300 ש״ח בחודש
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#0DBACC] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#7E7F90]">
                    בלי ש&quot;אוכלים&quot; לכם את הכסף בעמלות
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#0DBACC] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#7E7F90]">
                    ניהול עצמאי – בלי תלות ביועץ
                  </p>
                </div>
              </div>
            </div>
          </PracticeStep>

          {/* Step 3: Standing Order */}
          <PracticeStep
            number={3}
            icon={<Bot className="w-5 h-5 text-[#9F7FE0]" />}
            iconBg="bg-[#E3D6FF]"
            title="האוטומט"
            delay={0.3}
            isInView={isInView}
          >
            <div className="space-y-3">
              <p className="text-sm text-[#7E7F90] leading-relaxed">
                מגדירים פעם אחת הוראה לקנות את המדד בכל 1 לחודש.
              </p>
              <div className="bg-[#E3D6FF]/30 rounded-xl p-4 text-center space-y-2">
                <p className="text-lg font-bold text-[#303150]">זהו.</p>
                <p className="text-sm text-[#7E7F90]">
                  לא נוגעים. לא מסתכלים. לא בודקים.
                </p>
                <p className="text-xs text-[#9F7FE0] font-medium">
                  הכסף עובד בשבילכם – ואתם לומדים בראש שקט.
                </p>
              </div>
            </div>
          </PracticeStep>
        </div>
      </Card>
    </motion.div>
  );
}

