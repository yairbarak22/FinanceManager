'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  icon?: React.ReactNode;
}

export function AccordionItem({
  title,
  children,
  isOpen = false,
  onToggle,
  icon,
}: AccordionItemProps) {
  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 py-5 px-1 text-right transition-colors hover:bg-slate-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-lg"
        aria-expanded={isOpen}
      >
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            {icon}
          </div>
        )}
        <span className="flex-1 text-lg font-semibold text-slate-900">{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-5 px-1 pr-14 text-slate-600 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AccordionProps {
  children: React.ReactNode;
  allowMultiple?: boolean;
  defaultOpenIndex?: number;
}

export function Accordion({
  children,
  allowMultiple = false,
  defaultOpenIndex,
}: AccordionProps) {
  const [openIndices, setOpenIndices] = useState<Set<number>>(
    defaultOpenIndex !== undefined ? new Set([defaultOpenIndex]) : new Set()
  );

  const handleToggle = (index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        if (!allowMultiple) {
          next.clear();
        }
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="divide-y divide-slate-200">
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement<AccordionItemProps>(child)) {
          return React.cloneElement(child, {
            isOpen: openIndices.has(index),
            onToggle: () => handleToggle(index),
          });
        }
        return child;
      })}
    </div>
  );
}

export default Accordion;

