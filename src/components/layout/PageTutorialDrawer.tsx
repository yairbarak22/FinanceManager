'use client';

import { useEffect, useCallback, useState } from 'react';
import { X, Volume2, VolumeX, CheckCircle2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PageTutorialConfig } from '@/lib/pageTutorials';
import { trackMixpanelEvent } from '@/lib/mixpanel';

interface PageTutorialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: PageTutorialConfig;
}

export default function PageTutorialDrawer({ isOpen, onClose, config }: PageTutorialDrawerProps) {
  const [isMuted, setIsMuted] = useState(true);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (isOpen) setIsMuted(true);
  }, [isOpen]);

  const videoSrc = isOpen && config.lesson.videoUrl
    ? `${config.lesson.videoUrl}&autoplay=1&mute=${isMuted ? 1 : 0}`
    : undefined;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay — subtle, click-to-close, does NOT block body scroll */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/10 z-[9998]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer — physical left side */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 left-0 h-full z-[9999] flex flex-col bg-white shadow-2xl w-full sm:w-[85vw] md:w-[45vw] lg:w-[35vw] xl:w-[30vw] max-w-lg"
            style={{ direction: 'rtl' }}
            role="complementary"
            aria-label="הדרכה לעמוד"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F7F7F8] flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#69ADFF]/10 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#69ADFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                </div>
                <h2 className="text-[0.875rem] font-bold text-[#303150] truncate">
                  {config.lesson.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[#F7F7F8] transition-colors cursor-pointer flex-shrink-0"
                aria-label="סגירה"
                autoFocus
              >
                <X className="w-4.5 h-4.5 text-[#7E7F90]" strokeWidth={1.75} />
              </button>
            </div>

            {/* Video */}
            <div className="relative w-full flex-shrink-0" style={{ paddingTop: '56.25%' }}>
              {videoSrc && (
                <iframe
                  key={isMuted ? 'muted' : 'unmuted'}
                  src={videoSrc}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}

              {/* Mute / Unmute toggle */}
              <button
                type="button"
                onClick={() => setIsMuted((v) => !v)}
                className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.6875rem] font-medium text-white cursor-pointer transition-colors"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>הפעלת סאונד</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>השתקה</span>
                  </>
                )}
              </button>
            </div>

            {/* Summary bullets */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <p className="text-[0.75rem] font-semibold text-[#7E7F90] mb-3">
                מה תלמד בסרטון הזה:
              </p>
              <ul className="space-y-2.5">
                {config.summaryBullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0DBACC] flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-[0.8125rem] text-[#303150] leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>

              {/* Duration pill */}
              <div className="mt-5 flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F7F7F8] text-[0.6875rem] font-medium text-[#7E7F90]">
                  {config.lesson.duration} דק׳
                </span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

interface TutorialPillProps {
  config: PageTutorialConfig;
  sectionKey: string;
}

export function TutorialPill({ config, sectionKey }: TutorialPillProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          trackMixpanelEvent('Section Tutorial Opened', { section: sectionKey });
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#69ADFF]/10 text-[#303150] text-[0.75rem] font-medium hover:bg-[#69ADFF]/20 transition-colors cursor-pointer"
      >
        <span>איך זה עובד?</span>
        <Play className="w-3 h-3 text-[#69ADFF]" strokeWidth={2.5} fill="#69ADFF" />
      </button>

      <PageTutorialDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        config={config}
      />
    </>
  );
}
