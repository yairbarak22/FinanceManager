'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface GuideAccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function GuideAccordion({
  title,
  children,
  defaultOpen = false,
}: GuideAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-colors duration-200"
      style={{
        background: isOpen ? '#F6F7F9' : '#FAFBFC',
        border: '1px solid #EAEDF0',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center gap-4 px-6 py-5 text-start cursor-pointer transition-colors duration-150 hover:bg-[#F0F2F5]/60"
        aria-expanded={isOpen}
      >
        <h3 className="flex-1 text-[16px] font-bold text-[#1A1D26]">
          {title}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5" style={{ color: '#C0C4CC' }} />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
            role="region"
          >
            <div className="border-t border-[#EAEDF0] divide-y divide-[#EAEDF0]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
