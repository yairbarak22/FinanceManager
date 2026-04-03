'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Clock } from 'lucide-react';
import { trackCtaClickServer } from '@/lib/utils';

const PARTNER_URL =
  'https://digitalsolutions.as-invest.co.il/trade_OnBoarding/?utm_source=MyNeto&utm_medium=Link';

const springSnappy = { type: 'spring' as const, stiffness: 200, damping: 22 };

export default function InvestCtaBanner() {
  const noMotion = !!useReducedMotion();

  function handleCtaClick() {
    trackCtaClickServer('invest_article_cta');
    window.open(PARTNER_URL, '_blank', 'noopener,noreferrer');
  }

  return (
    <div
      className="rounded-2xl p-6 sm:p-8 mt-10"
      style={{
        background: 'linear-gradient(135deg, rgba(43,70,153,0.04) 0%, rgba(13,186,204,0.04) 100%)',
        border: '1px solid rgba(43,70,153,0.08)',
      }}
    >
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-1 text-center sm:text-start">
          <h3
            className="text-lg font-bold mb-1"
            style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}
          >
            מוכנים להתחיל להשקיע?
          </h3>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-heebo)' }}
          >
            אלטשולר שחם או IBI · דמי ניהול מופחתים · עד 300₪ מתנה
          </p>
        </div>
        <motion.button
          onClick={handleCtaClick}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold cursor-pointer flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
            fontFamily: 'var(--font-heebo)',
            boxShadow: '0 4px 16px rgba(43,70,153,0.25)',
          }}
          whileHover={
            noMotion
              ? undefined
              : { scale: 1.04, y: -1, boxShadow: '0 8px 24px rgba(43,70,153,0.35)' }
          }
          whileTap={noMotion ? undefined : { scale: 0.97 }}
          transition={springSnappy}
        >
          <span>לפתיחת חשבון</span>
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
        </motion.button>
      </div>
      <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} strokeWidth={2} style={{ color: '#BDBDCB' }} />
          <span
            className="text-[11px]"
            style={{ color: '#BDBDCB', fontFamily: 'var(--font-heebo)' }}
          >
            מאובטח ומפוקח
          </span>
        </div>
        <div style={{ width: 1, height: 12, background: '#E8E8ED' }} />
        <div className="flex items-center gap-1.5">
          <Clock size={13} strokeWidth={2} style={{ color: '#BDBDCB' }} />
          <span
            className="text-[11px]"
            style={{ color: '#BDBDCB', fontFamily: 'var(--font-heebo)' }}
          >
            3 דקות בלבד
          </span>
        </div>
      </div>
      <p
        className="text-[10px] mt-3 text-center sm:text-start"
        style={{ color: '#BDBDCB', fontFamily: 'var(--font-heebo)' }}
      >
        אינו מהווה ייעוץ השקעות · ההטבות לפותחי חשבון דרך MyNeto בלבד
      </p>
    </div>
  );
}
