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

          {/* What makes index funds kosher? */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#FFF8E1] rounded-xl flex items-center justify-center flex-shrink-0">
              <Handshake className="w-6 h-6 text-[#E9A800]" />
            </div>
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-semibold text-[#303150]">מה הופך קרנות מחקות מדד לכשרות?</h4>
              <p className="text-sm text-[#7E7F90] leading-relaxed">
                קניית מניות היא <span className="font-medium text-[#303150]">קניית בעלות חלקית בחברה – לא הלוואה</span>. 
                כשאתם קונים מניה של אפל או גוגל, אתם שותפים בעסק. 
                הרווח שלכם מגיע מצמיחת ערך העסק – לא מריבית על הלוואה. 
                לכן, עצם קניית מניות היא עסקה כשרה לחלוטין.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#F7F7F8]" />

          {/* Accordion - Heter Iska for bonds/interest within the fund */}
          <Accordion title="מה לגבי אגרות חוב וחברות שמלוות כסף?">
            <div className="space-y-3">
              <p>
                חלק מהחברות במדד S&P 500 עוסקות בהלוואות (בנקים, חברות אשראי). 
                בנוסף, חלק מהקרנות מחזיקות באגרות חוב. 
                כאן נכנס <span className="font-medium text-[#0DBACC]">היתר עסקה</span> לתמונה.
              </p>
              <p>
                קרנות הסל הישראליות המחקות את המדד (כמו <span className="font-medium text-[#303150]">הראל</span>, <span className="font-medium text-[#303150]">קסם</span>, <span className="font-medium text-[#303150]">תכלית</span> ו<span className="font-medium text-[#303150]">מגדל</span>) 
                פועלות תחת <span className="font-medium text-[#0DBACC]">היתר עסקה למהדרין</span> – 
                מנגנון הלכתי מוכר ומקובל על גדולי הפוסקים, 
                שמגדיר את מערכת היחסים כ<span className="font-medium text-[#303150]">שותפות עסקית</span> ולא כהלוואה בריבית.
              </p>
              <div className="bg-[#FFF8E1] rounded-xl p-3 mt-2">
                <p className="text-xs text-[#7E7F90]">
                  <span className="font-medium text-[#E9A800]">היתר עסקה</span> – 
                  שטר הלכתי שמגדיר שהכסף שניתן אינו הלוואה אלא השקעה משותפת בעסק. 
                  הרווחים הם חלק היחסי של המשקיע ברווחי העסק, ולא ריבית. 
                  המנגנון מקובל על הפוסקים כבר מאות שנים ומשמש גם בבנקים ובחברות ביטוח בישראל.
                </p>
              </div>
            </div>
          </Accordion>

          {/* Accordion - Which funds are kosher? */}
          <Accordion title="אילו קרנות מחקות מדד כשרות למהדרין?">
            <div className="space-y-3">
              <p>
                <span className="font-medium text-[#303150]">קרנות מחקות מדד ישראליות</span> – 
                קרנות הסל הנסחרות בבורסה בתל אביב שמחקות את S&P 500 
                פועלות תחת פיקוח רשות ני&quot;ע הישראלית 
                ומחזיקות בהיתר עסקה. 
                זה כולל קרנות של הראל, קסם, תכלית, מגדל ועוד.
              </p>
              <p>
                <span className="font-medium text-[#303150]">מה חשוב לבדוק?</span>{' '}
                לפני רכישה, ודאו שהקרן מחזיקה ב<span className="font-medium text-[#0DBACC]">היתר עסקה בתוקף</span>. 
                ברוב המקרים, הדבר מצוין באתר חברת הקרן. 
                ההיתר מכסה את כל מרכיבי הקרן – כולל חברות פיננסיות ומכשירים שעשויים לכלול מרכיב של הלוואה.
              </p>
              <div className="bg-[#FFF8E1] rounded-xl p-3 mt-2">
                <p className="text-xs text-[#7E7F90]">
                  <span className="font-medium text-[#E9A800]">שימו לב:</span>{' '}
                  קרנות מחקות מדד אמריקאיות (כמו VOO או SPY) אינן מחזיקות בהיתר עסקה. 
                  לכן, עדיף לרכוש קרנות ישראליות שמחקות את אותו מדד ופועלות תחת פיקוח הלכתי.
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
              <h4 className="text-sm font-semibold text-[#303150]">סיכום: למה זה כשר?</h4>
              <div className="space-y-1.5">
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  <span className="font-medium text-[#303150]">1.</span> קניית מניות = בעלות בעסק, לא הלוואה בריבית.
                </p>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  <span className="font-medium text-[#303150]">2.</span> קרנות ישראליות מחזיקות בהיתר עסקה למהדרין שמכסה את כל מרכיבי הקרן.
                </p>
                <p className="text-sm text-[#7E7F90] leading-relaxed">
                  <span className="font-medium text-[#303150]">3.</span> הקרנות מפוקחות גם הלכתית וגם רגולטורית (רשות ני&quot;ע).
                </p>
              </div>
              {/* Certification badges */}
              <div className="flex items-center gap-2 flex-wrap mt-2">
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

