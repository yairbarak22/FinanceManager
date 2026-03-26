'use client';

import { motion } from 'framer-motion';
import { PieChart, ArrowLeft, Construction } from 'lucide-react';
import { trackCtaClickServer } from '@/lib/utils';

const PARTNER_URL =
  'https://digitalsolutions.as-invest.co.il/trade_OnBoarding/?utm_source=MyNeto&utm_medium=Link';

function handleCtaClick() {
  trackCtaClickServer('funnel_placeholder_cta');
  window.open(PARTNER_URL, '_blank', 'noopener,noreferrer');
}

interface FunnelPageShellProps {
  title: string;
  subtitle: string;
}

export default function FunnelPageShell({ title, subtitle }: FunnelPageShellProps) {
  return (
    <>
      {/* Hero */}
      <section
        className="relative min-h-[70vh] flex items-center overflow-hidden"
        style={{ background: '#F5F5F7' }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            width: '80vw',
            height: '80vh',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(ellipse at center, rgba(43,70,153,0.04) 0%, rgba(13,186,204,0.02) 40%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center pt-28 pb-20">
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.1] mb-6"
            style={{
              color: '#1D1D1F',
              fontFamily: 'var(--font-heebo)',
              letterSpacing: '-0.02em',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {title}
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg mb-10 max-w-lg mx-auto leading-relaxed"
            style={{ color: '#6E6E73', fontFamily: 'var(--font-heebo)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <motion.button
              onClick={handleCtaClick}
              className="relative inline-flex items-center gap-2 px-8 py-3.5 sm:px-10 sm:py-4 rounded-2xl text-white text-base sm:text-lg font-bold cursor-pointer overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #2B4699, #0DBACC)',
                fontFamily: 'var(--font-heebo)',
                boxShadow: '0 4px 24px rgba(43,70,153,0.4)',
              }}
              whileHover={{
                scale: 1.04,
                y: -3,
                boxShadow: '0 12px 40px rgba(43,70,153,0.5)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">להתחיל לצמוח</span>
              <ArrowLeft className="relative z-10 w-4 h-4" strokeWidth={2.5} />
            </motion.button>
          </motion.div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #FFFFFF)' }}
        />
      </section>

      {/* Coming Soon content area */}
      <section
        className="relative py-24 md:py-36 px-4 sm:px-6"
        style={{ background: '#FFFFFF' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(43,70,153,0.06)', border: '1px solid rgba(43,70,153,0.1)' }}
            >
              <Construction className="w-7 h-7" style={{ color: '#2B4699' }} strokeWidth={1.75} />
            </div>
            <h2
              className="text-2xl sm:text-3xl font-black mb-4"
              style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}
            >
              תוכן בהכנה
            </h2>
            <p
              className="text-[15px] leading-relaxed max-w-md mx-auto"
              style={{ color: '#7E7F90', fontFamily: 'var(--font-heebo)' }}
            >
              אנחנו עובדים על תוכן מקצועי ומקיף שיעזור לכם להבין את עולם ההשקעות לעומק. חזרו בקרוב!
            </p>
          </motion.div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #F5F5F7)' }}
        />
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-4 sm:px-6 text-center"
        style={{ background: '#F5F5F7', borderTop: '1px solid #F7F7F8' }}
      >
        <div className="flex items-center justify-center gap-0 mb-3">
          <PieChart className="w-5 h-5" style={{ color: '#2B4699' }} strokeWidth={3} />
          <span
            className="text-base font-black tracking-tight"
            style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}
          >
            NET
          </span>
        </div>
        <p
          className="text-[10px] max-w-md mx-auto leading-relaxed"
          style={{ color: '#BDBDCB', fontFamily: 'var(--font-heebo)' }}
        >
          האמור אינו מהווה ייעוץ השקעות או שיווק השקעות ואינו תחליף לייעוץ אישי.
          מערכת MyNeto אינה בעלת רישיון ייעוץ השקעות. תשואות עבר אינן מעידות על תשואות עתידיות.
        </p>
      </footer>
    </>
  );
}
