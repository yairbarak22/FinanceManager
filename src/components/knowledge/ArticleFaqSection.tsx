'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FaqItem {
  q: string;
  a: string;
}

function FaqAccordion({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className="rounded-2xl transition-all duration-300 overflow-hidden"
      style={{
        background: isOpen ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
        border: isOpen ? '1.5px solid rgba(43,70,153,0.25)' : '1.5px solid rgba(0,0,0,0.06)',
        boxShadow: isOpen
          ? '0 8px 32px rgba(43,70,153,0.06), 0 2px 8px rgba(0,0,0,0.03)'
          : '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 py-4 px-5 text-right cursor-pointer focus:outline-none"
        aria-expanded={isOpen}
      >
        <span
          className="flex-1 text-[15px] font-bold leading-snug"
          style={{ color: isOpen ? '#2B4699' : '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
        >
          {item.q}
        </span>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
          style={{ background: isOpen ? 'rgba(43,70,153,0.08)' : 'rgba(0,0,0,0.04)' }}
        >
          <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke={isOpen ? '#2B4699' : '#86868B'} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pe-12">
              <p className="text-[14px] leading-[1.75]" style={{ color: '#6E6E73', fontFamily: 'var(--font-heebo)' }}>
                {item.a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ArticleFaqSectionProps {
  title: string;
  items: FaqItem[];
}

export default function ArticleFaqSection({ title, items }: ArticleFaqSectionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
      <h2
        id={title.replace(/\s+/g, '-')}
        style={{
          fontSize: '1.375rem',
          fontWeight: 700,
          color: '#1A1D26',
          marginBottom: '0.75rem',
          lineHeight: 1.35,
          paddingBottom: '0.5rem',
          borderBottom: '1px solid #EAEDF0',
        }}
      >
        {title}
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <FaqAccordion
            key={i}
            item={item}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
        ))}
      </div>
    </div>
  );
}
