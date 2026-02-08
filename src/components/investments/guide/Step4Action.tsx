'use client';

import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft, MessageCircle, Check, X as XIcon } from 'lucide-react';
import Card from '@/components/ui/Card';

// ============================================================================
// Types
// ============================================================================

interface Step4ActionProps {
  onInView: () => void;
}

// ============================================================================
// Comparison Row
// ============================================================================

interface ComparisonRowProps {
  label: string;
  gmach: string;
  gmachType: 'negative' | 'neutral';
  sp500: string;
  sp500Type: 'positive' | 'neutral';
  delay: number;
  isInView: boolean;
}

function ComparisonRow({ label, gmach, gmachType, sp500, sp500Type, delay, isInView }: ComparisonRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className="grid grid-cols-3 gap-3 items-center"
    >
      {/* Label */}
      <div className="text-sm font-medium text-[#303150]">{label}</div>

      {/* Gmach */}
      <div className={`text-center rounded-xl p-2.5 text-xs font-medium ${
        gmachType === 'negative'
          ? 'bg-[#F18AB5]/10 text-[#F18AB5]'
          : 'bg-[#F7F7F8] text-[#7E7F90]'
      }`}>
        <div className="flex items-center justify-center gap-1">
          {gmachType === 'negative' && <XIcon className="w-3 h-3" />}
          <span>{gmach}</span>
        </div>
      </div>

      {/* S&P 500 */}
      <div className={`text-center rounded-xl p-2.5 text-xs font-medium ${
        sp500Type === 'positive'
          ? 'bg-[#0DBACC]/10 text-[#0DBACC]'
          : 'bg-[#F7F7F8] text-[#7E7F90]'
      }`}>
        <div className="flex items-center justify-center gap-1">
          {sp500Type === 'positive' && <Check className="w-3 h-3" />}
          <span>{sp500}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function Step4Action({ onInView }: Step4ActionProps) {
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
        <div className="w-10 h-10 bg-[#0DBACC]/20 rounded-xl flex items-center justify-center">
          <span className="text-[#0DBACC] font-bold text-lg">4</span>
        </div>
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-[#303150]">השורה התחתונה</h2>
          <p className="text-xs text-[#7E7F90]">סיכום והנעה לפעולה</p>
        </div>
      </div>

      {/* Comparison Table */}
      <Card className="overflow-hidden">
        <div className="p-6 space-y-5" dir="rtl">
          <h3 className="text-sm font-bold text-[#303150]">גמ״ח מול תיק מסחר עצמאי כשר</h3>

          {/* Table Header */}
          <div className="grid grid-cols-3 gap-3 items-center pb-3 border-b border-[#F7F7F8]">
            <div className="text-xs text-[#BDBDCB]">קריטריון</div>
            <div className="text-center text-xs font-medium text-[#7E7F90]">גמ״ח</div>
            <div className="text-center text-xs font-medium text-[#0DBACC]">תיק מסחר כשר</div>
          </div>

          {/* Rows */}
          <div className="space-y-3">
            <ComparisonRow
              label="מאמץ"
              gmach="גבוה"
              gmachType="negative"
              sp500="אפסי"
              sp500Type="positive"
              delay={0.1}
              isInView={isInView}
            />
            <ComparisonRow
              label="תנודתיות"
              gmach="שחיקת ערך ודאית"
              gmachType="negative"
              sp500="זמנית, רווח לטווח ארוך"
              sp500Type="positive"
              delay={0.2}
              isInView={isInView}
            />
            <ComparisonRow
              label="כשרות"
              gmach="דורש בדיקה"
              gmachType="neutral"
              sp500="היתר עסקה מהודר"
              sp500Type="positive"
              delay={0.3}
              isInView={isInView}
            />
            <ComparisonRow
              label="תוצאה אחרי 20 שנה"
              gmach="חוב שצריך להחזיר"
              gmachType="negative"
              sp500="נכס ביד, 0 חובות"
              sp500Type="positive"
              delay={0.4}
              isInView={isInView}
            />
          </div>
        </div>
      </Card>

      {/* CTA Section */}
      <Card className="overflow-hidden bg-gradient-to-br from-[#0DBACC] to-[#0DBACC]/80" padding="none">
        <div className="p-6 lg:p-8 space-y-5 text-white" dir="rtl">
          <div className="space-y-2">
            <h3 className="text-lg font-bold">מוכנים להתחיל?</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              ראיתם את ההבדל. הגיע הזמן לפעול. 
              פתיחת חשבון לוקחת 10 דקות ואפשר להתחיל גם עם 300 ש&quot;ח בחודש.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Primary CTA */}
            <button
              onClick={() => {
                // Placeholder - link to IBI or account opening
                window.open('https://www.ibi.co.il', '_blank');
              }}
              className="flex items-center justify-center gap-2 bg-white text-[#0DBACC] px-6 py-3 rounded-xl font-semibold text-sm
                         hover:bg-white/90 transition-all duration-200 shadow-lg shadow-black/10 cursor-pointer"
            >
              <span>הבנתי, בוא נפתח חשבון השתדלות</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Secondary CTA */}
            <button
              onClick={() => {
                // Placeholder - WhatsApp link
                window.open('https://wa.me/972000000000?text=שלום, אני מעוניין במידע נוסף על פתיחת תיק מסחר כשר', '_blank');
              }}
              className="flex items-center justify-center gap-2 bg-white/20 text-white px-6 py-3 rounded-xl font-medium text-sm
                         hover:bg-white/30 transition-all duration-200 border border-white/30 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>עדיין חושש? דבר איתנו</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Glossary */}
      <Card className="overflow-hidden">
        <div className="p-5 space-y-3" dir="rtl">
          <h4 className="text-xs font-bold text-[#303150]">מילון מונחים</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="text-xs text-[#7E7F90]">
              <span className="font-medium text-[#303150]">תשואה</span> = הרווח שההשקעה מייצרת
            </div>
            <div className="text-xs text-[#7E7F90]">
              <span className="font-medium text-[#303150]">תנודתיות</span> = גלים בים – הספינה מתנדנדת אבל מגיעה ליעד
            </div>
            <div className="text-xs text-[#7E7F90]">
              <span className="font-medium text-[#303150]">סל החברות הגדולות</span> = מדד S&P 500
            </div>
            <div className="text-xs text-[#7E7F90]">
              <span className="font-medium text-[#303150]">היתר עסקה</span> = הכשר הלכתי להשקעות
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

