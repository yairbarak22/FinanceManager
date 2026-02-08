'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft, MessageCircle, Check, Loader2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useAnalytics } from '@/hooks/useAnalytics';
import { apiFetch } from '@/lib/utils';
import ContactModal from './ContactModal';

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
  const analytics = useAnalytics();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [guideStatus, setGuideStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  // Trigger onInView when section comes into view (must be in useEffect to avoid setState during render)
  useEffect(() => {
    if (isInView) {
      onInView();
    }
  }, [isInView, onInView]);

  const handleRequestGuide = async () => {
    if (guideStatus === 'loading' || guideStatus === 'sent') return;

    setGuideStatus('loading');
    analytics.trackIBIButtonClicked(0);

    try {
      const res = await apiFetch('/api/investments/send-guide', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          // User not logged in - redirect to login
          window.location.href = '/login';
          return;
        }
        throw new Error(data.error || 'Failed');
      }

      setGuideStatus('sent');
    } catch {
      setGuideStatus('error');
      setTimeout(() => setGuideStatus('idle'), 3000);
    }
  };

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

      {/* CTA Section */}
      <Card className="overflow-hidden bg-gradient-to-br from-[#0DBACC] to-[#0DBACC]/80" padding="none">
        <div className="p-6 lg:p-8 space-y-5 text-white" dir="rtl">
          <div className="space-y-2">
            <h3 className="text-lg font-bold">מוכנים להתחיל?</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              הגיע הזמן לפעול. 
              פתיחת חשבון לוקחת 10 דקות ואפשר להתחיל גם עם 300 ש&quot;ח בחודש.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Primary CTA */}
            <button
              onClick={handleRequestGuide}
              disabled={guideStatus === 'loading' || guideStatus === 'sent'}
              className="flex items-center justify-center gap-2 bg-white text-[#0DBACC] px-6 py-3 rounded-xl font-semibold text-sm
                         hover:bg-white/90 transition-all duration-200 shadow-lg shadow-black/10 cursor-pointer
                         disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {guideStatus === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>שולח...</span>
                </>
              ) : guideStatus === 'sent' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>המדריך נשלח למייל שלך!</span>
                </>
              ) : guideStatus === 'error' ? (
                <span>שגיאה, נסו שוב</span>
              ) : (
                <>
                  <span>לחץ כאן וקבל בחינם מדריך מפורט צעד אחרי צעד לפתיחת חשבון</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Secondary CTA */}
            <button
              onClick={() => {
                analytics.trackIBIButtonClicked(0);
                setIsContactModalOpen(true);
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

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </motion.div>
  );
}
