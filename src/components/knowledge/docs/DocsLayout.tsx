'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Menu } from 'lucide-react';
import DocsSidebar from './DocsSidebar';
import SearchModal from './SearchModal';

interface DocsLayoutProps {
  children: React.ReactNode;
  activeSlug?: string;
  embedded?: boolean;
}

export default function DocsLayout({
  children,
  activeSlug,
  embedded = false,
}: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (embedded) {
    return (
      <div dir="rtl" className="flex -mt-4 lg:-mt-6 -mb-4 lg:-mb-6 -ms-4 lg:-ms-6 -me-4 lg:-me-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: 'var(--font-nunito, var(--font-heebo))' }}>
        {/* Secondary sidebar — matches CourseChapterAccordion pattern */}
        <DocsSidebar
          activeSlug={activeSlug}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          compact
        />

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto" style={{ background: '#F8F9FB' }}>
          <div className="flex justify-center">
            <div
              ref={contentRef}
              className="flex-1 max-w-[740px] px-5 sm:px-8 lg:px-10 py-6 lg:py-10"
            >
              {children}
            </div>
          </div>
        </main>

        {/* Mobile sidebar FAB */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed bottom-6 end-4 z-30 w-12 h-12 rounded-full bg-white flex items-center justify-center cursor-pointer transition-transform active:scale-95"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.1)' }}
          aria-label="פתח ניווט"
        >
          <Menu className="w-5 h-5 text-[#303150]" />
        </button>

        <SearchModal isOpen={searchOpen} onClose={closeSearch} />
      </div>
    );
  }

  // Standalone mode (unauthenticated)
  return (
    <div dir="rtl" className="min-h-screen pt-16 md:pt-20" style={{ background: '#F8F9FB', fontFamily: 'var(--font-nunito, var(--font-heebo))' }}>
      {/* Sidebar — pinned to right edge */}
      <DocsSidebar
        activeSlug={activeSlug}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main content — offset by sidebar width on lg */}
      <div className="lg:mr-[288px]">
        <main className="flex-1 min-w-0">
          <div className="flex justify-center">
            <div
              ref={contentRef}
              className="flex-1 max-w-[740px] px-5 sm:px-8 lg:px-10 py-8 lg:py-12"
            >
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar FAB */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed bottom-6 end-4 z-30 w-12 h-12 rounded-full bg-white flex items-center justify-center cursor-pointer transition-transform active:scale-95"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.1)' }}
        aria-label="פתח ניווט"
      >
        <Menu className="w-5 h-5 text-[#303150]" />
      </button>

      <SearchModal isOpen={searchOpen} onClose={closeSearch} />
    </div>
  );
}
