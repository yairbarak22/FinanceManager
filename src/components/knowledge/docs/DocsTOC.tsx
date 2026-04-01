'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface DocsTOCProps {
  contentRef: React.RefObject<HTMLElement | null>;
  activeId: string;
}

export default function DocsTOC({ contentRef, activeId }: DocsTOCProps) {
  const [items, setItems] = useState<TOCItem[]>([]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const timer = setTimeout(() => {
      const headings = container.querySelectorAll<HTMLElement>('h2[id], h3[id]');
      const tocItems: TOCItem[] = Array.from(headings).map((h) => ({
        id: h.id,
        text: h.textContent?.trim() || '',
        level: h.tagName === 'H2' ? 2 : 3,
      }));
      setItems(tocItems);
    }, 100);

    return () => clearTimeout(timer);
  }, [contentRef]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (items.length === 0) return null;

  return (
    <aside className="hidden xl:block w-[180px] flex-shrink-0 sticky top-28 h-[calc(100vh-140px)]">
      <nav className="overflow-y-auto h-full pe-2 docs-toc-scroll">
        <p className="text-[11px] font-semibold text-[#B0B5BF] mb-3 tracking-[0.04em] uppercase">
          תוכן עניינים
        </p>

        <ul className="space-y-0.5">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(item.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="block py-1.5 text-[12.5px] transition-colors duration-150 leading-snug"
                  style={{
                    paddingInlineStart: item.level === 3 ? '0.75rem' : '0',
                    color: isActive ? '#2563EB' : '#C0C4CC',
                    fontWeight: isActive ? 600 : 400,
                    borderInlineEnd: isActive ? '2px solid #2563EB' : '2px solid transparent',
                  }}
                >
                  {item.text}
                </a>
              </li>
            );
          })}
        </ul>

        <button
          onClick={scrollToTop}
          className="mt-5 flex items-center gap-1.5 text-[11px] text-[#C0C4CC] hover:text-[#9CA3AF] transition-colors cursor-pointer"
        >
          <ArrowUp className="w-3 h-3" />
          למעלה
        </button>
      </nav>
    </aside>
  );
}
