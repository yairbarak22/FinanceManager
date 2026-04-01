'use client';

import { useRef, useEffect } from 'react';
import { categories } from '@/lib/knowledge/categories';
import type { CategoryId } from '@/lib/knowledge/categories';

interface CategoryTabsProps {
  active: CategoryId;
  onChange: (id: CategoryId) => void;
}

export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      if (elRect.right > containerRect.right || elRect.left < containerRect.left) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [active]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
      role="tablist"
      aria-label="סינון לפי קטגוריה"
    >
      {categories.map((cat) => {
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            ref={isActive ? activeRef : null}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cat.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold whitespace-nowrap snap-start cursor-pointer transition-all duration-200 flex-shrink-0"
            style={{
              fontFamily: 'var(--font-heebo)',
              background: isActive ? cat.color : 'rgba(255,255,255,0.7)',
              color: isActive ? '#FFFFFF' : '#7E7F90',
              border: isActive ? 'none' : '1.5px solid rgba(0,0,0,0.06)',
              boxShadow: isActive
                ? `0 4px 12px ${cat.color}33`
                : '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
