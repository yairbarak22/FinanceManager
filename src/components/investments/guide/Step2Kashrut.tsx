'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Handshake, ShieldCheck, Plus, Minus, BookOpen } from 'lucide-react';
import Card from '@/components/ui/Card';

// ============================================================================
// Types
// ============================================================================

interface Step2KashrutProps {
  onInView: () => void;
}

// ============================================================================
// Accordion Component
// ============================================================================

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
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
          {isOpen
            ? <Minus className="w-4 h-4 text-[#0DBACC] flex-shrink-0" />
            : <Plus className="w-4 h-4 text-[#7E7F90] flex-shrink-0" />
          }
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

// ============================================================================
// Main Component
// ============================================================================

export default function Step2Kashrut({ onInView }: Step2KashrutProps) {
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
        <div className="w-10 h-10 bg-[#FFF8E1] rounded-xl flex items-center justify-center">
          <span className="text-[#E9A800] font-bold text-lg">2</span>
        </div>
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-[#303150]">איך זה מסתדר עם ההלכה?</h2>
          <p className="text-xs text-[#7E7F90]">המחסום הדתי</p>
        </div>
      </div>

      {/* Kashrut Card - Golden Border */}
      <Card className="overflow-hidden border-2 border-[#E9A800]/30">
        <div className="p-6 space-y-6" dir="rtl">
          {/* Header Badge */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#E9A800]" />
            <h3 className="text-sm font-bold text-[#303150]">הכשרות</h3>
          </div>

          {/* Loan vs Partnership */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#FFF8E1] rounded-xl flex items-center justify-center flex-shrink-0">
              <Handshake className="w-6 h-6 text-[#E9A800]" />
            </div>
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-semibold text-[#303150]">ההבדל בין הלוואה לשותפות</h4>
              <div className="space-y-3">
                <div className="bg-[#F18AB5]/10 rounded-xl p-3 border border-[#F18AB5]/20">
                  <p className="text-xs font-medium text-[#F18AB5] mb-0.5">הלוואה (בעייתי)</p>
                  <p className="text-sm text-[#7E7F90]">
                    בגמ״ח או בפיקדון בבנק – אתם <span className="font-medium text-[#303150]">מלווים כסף</span>. 
                    זו בעיית ריבית.
                  </p>
                </div>
                <div className="bg-[#0DBACC]/10 rounded-xl p-3 border border-[#0DBACC]/20">
                  <p className="text-xs font-medium text-[#0DBACC] mb-0.5">שותפות (מותר)</p>
                  <p className="text-sm text-[#7E7F90]">
                    במדד S&P 500 – אתם <span className="font-medium text-[#303150]">קונים בעלות (מניות) בחברות</span>. 
                    זו עסקה, לא הלוואה.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#F7F7F8]" />

          {/* Accordion - Heter Iska */}
          <Accordion title="מה עושים עם חברות שיש להן ריבית?">
            <div className="space-y-3">
              <p>
                קרנות הסל הישראליות (כמו <span className="font-medium text-[#303150]">הראל</span> ו<span className="font-medium text-[#303150]">קסם</span>) 
                מפוקחות הלכתית ומחזיקות ב<span className="font-medium text-[#0DBACC]">היתר עסקה למהדרין</span>.
              </p>
              <p>
                ההיתר מכשיר את כל הרווחים כעסק לכל דבר – לא כריבית. 
                זה כמו להיות שותף עסקי בחברה, לא מלווה כסף.
              </p>
              <div className="bg-[#FFF8E1] rounded-xl p-3 mt-2">
                <p className="text-xs text-[#7E7F90]">
                  <span className="font-medium text-[#E9A800]">היתר עסקה</span> – 
                  מנגנון הלכתי שהופך את מערכת היחסים מ&quot;מלווה-לווה&quot; ל&quot;שותפים עסקיים&quot;. 
                  בדומה למסחר רגיל שהותר ע&quot;י גדולי הפוסקים.
                </p>
              </div>
            </div>
          </Accordion>

          {/* Accordion - Is it gambling? */}
          <Accordion title="אבל בורסה זה הימורים, לא?">
            <div className="space-y-3">
              <p>
                <span className="font-medium text-[#303150]">מסחר יומי</span> – כן, זה דומה להימורים. ניחוש מה יקרה מחר.
              </p>
              <p>
                <span className="font-medium text-[#0DBACC]">השקעה פסיבית לטווח ארוך</span> – זו בעלות על עסקים אמיתיים. 
                500 חברות שמייצרות מוצרים, מעסיקות עובדים ומכניסות כסף. 
                זה כמו לקנות חנות ולחכות שהיא תרוויח.
              </p>
              <p className="text-xs text-[#BDBDCB]">
                ההבדל: מסחר יומי = ניחוש | השקעה פסיבית = בעלות
              </p>
            </div>
          </Accordion>

          {/* Divider */}
          <div className="border-t border-[#F7F7F8]" />

          {/* Security Seal */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#E6F9F9] rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#0DBACC]" />
            </div>
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-semibold text-[#303150]">חותמת הביטחון</h4>
              <p className="text-sm text-[#7E7F90] leading-relaxed">
                המסלולים שאנחנו מציעים מפוקחים ומאושרים הלכתית.
              </p>
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
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

