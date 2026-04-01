'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronLeft, Clock } from 'lucide-react';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';
import { articles } from '@/lib/knowledge/articles';
import { getCategoryById } from '@/lib/knowledge/categories';
import Navbar from '@/components/landing/Navbar';
import DocsLayout from './docs/DocsLayout';

/* ── Popular articles (3) ──────────────────────────────── */
const popularSlugs = [
  'dashboard-overview',
  'upload-transactions',
  'setup-budget',
];

/* ── FAQ data (same as landing page) ───────────────────── */
const faqs = [
  {
    question: 'האם המידע שלי מאובטח ומוגן?',
    answer:
      'בהחלט. כל הנתונים מוצפנים בהצפנת AES-256 ומאוחסנים בשרתים מאובטחים של Neon (PostgreSQL). אנחנו לא שומרים סיסמאות בנק, לא ניגשים לחשבונות שלכם, ולא מבקשים פרטי כניסה — אתם מעלים קבצי פירוט והוצאות אשראי בלבד (Excel או CSV). ההתחברות מתבצעת דרך Google OAuth, כך שאין אצלנו סיסמה בכלל.',
  },
  {
    question: 'איך מעלים את הנתונים למערכת?',
    answer:
      'נכנסים לאתר חברת האשראי או לאפליקציה, מורידים את קובץ פירוט ההוצאות (Excel או CSV) — בדרך כלל מתוך תפריט "ייצוא" או "הורדת פירוט". מעלים את הקובץ ל-MyNeto, והמערכת מזהה את מבנה הקובץ אוטומטית. תוך שניות כל העסקאות מסווגות לקטגוריות בעזרת AI.',
  },
  {
    question: 'איך עובד תיק ההשקעות?',
    answer:
      'אפשר להזין ידנית את האחזקות שלכם — מניות, קרנות סל, קרנות נאמנות, קופות גמל ופנסיה. המערכת מציגה פיזור סקטוריאלי, רמת סיכון (Beta), שינויים יומיים ושווי כולל. אתם מקבלים תמונה מלאה של התיק במקום אחד.',
  },
  {
    question: 'אפשר לנהל את החשבון יחד עם בן/בת הזוג?',
    answer:
      'כן. אפשר להזמין בני משפחה לחשבון משותף דרך מערכת ההזמנות המובנית. כולם רואים את אותו דשבורד, עוקבים אחר הוצאות, ומתכננים את היעדים ביחד. כל שינוי שמישהו עושה — מיד מתעדכן אצל כולם.',
  },
  {
    question: 'זה באמת חינם? מה המודל העסקי?',
    answer:
      'חינם לחלוטין — אין תשלומים נסתרים, אין מנוי פרימיום, ואין צורך בכרטיס אשראי. המודל העסקי של MyNeto מבוסס על הפניות לשירותי מסחר עצמאי, וזה מה שמאפשר לנו להציע את כל השירות בחינם.',
  },
];

/* ── FAQ Item ──────────────────────────────────────────── */
const springBouncy = { type: 'spring' as const, stiffness: 120, damping: 20 };

function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
  noMotion,
  isInView,
}: {
  faq: (typeof faqs)[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  noMotion: boolean;
  isInView: boolean;
}) {
  return (
    <motion.div
      initial={noMotion ? undefined : { opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={noMotion ? { duration: 0 } : { ...springBouncy, delay: 0.05 + index * 0.06 }}
    >
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
          className="w-full flex items-center gap-4 py-4.5 px-5 sm:px-6 text-right cursor-pointer focus:outline-none"
          aria-expanded={isOpen}
        >
          <span
            className="flex-1 text-[15px] sm:text-base font-bold leading-snug"
            style={{ color: isOpen ? '#2B4699' : '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
          >
            {faq.question}
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
              <div className="px-5 sm:px-6 pb-5 pe-12">
                <p className="text-[14px] sm:text-[15px] leading-[1.75]" style={{ color: '#6E6E73', fontFamily: 'var(--font-heebo)' }}>
                  {faq.answer}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */

export default function KnowledgeCenterPage({ embedded = false }: { embedded?: boolean }) {
  const faqRef = useRef(null);
  const faqInView = useInView(faqRef, { once: true, margin: '-80px' });
  const noMotion = !!useReducedMotion();
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const handleFaqToggle = useCallback((i: number) => setOpenFaqIdx((prev) => (prev === i ? null : i)), []);

  const popular = popularSlugs
    .map((slug) => articles.find((a) => a.slug === slug))
    .filter(Boolean);

  return (
    <>
    {!embedded && <Navbar callbackUrl="/knowledge" bgColor="#FFFFFF" />}
    <DocsLayout embedded={embedded}>
      {/* Hero */}
      <div className="text-center py-8 lg:py-12">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: 'linear-gradient(135deg, #2B4699, #69ADFF)',
            boxShadow: '0 8px 24px rgba(43,70,153,0.15)',
          }}
        >
          <BookOpen className="w-7 h-7 text-white" />
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 leading-tight" style={{ color: '#303150' }}>
          מרכז הידע של MyNeto
        </h1>

        <p className="text-base max-w-lg mx-auto leading-relaxed mb-2" style={{ color: '#7E7F90' }}>
          מדריכים מעשיים על המערכת וידע פיננסי שיעזור לך לקבל החלטות חכמות יותר
        </p>

        <p className="text-sm text-[#BDBDCB]">
          לחץ <kbd className="px-1.5 py-0.5 rounded-md bg-[#F7F7F8] border border-[#E8E8ED] text-[11px] font-sans mx-0.5">⌘K</kbd> לחיפוש מהיר
        </p>
      </div>

      {/* ── Popular Guides (3) ── */}
      <div className="mb-14">
        <h2 className="text-xl font-bold mb-5" style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}>
          מדריכים פופולריים
        </h2>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #EAEDF0' }}>
          {popular.map((article, i) => {
            if (!article) return null;
            const cat = getCategoryById(article.category);
            return (
              <Link
                key={article.slug}
                href={`/knowledge/${article.slug}`}
                className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50 group"
                style={{ borderBottom: i < popular.length - 1 ? '1px solid #EAEDF0' : 'none', background: '#FFFFFF' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: cat?.colorLight || '#F7F7F8' }}
                >
                  <article.icon className="w-[18px] h-[18px]" style={{ color: cat?.color || '#7E7F90' }} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                    {article.title}
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{article.subtitle}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readingTime} דק׳
                  </span>
                  <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── FAQ Section (same design as landing) ── */}
      <div className="mb-10" ref={faqRef}>
        <motion.p
          className="text-sm font-bold tracking-widest text-center mb-3"
          style={{ color: '#0DBACC', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0 }}
          animate={faqInView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5 }}
        >
          מידע נוסף
        </motion.p>
        <motion.h2
          className="text-2xl sm:text-3xl font-black text-center mb-3 leading-tight"
          style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 20 }}
          animate={faqInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5 }}
        >
          שאלות נפוצות
        </motion.h2>
        <motion.p
          className="text-sm text-center mb-10 max-w-md mx-auto leading-relaxed"
          style={{ color: '#86868B', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 15 }}
          animate={faqInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          לא מצאתם תשובה? שלחו לנו בקשה דרך התפריט הצדדי.
        </motion.p>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              faq={faq}
              index={i}
              isOpen={openFaqIdx === i}
              onToggle={() => handleFaqToggle(i)}
              noMotion={noMotion}
              isInView={faqInView}
            />
          ))}
        </div>
      </div>
    </DocsLayout>
    </>
  );
}
