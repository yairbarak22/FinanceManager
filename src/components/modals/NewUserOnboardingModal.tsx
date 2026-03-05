'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Target, GraduationCap, TrendingUp, CreditCard } from 'lucide-react';

interface NewUserOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
  onGoals: () => void;
  onCourses: () => void;
  onAddAsset: () => void;
  onAddLiability: () => void;
}

const ctaCards = [
  {
    id: 'import',
    icon: Download,
    title: 'ייבוא נתונים מהבנק',
    description: 'העלה את קובץ הבנק או האשראי שלך והמערכת תסווג הכל אוטומטית - תוך שניות.',
    accentColor: '#0DBACC',
    accentBg: 'rgba(13, 186, 204, 0.1)',
    glowColor: 'rgba(13, 186, 204, 0.25)',
    hoverBorder: 'rgba(13, 186, 204, 0.5)',
    hoverShadow: '0 8px 30px rgba(13, 186, 204, 0.15)',
    shimmerDelay: '0.5s',
    pulseDelay: 0,
  },
  {
    id: 'goals',
    icon: Target,
    title: 'הצבת יעדים פיננסיים',
    description: 'הגדר יעדי חיסכון והמערכת תנתח לעומק ותציג לך כמה אתה נדרש לחסוך בכל חודש כדי לעמוד ביעד .',
    accentColor: '#69ADFF',
    accentBg: 'rgba(105, 173, 255, 0.1)',
    glowColor: 'rgba(105, 173, 255, 0.25)',
    hoverBorder: 'rgba(105, 173, 255, 0.5)',
    hoverShadow: '0 8px 30px rgba(105, 173, 255, 0.15)',
    shimmerDelay: '0.65s',
    pulseDelay: 0.6,
  },
  {
    id: 'courses',
    icon: GraduationCap,
    title: 'קורס פיננסים — בחינם!',
    description: 'למד את סודות ניהול הכסף וההשקעות בקורס הווידאו המלא שלנו, ללא עלות.',
    accentColor: '#F18AB5',
    accentBg: 'rgba(241, 138, 181, 0.1)',
    glowColor: 'rgba(241, 138, 181, 0.25)',
    hoverBorder: 'rgba(241, 138, 181, 0.5)',
    hoverShadow: '0 8px 30px rgba(241, 138, 181, 0.15)',
    shimmerDelay: '0.8s',
    pulseDelay: 1.2,
  },
  {
    id: 'assets',
    icon: TrendingUp,
    title: 'הוספת נכסים',
    description: 'הזן חסכונות, השקעות, נדל"ן או כל נכס אחר כדי לחשב את ההון הנקי שלך.',
    accentColor: '#0DBACC',
    accentBg: 'rgba(13, 186, 204, 0.08)',
    glowColor: 'rgba(13, 186, 204, 0.2)',
    hoverBorder: 'rgba(13, 186, 204, 0.4)',
    hoverShadow: '0 8px 30px rgba(13, 186, 204, 0.12)',
    shimmerDelay: '0.95s',
    pulseDelay: 1.8,
  },
  {
    id: 'liabilities',
    icon: CreditCard,
    title: 'הוספת התחייבויות',
    description: 'תעד משכנתאות, הלוואות וחובות קבועים כדי לקבל תמונה פיננסית שלמה ומדויקת.',
    accentColor: '#F18AB5',
    accentBg: 'rgba(241, 138, 181, 0.08)',
    glowColor: 'rgba(241, 138, 181, 0.2)',
    hoverBorder: 'rgba(241, 138, 181, 0.4)',
    hoverShadow: '0 8px 30px rgba(241, 138, 181, 0.12)',
    shimmerDelay: '1.1s',
    pulseDelay: 2.4,
  },
] as const;

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 26, stiffness: 300, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 14,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, x: 30, y: 10 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { type: 'spring', damping: 20, stiffness: 240 },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 24, stiffness: 200, delay: 0.08 },
  },
};

const subtitleVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, delay: 0.2 },
  },
};

const skipVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delay: 0.9, duration: 0.4 },
  },
};

export default function NewUserOnboardingModal({
  isOpen,
  onClose,
  onImport,
  onGoals,
  onCourses,
  onAddAsset,
  onAddLiability,
}: NewUserOnboardingModalProps) {
  const handleAction = useCallback(
    (actionId: string) => {
      onClose();

      switch (actionId) {
        case 'import':
          onImport();
          break;
        case 'goals':
          onGoals();
          break;
        case 'courses':
          onCourses();
          break;
        case 'assets':
          onAddAsset();
          break;
        case 'liabilities':
          onAddLiability();
          break;
      }
    },
    [onClose, onImport, onGoals, onCourses, onAddAsset, onAddLiability]
  );

  return (
    <>
      <style jsx global>{`
        @keyframes nou-gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes nou-shimmer {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="modal-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            // No backdrop click to close — new users must make a choice or skip
          >
            <motion.div
              className="relative bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-5 start-5 z-10 p-2 rounded-lg transition-colors duration-200 hover:bg-[#F7F7F8] cursor-pointer"
                aria-label="סגור"
              >
                <X className="w-5 h-5 text-[#BDBDCB]" strokeWidth={1.75} />
              </button>

              {/* Header with animated gradient band */}
              <div className="relative pt-10 pb-4 px-8 text-center overflow-hidden">
                <div
                  className="absolute inset-0 opacity-[0.07]"
                  style={{
                    background: 'linear-gradient(135deg, #0DBACC, #69ADFF, #F18AB5, #0DBACC)',
                    backgroundSize: '300% 300%',
                    animation: 'nou-gradient-shift 8s ease infinite',
                  }}
                />
                <div className="relative z-[1]">
                  <motion.h2
                    className="text-xl font-bold mb-1"
                    style={{ color: '#303150' }}
                    variants={headerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    ברוכים הבאים ל-<span style={{ color: '#69ADFF' }}>myNETO</span>
                  </motion.h2>
                  <motion.p
                    className="text-sm font-medium mb-1"
                    style={{ color: '#7E7F90' }}
                    variants={headerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                  הבית הפיננסי של המשפחה החרדית
                  </motion.p>
                  <motion.p
                    className="text-[0.8125rem] leading-relaxed"
                    style={{ color: '#BDBDCB' }}
                    variants={subtitleVariants}
                    initial="hidden"
                    animate="visible"
                  >
איך תרצה להתחיל?                   </motion.p>
                </div>
              </div>

              {/* CTA Cards */}
              <motion.div
                className="px-6 pb-2 pt-2 flex flex-col gap-2.5"
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
                      className="group relative flex items-center gap-4 p-4 rounded-2xl border border-[#F7F7F8] bg-white cursor-pointer text-start w-full overflow-hidden"
                      whileHover={{
                        y: -2,
                        borderColor: card.hoverBorder,
                        boxShadow: card.hoverShadow,
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{ scale: 0.985 }}
                    >
                      {/* Shimmer sweep */}
                      <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                            animation: `nou-shimmer 0.8s ease-out ${card.shimmerDelay} both`,
                            animationIterationCount: 1,
                          }}
                        />
                      </div>

                      {/* Icon with pulsing glow */}
                      <div className="relative shrink-0">
                        <motion.div
                          className="absolute inset-0 rounded-xl"
                          style={{ backgroundColor: card.glowColor }}
                          animate={{
                            scale: [1, 1.35, 1],
                            opacity: [0, 0.5, 0],
                          }}
                          transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            delay: card.pulseDelay,
                            ease: 'easeInOut',
                          }}
                        />
                        <motion.div
                          className="relative w-11 h-11 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: card.accentBg }}
                          whileHover={{ rotate: -5, scale: 1.1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        >
                          <Icon
                            className="w-5 h-5"
                            style={{ color: card.accentColor }}
                            strokeWidth={1.75}
                          />
                        </motion.div>
                      </div>

                      {/* Text */}
                      <div className="min-w-0 relative z-[1]">
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

                      {/* Chevron arrow */}
                      <motion.div
                        className="shrink-0 ms-auto opacity-0 group-hover:opacity-100 relative z-[1]"
                        style={{ color: card.accentColor }}
                        initial={false}
                        whileHover={{ x: -4 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
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
                      </motion.div>
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
                  onClick={onClose}
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
    </>
  );
}
