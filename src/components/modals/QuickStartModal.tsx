'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Target, GraduationCap } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
}

const ctaCards = [
  {
    id: 'import',
    icon: Download,
    title: 'ייבוא נתונים',
    description: 'העלה את קובץ הבנק או האשראי שלך והמערכת תסווג הכל אוטומטית.',
    accentColor: '#0DBACC',
    accentBg: 'rgba(13, 186, 204, 0.1)',
    hoverBorder: 'rgba(13, 186, 204, 0.5)',
    hoverShadow: '0 8px 30px rgba(13, 186, 204, 0.12)',
  },
  {
    id: 'goals',
    icon: Target,
    title: 'הצבת יעדים פיננסיים',
    description: 'הגדר יעדי חיסכון או תקציב חודשי ונתחיל לעקוב אחריהם יחד.',
    accentColor: '#69ADFF',
    accentBg: 'rgba(105, 173, 255, 0.1)',
    hoverBorder: 'rgba(105, 173, 255, 0.5)',
    hoverShadow: '0 8px 30px rgba(105, 173, 255, 0.12)',
  },
  {
    id: 'courses',
    icon: GraduationCap,
    title: 'קורס חינוך פיננסי',
    description: 'צפה בקורס הווידאו שלנו ולמד את סודות ניהול הכסף וההשקעות.',
    accentColor: '#F18AB5',
    accentBg: 'rgba(241, 138, 181, 0.1)',
    hoverBorder: 'rgba(241, 138, 181, 0.5)',
    hoverShadow: '0 8px 30px rgba(241, 138, 181, 0.12)',
  },
] as const;

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 28, stiffness: 320, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 12,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 22, stiffness: 260 },
  },
};

const skipVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delay: 0.5, duration: 0.4 },
  },
};

export default function QuickStartModal({ isOpen, onClose, onImport }: QuickStartModalProps) {
  const router = useRouter();

  const dismiss = useCallback(async () => {
    try {
      await apiFetch('/api/user/quickstart', { method: 'POST' });
    } catch {
      // Non-blocking — modal still closes even if API fails
    }
  }, []);

  const handleAction = useCallback(
    async (actionId: string) => {
      await dismiss();
      onClose();

      switch (actionId) {
        case 'import':
          onImport();
          break;
        case 'goals':
          router.push('/goals');
          break;
        case 'courses':
          router.push('/courses');
          break;
      }
    },
    [dismiss, onClose, onImport, router]
  );

  const handleSkip = useCallback(async () => {
    await dismiss();
    onClose();
  }, [dismiss, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleSkip}
        >
          <motion.div
            className="relative bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-5 start-5 z-10 p-2 rounded-lg transition-colors duration-200 hover:bg-[#F7F7F8] cursor-pointer"
              aria-label="סגור"
            >
              <X className="w-5 h-5 text-[#BDBDCB]" strokeWidth={1.75} />
            </button>

            {/* Header */}
            <div className="pt-10 pb-2 px-8 text-center relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 15, stiffness: 200 }}
                className="text-4xl mb-4"
              >
                👋
              </motion.div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ color: '#303150' }}
              >
                ברוך הבא ל-myneto!
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: '#7E7F90' }}
              >
                כדי שנוכל להתחיל לנהל את הכסף שלך בצורה חכמה,
                <br />
                מאיפה תרצה להתחיל?
              </p>
            </div>

            {/* CTA Cards */}
            <motion.div
              className="px-6 pb-2 pt-4 flex flex-col gap-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {ctaCards.map((card) => {
                const Icon = card.icon;
                return (
                  <motion.button
                    key={card.id}
                    variants={cardVariants}
                    onClick={() => handleAction(card.id)}
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-[#F7F7F8] bg-white cursor-pointer text-start w-full"
                    style={{ position: 'relative' }}
                    whileHover={{
                      y: -2,
                      borderColor: card.hoverBorder,
                      boxShadow: card.hoverShadow,
                      transition: { duration: 0.2 },
                    }}
                    whileTap={{ scale: 0.985 }}
                  >
                    <div
                      className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: card.accentBg }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: card.accentColor }}
                        strokeWidth={1.75}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="text-[0.9375rem] font-semibold mb-0.5"
                        style={{ color: '#303150' }}
                      >
                        {card.title}
                      </h3>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: '#7E7F90' }}
                      >
                        {card.description}
                      </p>
                    </div>
                    <div
                      className="shrink-0 ms-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ color: card.accentColor }}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M12.5 15L7.5 10L12.5 5"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Skip action */}
            <motion.div
              className="px-6 pt-3 pb-6 text-center"
              variants={skipVariants}
              initial="hidden"
              animate="visible"
            >
              <button
                onClick={handleSkip}
                className="text-xs cursor-pointer transition-colors duration-200 hover:underline"
                style={{ color: '#BDBDCB' }}
              >
                אני רוצה לחקור את המערכת בעצמי
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
