'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Check, ChevronDown, TrendingUp } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackCtaClickServer } from '@/lib/utils';

const PARTNER_URL =
  'https://digitalsolutions.as-invest.co.il/trade_OnBoarding/?utm_source=Myneto&utm_medium=Link';

const benefits = [
  { text: 'פתיחת חשבון מ-', highlight: '5,000 ₪', suffix: 'בלבד' },
  { text: '', highlight: '200 ₪', suffix: 'מתנת הצטרפות' },
  { text: 'קורס היכרות עם שוק ההון', highlight: 'בחינם', suffix: '' },
  { text: 'שיעורי הדרכה בלייב', highlight: 'בחינם', suffix: '' },
];

interface AltshulerSidebarCTAProps {
  isCollapsed: boolean;
}

export default function AltshulerSidebarCTA({ isCollapsed }: AltshulerSidebarCTAProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { trackOpenTradingAccountClicked } = useAnalytics();

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-3 border-t border-[#F7F7F8]">
        <a
          href={PARTNER_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { trackOpenTradingAccountClicked('course_sidebar'); trackCtaClickServer('course_sidebar'); }}
          className="w-8 h-8 rounded-full bg-[#0DBACC]/10 flex items-center justify-center transition-transform duration-150 hover:scale-110"
          title="פתיחת חשבון מסחר באלטשולר שחם"
        >
          <TrendingUp className="w-3.5 h-3.5 text-[#0DBACC]" strokeWidth={2} />
        </a>
      </div>
    );
  }

  return (
    <div className="border-t border-[#F7F7F8]">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-[#F7F7F8] transition-colors duration-150 cursor-pointer"
      >
        <div className="w-7 h-7 rounded-lg bg-[#0DBACC]/8 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-[#0DBACC]" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[0.75rem] font-bold text-[#303150] truncate leading-tight">
            פתיחת חשבון מסחר
          </p>
          <p className="text-[0.625rem] text-[#BDBDCB] mt-px truncate">
            במבצע מיוחד בשיתוף MyNeto
          </p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-3.5 h-3.5 text-[#BDBDCB]" strokeWidth={1.75} />
        </motion.div>
      </button>

      {/* Expandable details */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Main benefit */}
              <div
                className="py-2.5 px-3 rounded-xl text-center mb-3"
                style={{
                  background: 'rgba(13,186,204,0.05)',
                  border: '1px solid rgba(13,186,204,0.1)',
                }}
              >
                <p className="text-[0.8125rem] font-bold text-[#303150] leading-snug">
                  פטור מלא מדמי ניהול!
                </p>
                <p className="text-[0.625rem] text-[#0DBACC] font-medium mt-0.5">
                  ללא הגבלת זמן
                </p>
              </div>

              {/* Standing order */}
              <p className="text-[0.6875rem] text-[#7E7F90] leading-relaxed mb-3 px-1">
                <span className="font-bold text-[#303150]">הוראת קבע פעם אחת</span> — ומהרגע הזה הכסף עובד בשבילך, בלי לגעת במשהו.
              </p>

              {/* Benefits */}
              <div className="space-y-1.5 mb-3">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-[#0DBACC] flex-shrink-0" strokeWidth={2.5} />
                    <p className="text-[0.6875rem] text-[#7E7F90] leading-snug">
                      {b.text}
                      <span className="font-bold text-[#303150]">{b.highlight}</span>
                      {b.suffix && <span> {b.suffix}</span>}
                    </p>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <a
                href={PARTNER_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { trackOpenTradingAccountClicked('course_sidebar'); trackCtaClickServer('course_sidebar'); }}
                className="btn-primary flex items-center justify-center gap-1.5 w-full py-2 rounded-xl font-medium text-[0.75rem] text-white"
              >
                <span>פתיחת חשבון</span>
                <ExternalLink className="w-3 h-3" strokeWidth={2} />
              </a>

              <p className="text-center text-[0.5625rem] text-[#BDBDCB]/70 mt-2 leading-relaxed">
                אינו מהווה ייעוץ השקעות. myNETO אינה בעלת רישיון ייעוץ.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
