'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { useModal } from '@/context/ModalContext';

export default function QuickAddButton() {
  const { openModal, isModalOpen } = useModal();
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimation();
  const isHoveredRef = useRef(false);
  const isMountedRef = useRef(true);

  // Check if quick-add modal is open
  const isQuickAddOpen = isModalOpen('quick-add');

  // Keep ref in sync with state
  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  // Initialize button appearance
  useEffect(() => {
    if (!isQuickAddOpen) {
      controls.start({ scale: 1, rotate: 0 });
    }
  }, [isQuickAddOpen, controls]);

  // Wiggle animation interval - more subtle than mobile
  useEffect(() => {
    isMountedRef.current = true;
    
    const performWiggle = async () => {
      if (!isMountedRef.current || isHoveredRef.current || isQuickAddOpen) return;
      
      try {
        // Subtle wiggle animation for desktop
        await controls.start({
          scale: [1, 1.05, 0.98, 1.02, 1],
          rotate: [0, -2, 2, -1, 0],
          transition: {
            duration: 0.5,
            ease: 'easeInOut',
          },
        });
      } catch {
        // Animation was interrupted, ignore
      }
    };

    // Start wiggle after 5 seconds, then repeat every 5.5 seconds (0.5s animation + 5s delay)
    const initialTimeout = setTimeout(() => {
      performWiggle();
    }, 5000);

    const intervalId = setInterval(() => {
      performWiggle();
    }, 5500);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
      controls.stop();
    };
  }, [controls, isQuickAddOpen]);

  // Handle hover state changes
  useEffect(() => {
    if (isHovered) {
      controls.start({
        scale: 1.03,
        rotate: 0,
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      });
    } else {
      controls.start({
        scale: 1,
        rotate: 0,
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      });
    }
  }, [isHovered, controls]);

  const handleClick = () => {
    openModal('quick-add');
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={controls}
      whileTap={{ scale: 0.97 }}
      className="btn-primary hidden lg:flex focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        background: isHovered 
          ? 'linear-gradient(135deg, #A8D4FF 0%, #5A9EE6 100%)' 
          : 'linear-gradient(135deg, #C1DDFF 0%, #69ADFF 100%)',
        boxShadow: isHovered
          ? '0 6px 24px rgba(105, 173, 255, 0.35), 0 2px 8px rgba(105, 173, 255, 0.2)'
          : '0 4px 20px rgba(105, 173, 255, 0.25)',
        transition: 'background 0.2s ease-out, box-shadow 0.2s ease-out',
        // @ts-expect-error CSS custom property for focus ring
        '--tw-ring-color': 'rgba(105, 173, 255, 0.3)',
      }}
      aria-label="הוספה מהירה"
    >
      <motion.span
        animate={{ rotate: isHovered ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Plus className="w-5 h-5" strokeWidth={2.5} />
      </motion.span>
      <span className="text-sm font-medium">הוספה מהירה</span>
    </motion.button>
  );
}
