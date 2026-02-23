'use client';

import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft, Check, PlayCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface Step4ActionProps {
  onInView: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export default function Step4Action({ onInView }: Step4ActionProps) {
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
        <div className="w-10 h-10 bg-[#0DBACC]/20 rounded-xl flex items-center justify-center">
          <span className="text-[#0DBACC] font-bold text-lg">4</span>
        </div>
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-[#303150]">השורה התחתונה</h2>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="overflow-hidden">
        <div className="p-6 space-y-5" dir="rtl">
          <h3 className="text-sm font-bold text-[#303150]">מה למדנו?</h3>

          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 bg-[#0DBACC]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-[#0DBACC]" />
              </div>
              <p className="text-sm text-[#7E7F90]">
                <span className="font-medium text-[#303150]">השקעה פסיבית</span> – קונים חלק בכל 500 החברות הגדולות בעולם ונותנים לכלכלה לעבוד בשבילנו.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 bg-[#0DBACC]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-[#0DBACC]" />
              </div>
              <p className="text-sm text-[#7E7F90]">
                <span className="font-medium text-[#303150]">ריבית דריבית</span> – הרווחים מייצרים רווחים נוספים, ולאורך 20 שנה האפקט הזה עצום.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 bg-[#0DBACC]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-[#0DBACC]" />
              </div>
              <p className="text-sm text-[#7E7F90]">
                <span className="font-medium text-[#303150]">כשר למהדרין</span> – קרנות ישראליות מחקות מדד פועלות תחת היתר עסקה ופיקוח הלכתי.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 bg-[#0DBACC]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-[#0DBACC]" />
              </div>
              <p className="text-sm text-[#7E7F90]">
                <span className="font-medium text-[#303150]">מאמץ אפסי</span> – מגדירים הוראת קבע פעם אחת, ומכאן הכל עובד לבד.
              </p>
            </motion.div>
          </div>
        </div>
      </Card>

      {/* Video Course CTA */}
      <Card className="overflow-hidden bg-gradient-to-br from-[#0DBACC] to-[#0DBACC]/80" padding="none">
        <div className="p-6 lg:p-8 space-y-5 text-white" dir="rtl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-white/90" />
              <h3 className="text-lg font-bold">מוכנים להתחיל?</h3>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              להתחלה פשוטה ובטוחה הכנו לך קורס וידאו קצר שייקח אותך יד ביד — 
              מפתיחת חשבון ועד ההשקעה הראשונה שלך. בלי סיבוכים, בלי מילים גדולות.
            </p>
          </div>

          <Link
            href="/courses"
            className="flex items-center justify-center gap-2 bg-white text-[#0DBACC] px-6 py-3.5 rounded-xl font-semibold text-sm
                       hover:bg-white/90 transition-all duration-200 shadow-lg shadow-black/10 w-full"
          >
            <span>לצפייה בקורס הוידאו</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
