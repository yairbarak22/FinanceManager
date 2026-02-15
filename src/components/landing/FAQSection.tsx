'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';

/* ── Spring presets ────────────────────────────────────── */
const springBouncy = { type: 'spring' as const, stiffness: 120, damping: 20 };

/* ── FAQ data (expanded & detailed) ─────────────────── */
const faqs = [
  {
    question: 'האם המידע שלי מאובטח ומוגן?',
    answer:
      'בהחלט. כל הנתונים מוצפנים בהצפנת AES-256 ומאוחסנים בשרתים מאובטחים של Neon (PostgreSQL). אנחנו לא שומרים סיסמאות בנק, לא ניגשים לחשבונות שלכם, ולא מבקשים פרטי כניסה — אתם מעלים קבצי פירוט והוצאות אשראי בלבד (Excel או CSV). ההתחברות מתבצעת דרך Google OAuth, כך שאין אצלנו סיסמה בכלל. בנוסף, שדות רגישים בפרופיל מוצפנים בנפרד.',
  },
  {
    question: 'איך מעלים את הנתונים למערכת?',
    answer:
      'נכנסים לאתר חברת האשראי או לאפליקציה, מורידים את קובץ פירוט ההוצאות (Excel או CSV) — בדרך כלל מתוך תפריט "ייצוא" או "הורדת פירוט". מעלים את הקובץ ל-myNETO, והמערכת מזהה את מבנה הקובץ אוטומטית. תוך שניות כל העסקאות מסווגות לקטגוריות בעזרת AI — מזון, דיור, תחבורה, בילויים ועוד. תומכים בכל חברות האשראי בישראל.',
  },
  {
    question: 'איך עובד תיק ההשקעות?',
    answer:
      'אפשר להזין ידנית את האחזקות שלכם — מניות, קרנות סל, קרנות נאמנות, קופות גמל ופנסיה. המערכת מציגה פיזור סקטוריאלי, רמת סיכון (Beta), שינויים יומיים ושווי כולל. אתם מקבלים תמונה מלאה של התיק במקום אחד, במקום להתחבר לכמה אתרים שונים.',
  },
  {
    question: 'איך נבנית התכנית החודשית ליעדים?',
    answer:
      'מגדירים יעד (דירה, חתונה, קרן חירום, חופשה — או כל דבר אחר), מזינים סכום יעד ותאריך רצוי. המערכת מחשבת כמה צריך להפריש כל חודש כדי להגיע ליעד בזמן, עם התחשבות בריבית דריבית. אפשר לעקוב אחרי ההתקדמות בזמן אמת ולהתאים את ההפרשה לפי השינויים בחיים.',
  },
  {
    question: 'אפשר לנהל את החשבון יחד עם בן/בת הזוג?',
    answer:
      'כן. אפשר להזמין בני משפחה לחשבון משותף דרך מערכת ההזמנות המובנית. כולם רואים את אותו דשבורד, עוקבים אחר הוצאות, ומתכננים את היעדים ביחד. כל שינוי שמישהו עושה — מיד מתעדכן אצל כולם.',
  },
  {
    question: 'המערכת עובדת גם בנייד?',
    answer:
      'כן. הממשק מותאם לחלוטין לנייד, טאבלט ומחשב. אפשר לבדוק את המצב הפיננסי, לעקוב אחרי יעדים ולהעלות קבצים מכל מכשיר, בכל מקום ובכל זמן — בלי להתקין אפליקציה.',
  },
  {
    question: 'זה באמת חינם? מה המודל העסקי?',
    answer:
      'חינם לחלוטין — אין תשלומים נסתרים, אין מנוי פרימיום, ואין צורך בכרטיס אשראי. המודל העסקי של myNETO מבוסס על הפניות לשירותי מסחר עצמאי, וזה מה שמאפשר לנו להציע את כל השירות של המערכת בחינם. אין שום חובה לפתוח תיק מסחר דרך האתר — אבל מי שכן פותח מקבל מתנת הצטרפות ומדריכים מאוד טובים וברורים להתחלה נכונה בעולם ההשקעות.',
  },
];

/* ── Single FAQ Item ─────────────────────────────────── */
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
            style={{
              color: isOpen ? '#2B4699' : '#1D1D1F',
              fontFamily: 'var(--font-heebo)',
            }}
          >
            {faq.question}
          </span>

          {/* +/– toggle icon */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
            style={{
              background: isOpen ? 'rgba(43,70,153,0.08)' : 'rgba(0,0,0,0.04)',
            }}
          >
            <motion.div
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1v12M1 7h12"
                  stroke={isOpen ? '#2B4699' : '#86868B'}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
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
                <p
                  className="text-[14px] sm:text-[15px] leading-[1.75]"
                  style={{ color: '#6E6E73', fontFamily: 'var(--font-heebo)' }}
                >
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

/* ── Main Section ────────────────────────────────────── */
export default function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();
  const noMotion = !!shouldReduceMotion;
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const handleToggle = useCallback((i: number) => {
    setOpenIdx((prev) => (prev === i ? null : i));
  }, []);

  return (
    <section id="faq" className="py-20 md:py-28 relative overflow-hidden" style={{ background: '#FFFFFF' }}>
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Header */}
        <motion.p
          className="text-sm font-bold tracking-widest text-center mb-4"
          style={{ color: '#0DBACC', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5 }}
        >
          מידע נוסף
        </motion.p>
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-4 leading-tight"
          style={{ color: '#1D1D1F', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5 }}
        >
          שאלות נפוצות
        </motion.h2>
        <motion.p
          className="text-base text-center mb-12 md:mb-14 max-w-xl mx-auto leading-relaxed"
          style={{ color: '#86868B', fontFamily: 'var(--font-heebo)' }}
          initial={noMotion ? undefined : { opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          לא מצאתם תשובה? אפשר ליצור קשר דרך הדשבורד ונחזור אליכם תוך יום עסקים.
        </motion.p>

        {/* FAQ items — individual cards */}
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              faq={faq}
              index={i}
              isOpen={openIdx === i}
              onToggle={() => handleToggle(i)}
              noMotion={noMotion}
              isInView={isInView}
            />
          ))}
        </div>
      </div>

      {/* Bottom fade → FinalCTA */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #E8EDF5)' }}
      />
    </section>
  );
}
