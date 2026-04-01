'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

interface InvestFaqAccordionProps {
  items: FaqItem[];
}

export default function InvestFaqAccordion({ items }: InvestFaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="bg-white rounded-3xl overflow-hidden transition-colors duration-300"
            style={{
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: isOpen
                ? '1px solid rgba(13, 186, 204, 0.2)'
                : '1px solid #F7F7F8',
            }}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 p-5 text-start cursor-pointer"
              aria-expanded={isOpen}
            >
              <span className="text-[15px] font-bold text-[#303150]">
                {item.q}
              </span>
              <ChevronDown
                size={18}
                strokeWidth={1.75}
                className="shrink-0 transition-transform duration-250"
                style={{
                  color: isOpen ? '#0DBACC' : '#BDBDCB',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>
            <div
              className="grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5">
                  <p className="text-[13px] leading-relaxed text-[#7E7F90]">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
