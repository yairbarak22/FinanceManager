'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import {
  ChevronDown, ChevronLeft, X, Search, Send, Lightbulb, LogIn, BookOpen,
  Monitor, TrendingUp, Wallet, HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { articles, getArticleBySlug } from '@/lib/knowledge/articles';
import { searchArticles } from '@/lib/knowledge/search';
import { apiFetch } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/* ── Static sidebar navigation map ─────────────────── */

interface SidebarSection {
  label: string; // empty = no header
  slugs: string[];
}

interface SidebarGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  colorLight: string;
  sections: SidebarSection[];
}

const sidebarNav: SidebarGroup[] = [
  {
    id: 'system-guides',
    label: 'מדריכי המערכת',
    icon: Monitor,
    color: '#2B4699',
    colorLight: '#C1DDFF',
    sections: [
      { label: 'התחלה מהירה', slugs: ['dashboard-overview', 'upload-transactions', 'settings-profile'] },
      { label: 'ניהול כספים', slugs: ['setup-budget', 'recurring-transactions', 'financial-goals'] },
      { label: 'תיק ונכסים', slugs: ['investment-portfolio', 'assets-liabilities'] },
      { label: 'כלים ודוחות', slugs: ['monthly-report', 'calculators-guide'] },
      { label: 'חשבון ואבטחה', slugs: ['shared-account', 'data-security'] },
    ],
  },
  {
    id: 'investments',
    label: 'השקעות ושוק ההון',
    icon: TrendingUp,
    color: '#69ADFF',
    colorLight: '#C1DDFF',
    sections: [
      { label: 'מה צריך לדעת', slugs: ['why-invest', 'what-is-investing', 'passive-investing'] },
      { label: 'בניית תיק', slugs: ['etf-vs-funds', 'diversification', 'management-fees', 'investor-behavior'] },
      { label: 'קורס ופעולה', slugs: ['video-course', 'open-account', 'transfer-portfolio'] },
    ],
  },
  {
    id: 'finance-general',
    label: 'ידע פיננסי כללי',
    icon: Wallet,
    color: '#0DBACC',
    colorLight: '#B4F1F1',
    sections: [
      { label: 'תקציב וחיסכון', slugs: ['budgeting-101', 'emergency-fund', 'smart-saving'] },
      { label: 'מושגי יסוד', slugs: ['compound-interest', 'inflation'] },
      { label: 'דיור ומשכנתא', slugs: ['first-apartment', 'mortgage-types', 'mortgage-refinance'] },
      { label: 'פנסיה וביטוח', slugs: ['pension-basics', 'keren-hishtalmut', 'insurance-essentials'] },
      { label: 'חובות ואשראי', slugs: ['debt-management', 'credit-cards'] },
    ],
  },
  {
    id: 'faq',
    label: 'שאלות נפוצות',
    icon: HelpCircle,
    color: '#9F7FE0',
    colorLight: '#E3D6FF',
    sections: [
      { label: '', slugs: ['invest-faq'] },
    ],
  },
];

// All slugs in sidebar order
const allSlugs = sidebarNav.flatMap((g) => g.sections.flatMap((s) => s.slugs));

// Find which group contains a slug
function findGroupForSlug(slug: string): string | undefined {
  return sidebarNav.find((g) => g.sections.some((s) => s.slugs.includes(slug)))?.id;
}

/* ── Component ─────────────────────────────────────── */

interface DocsSidebarProps {
  activeSlug?: string;
  isOpen: boolean;
  onClose: () => void;
  compact?: boolean;
}

export default function DocsSidebar({ activeSlug, isOpen, onClose, compact = false }: DocsSidebarProps) {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const activeGroupId = activeSlug ? findGroupForSlug(activeSlug) : undefined;

  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const allIds = new Set(sidebarNav.map((g) => g.id));
    if (activeGroupId) allIds.delete(activeGroupId);
    return allIds;
  });

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    // Collapse all sections except the one containing the active slug
    const allSectionKeys = new Set<string>();
    sidebarNav.forEach((g) => {
      g.sections.forEach((s, si) => {
        if (s.label) {
          const key = `${g.id}-${si}`;
          const containsActive = activeSlug && s.slugs.includes(activeSlug);
          if (!containsActive) allSectionKeys.add(key);
        }
      });
    });
    return allSectionKeys;
  });

  const toggleSection = useCallback((key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const [query, setQuery] = useState('');
  const [compactCollapsed, setCompactCollapsed] = useState(false);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Guide request state
  const [requestMsg, setRequestMsg] = useState('');
  const [requestState, setRequestState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const honeypotRef = useRef<HTMLInputElement>(null);

  const toggleGroup = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [activeSlug]);

  // Auto-expand section containing active slug
  useEffect(() => {
    if (activeSlug) {
      sidebarNav.forEach((g) => {
        g.sections.forEach((s, si) => {
          if (s.label && s.slugs.includes(activeSlug)) {
            const key = `${g.id}-${si}`;
            setCollapsedSections((prev) => {
              if (prev.has(key)) {
                const next = new Set(prev);
                next.delete(key);
                return next;
              }
              return prev;
            });
          }
        });
      });
    }
  }, [activeSlug]);

  useEffect(() => {
    if (activeGroupId) {
      setCollapsed((prev) => {
        if (prev.has(activeGroupId)) {
          const next = new Set(prev);
          next.delete(activeGroupId);
          return next;
        }
        return prev;
      });
    }
  }, [activeGroupId]);

  const isSearching = query.trim().length > 0;
  const searchResults = useMemo(
    () => (isSearching ? searchArticles(articles, query) : []),
    [query, isSearching]
  );

  const handleGuideRequest = async () => {
    if (!requestMsg.trim() || requestMsg.trim().length < 5) return;
    setRequestState('sending');
    try {
      const res = await apiFetch('/api/knowledge/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: requestMsg.trim(),
          honeypot: honeypotRef.current?.value || '',
        }),
      });
      if (res.ok) {
        setRequestState('sent');
        setRequestMsg('');
      } else {
        setRequestState('error');
      }
    } catch {
      setRequestState('error');
    }
  };

  /* ── Article link ── */
  const renderArticleLink = (slug: string) => {
    const article = getArticleBySlug(slug);
    if (!article) return null;
    const isActive = article.slug === activeSlug;
    const ArticleIcon = article.icon;

    return (
      <Link
        key={article.slug}
        ref={isActive ? activeRef : null}
        href={`/knowledge/${article.slug}`}
        onClick={onClose}
        className={`w-full flex items-center gap-2.5 ${compact ? 'px-3 py-2' : 'px-4 py-2.5'} rounded-lg ${compact ? 'text-[12px]' : 'text-[13px]'} font-medium transition-all duration-150 ${
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
        title={article.title}
      >
        <ArticleIcon
          className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}
          strokeWidth={1.75}
        />
        <span className="leading-snug" style={{
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {article.title}
        </span>
      </Link>
    );
  };

  /* ── Sidebar content ── */
  const sidebarContent = (
    <div className="h-full overflow-y-auto docs-sidebar-scroll flex flex-col">
      {/* Search — hidden in compact mode */}
      <div className={`px-4 pt-4 pb-3 flex-shrink-0 ${compact ? 'hidden' : ''}`}>
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 pointer-events-none text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש מדריכים..."
            className="w-full ps-9 pe-8 py-2.5 border border-[#E8E8ED] bg-white rounded-xl text-xs text-[#303150] placeholder:text-[#BDBDCB] focus:outline-none focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20 transition-all"
            style={{ fontFamily: 'inherit' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute top-1/2 -translate-y-1/2 end-2.5 p-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="נקה חיפוש"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      <div className={`border-t border-slate-100 mx-4 mb-1 ${compact ? 'hidden' : ''}`} />

      {/* Navigation */}
      <div className="flex-1 px-4 pb-2 space-y-1">
        {isSearching ? (
          <div>
            {searchResults.length === 0 ? (
              <p className="text-[13px] text-slate-400 text-center py-10">לא נמצאו תוצאות</p>
            ) : (
              <>
                <p className="text-[11px] text-slate-400 px-4 mb-2">{searchResults.length} תוצאות</p>
                <div className="space-y-0.5">
                  {searchResults.map((a) => renderArticleLink(a.slug))}
                </div>
              </>
            )}
          </div>
        ) : (
          sidebarNav.map((group) => {
            const isCollapsed = collapsed.has(group.id);
            const Icon = group.icon;
            const hasActiveChild = group.sections.some((s) => s.slugs.includes(activeSlug || ''));

            return (
              <div key={group.id}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center gap-3 ${compact ? 'py-2 px-3' : 'py-3 px-4'} rounded-xl transition-all duration-150 cursor-pointer ${
                    hasActiveChild && !isCollapsed ? 'bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`${compact ? 'w-7 h-7' : 'w-9 h-9'} rounded-lg flex items-center justify-center flex-shrink-0`}
                    style={{ background: group.colorLight }}
                  >
                    <Icon className={compact ? 'w-4 h-4' : 'w-[18px] h-[18px]'} style={{ color: group.color }} strokeWidth={2} />
                  </div>
                  <span className={`flex-1 ${compact ? 'text-[13px]' : 'text-sm'} font-medium text-start transition-colors duration-150 ${
                    hasActiveChild ? 'text-slate-900' : 'text-slate-600'
                  }`}>
                    {group.label}
                  </span>
                  <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </motion.div>
                </button>

                {/* Sections + articles */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="ps-6 pt-1 pb-2">
                        {group.sections.map((section, si) => {
                          const sectionKey = `${group.id}-${si}`;
                          const isSectionCollapsed = section.label ? collapsedSections.has(sectionKey) : false;
                          const hasActiveSectionChild = activeSlug ? section.slugs.includes(activeSlug) : false;

                          return (
                            <div key={si} className={si > 0 ? 'mt-1' : ''}>
                              {/* Section label — collapsible */}
                              {section.label ? (
                                <button
                                  onClick={() => toggleSection(sectionKey)}
                                  className={`w-full flex items-center gap-2 py-2 px-4 rounded-lg text-[12.5px] font-semibold transition-colors duration-150 cursor-pointer ${
                                    hasActiveSectionChild ? 'text-slate-900' : 'text-slate-600 hover:text-slate-800'
                                  }`}
                                >
                                  <span className="flex-1 text-start">{section.label}</span>
                                  <motion.div animate={{ rotate: isSectionCollapsed ? 0 : 180 }} transition={{ duration: 0.15 }}>
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                  </motion.div>
                                </button>
                              ) : null}
                              {/* Article links */}
                              <AnimatePresence initial={false}>
                                {!isSectionCollapsed && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                  >
                                    <div className={`space-y-0.5 ${section.label ? 'ps-3' : ''}`}>
                                      {section.slugs.map((slug) => renderArticleLink(slug))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* ── Guide Request footer ── */}
      <div className={`flex-shrink-0 border-t border-slate-100 mx-4 ${compact ? 'hidden' : ''}`} />
      <div className={`px-4 py-4 flex-shrink-0 ${compact ? 'hidden' : ''}`}>
        {requestState === 'sent' ? (
          <div className="flex items-center gap-2 justify-center py-2">
            <Lightbulb className="w-4 h-4 text-[#0DBACC]" />
            <p className="text-[13px] font-medium text-slate-700">הבקשה נשלחה! תודה.</p>
          </div>
        ) : isAuthenticated ? (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Lightbulb className="w-4 h-4 text-[#69ADFF]" />
              <p className="text-[12px] font-bold text-slate-700">לא מצאתם?</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={requestMsg}
                onChange={(e) => { setRequestMsg(e.target.value); if (requestState === 'error') setRequestState('idle'); }}
                placeholder="באיזה נושא תרצו מדריך?"
                className="flex-1 min-w-0 px-3 py-2 border border-[#E8E8ED] bg-white rounded-xl text-[12px] text-[#303150] placeholder:text-[#BDBDCB] focus:outline-none focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20"
                style={{ fontFamily: 'inherit' }}
                maxLength={500}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGuideRequest(); }}
              />
              <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />
              <button
                onClick={handleGuideRequest}
                disabled={requestState === 'sending' || requestMsg.trim().length < 5}
                className="px-3 py-2 border border-[#E8E8ED] bg-[#F7F7F8] hover:bg-[#ECECF1] rounded-xl text-[12px] font-medium text-[#303150] inline-flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ fontFamily: 'inherit' }}
              >
                {requestState === 'sending' ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {requestState === 'error' && (
              <p className="text-[11px] mt-1.5 text-[#F18AB5]">שגיאה. נסו שוב.</p>
            )}
          </div>
        ) : (
          <button
            onClick={() => signIn('google', { callbackUrl: '/knowledge' })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            התחברו כדי לבקש מדריך
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      {/* Desktop: compact mode (inside AppLayout) */}
      {compact && (
        <motion.aside
          initial={false}
          animate={{ width: compactCollapsed ? 56 : 272 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="hidden lg:flex flex-col bg-white border-e border-[#F7F7F8] overflow-hidden flex-shrink-0"
        >
          {/* Header */}
          <div className={`flex items-center border-b border-[#F7F7F8] ${compactCollapsed ? 'justify-center py-3.5 px-2' : 'justify-between px-4 py-3.5'}`}>
            {!compactCollapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 text-[#69ADFF] flex-shrink-0" strokeWidth={1.75} />
                <h3 className="text-[0.8125rem] font-bold text-[#303150] whitespace-nowrap truncate">
                  תוכן המדריכים
                </h3>
              </div>
            )}
            <button
              type="button"
              onClick={() => setCompactCollapsed((p) => !p)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F7F7F8] transition-colors duration-150 cursor-pointer flex-shrink-0"
              title={compactCollapsed ? 'הרחב תפריט' : 'כווץ תפריט'}
            >
              <motion.div animate={{ rotate: compactCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
                <ChevronLeft className="w-4 h-4 text-[#BDBDCB]" strokeWidth={1.75} />
              </motion.div>
            </button>
          </div>

          {/* Content — hidden when collapsed */}
          {!compactCollapsed && sidebarContent}
        </motion.aside>
      )}

      {/* Desktop: standalone mode (with landing Navbar) */}
      {!compact && (
        <aside className="hidden lg:flex flex-col bg-white border-l border-slate-100 flex-shrink-0 overflow-hidden w-[288px] fixed top-16 md:top-20 right-0 h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] z-20">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-[100]"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed top-0 end-0 bottom-0 w-[300px] bg-white shadow-xl z-[101] flex flex-col overflow-hidden"
              dir="rtl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-800">מרכז הידע</span>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-50 transition-colors" aria-label="סגור">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
