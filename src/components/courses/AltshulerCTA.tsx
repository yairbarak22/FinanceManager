'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Check, ChevronDown, TrendingUp } from 'lucide-react';
import Card from '@/components/ui/Card';

const PARTNER_URL =
  'https://digitalsolutions.as-invest.co.il/trade_OnBoarding/?utm_source=Myneto&utm_medium=Link';

const benefits = [
  { prefix: 'גם', text: 'פתיחת חשבון מ-', highlight: '5,000 ₪', suffix: 'בלבד' },
  { prefix: 'גם', text: '', highlight: '200 ₪', suffix: 'מתנת הצטרפות בכל פתיחת חשבון' },
  { prefix: 'גם', text: 'קורס היכרות עם שוק ההון', highlight: 'בחינם', suffix: '' },
  {
    prefix: 'גם',
    text: 'שיעורי הדרכה בלייב על הצעדים הראשונים במערכת',
    highlight: 'בחינם',
    suffix: '',
  },
];

export default function AltshulerCTA() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
    >
      <Card padding="none">
        {/* Collapsed header -- always visible */}
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-4 p-6 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0DBACC]/8 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-[#0DBACC]" strokeWidth={1.75} />
            </div>
            <div className="text-right">
              <p className="text-[0.9375rem] font-bold text-[#303150] leading-tight">
                פתיחת חשבון מסחר באלטשולר שחם
              </p>
              <p className="text-[0.75rem] text-[#7E7F90] font-medium mt-0.5">
                במבצע מיוחד בשיתוף MyNeto
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5 text-[#BDBDCB]" strokeWidth={1.75} />
          </motion.div>
        </button>

        {/* Expandable content */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6">
                {/* Divider */}
                <div className="h-px bg-[#F7F7F8] mb-6" />

                {/* Main benefit */}
                <div
                  className="py-4 px-5 rounded-2xl text-center mb-6"
                  style={{
                    background: 'rgba(13,186,204,0.05)',
                    border: '1px solid rgba(13,186,204,0.12)',
                  }}
                >
                  <p className="text-[1.125rem] sm:text-[1.25rem] font-bold text-[#303150] leading-snug">
                    פטור מלא מדמי ניהול!
                  </p>
                  <p className="text-[0.8125rem] text-[#0DBACC] font-medium mt-1">
                    ללא הגבלת זמן
                  </p>
                </div>

                {/* Standing order highlight */}
                <div className="flex items-start gap-3 mb-6 py-3 px-4 rounded-xl bg-[#F7F7F8]">
                  <div className="w-1 min-h-[2.5rem] rounded-full bg-[#0DBACC]/25 flex-shrink-0 mt-0.5" />
                  <p className="text-[0.8125rem] text-[#7E7F90] leading-relaxed">
                    מגדירים{' '}
                    <span className="font-bold text-[#303150]">הוראת קבע פעם אחת</span> —
                    ומהרגע הזה הכסף עובד בשבילך.
                    <br />
                    בלי להיכנס לחשבון, בלי לגעת במשהו, בלי להתעסק.
                  </p>
                </div>

                {/* Benefits list */}
                <div className="space-y-3 mb-6">
                  {benefits.map((b, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.06 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-5 h-5 rounded-lg bg-[#0DBACC]/8 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-[#0DBACC]" strokeWidth={2.5} />
                      </div>
                      <p className="text-[0.8125rem] sm:text-[0.875rem] text-[#7E7F90] leading-relaxed">
                        <span className="font-semibold text-[#0DBACC]">{b.prefix} </span>
                        {b.text && <span>{b.text}</span>}
                        <span className="font-bold text-[#303150] mx-0.5">{b.highlight}</span>
                        {b.suffix && <span>{b.suffix}</span>}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.a
                  href={PARTNER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-medium text-[0.875rem] text-white cursor-pointer"
                >
                  <span>לפתיחת חשבון מסחר</span>
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
                </motion.a>

                <p className="text-center text-[0.75rem] text-[#BDBDCB] mt-3">
                  ההטבות בתוקף לפותחי חשבון דרך MyNeto בלבד
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
