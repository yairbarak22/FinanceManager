'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, ArrowLeft } from 'lucide-react';
import { createPortal } from 'react-dom';
import { articles } from '@/lib/knowledge/articles';
import { searchArticles } from '@/lib/knowledge/search';
import { getCategoryById } from '@/lib/knowledge/categories';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = query.trim().length > 0
    ? searchArticles(articles, query).slice(0, 8)
    : articles.slice(0, 6); // Show popular by default

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const navigateTo = useCallback(
    (slug: string) => {
      onClose();
      router.push(`/knowledge/${slug}`);
    },
    [onClose, router]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        navigateTo(results[selectedIndex].slug);
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [results, selectedIndex, navigateTo, onClose]
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
      dir="rtl"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg mx-4 bg-white rounded-3xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'searchModalIn 150ms ease-out' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F7F7F8]">
          <Search className="w-5 h-5 text-[#BDBDCB] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="חפש מדריכים, נושאים..."
            className="flex-1 text-[15px] text-[#303150] placeholder-[#BDBDCB] outline-none bg-transparent"
            style={{ fontFamily: 'inherit' }}
          />
          <kbd className="text-[11px] px-1.5 py-0.5 rounded-md bg-[#F7F7F8] border border-[#E8E8ED] text-[#BDBDCB] font-sans">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-[#BDBDCB] mx-auto mb-3" />
              <p className="text-sm text-[#7E7F90]">לא נמצאו תוצאות</p>
            </div>
          ) : (
            <>
              <p className="px-5 pt-3 pb-1 text-[11px] text-[#BDBDCB] font-medium">
                {query.trim().length > 0 ? `${results.length} תוצאות` : 'מדריכים פופולריים'}
              </p>
              {results.map((article, i) => {
                const cat = getCategoryById(article.category);
                const isSelected = i === selectedIndex;
                return (
                  <button
                    key={article.slug}
                    onClick={() => navigateTo(article.slug)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-start transition-colors cursor-pointer"
                    style={{
                      background: isSelected ? '#F7F7F8' : 'transparent',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: cat?.colorLight || '#F7F7F8' }}
                    >
                      <article.icon
                        className="w-4 h-4"
                        style={{ color: cat?.color || '#7E7F90' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#303150] truncate">
                        {article.title}
                      </p>
                      <p className="text-[11px] text-[#BDBDCB] truncate">
                        {cat?.label} · {article.readingTime} דק׳
                      </p>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-[#BDBDCB] flex-shrink-0" />
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer hints */}
        <div className="px-5 py-3 border-t border-[#F7F7F8] flex items-center gap-4 text-[11px] text-[#BDBDCB]">
          <span>↑↓ ניווט</span>
          <span>↵ בחירה</span>
          <span>Esc סגירה</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
