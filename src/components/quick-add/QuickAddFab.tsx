'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useModal } from '@/context/ModalContext';

export default function QuickAddFab() {
  const { openModal, isModalOpen } = useModal();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isHarediWithDock, setIsHarediWithDock] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const controls = useAnimation();
  const isHoveredRef = useRef(false);
  const isMountedRef = useRef(true);

  // Check if quick-add modal is open
  const isQuickAddOpen = isModalOpen('quick-add');

  // Check if user is Haredi with active progress dock
  useEffect(() => {
    const checkHarediDock = async () => {
      try {
        const res = await fetch('/api/user/onboarding');
        if (res.ok) {
          const data = await res.json();
          setIsHarediWithDock(
            data.signupSource === 'prog' &&
            data.hasSeenOnboarding === true
          );
        }
      } catch {
        setIsHarediWithDock(false);
      }
    };
    checkHarediDock();
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  // Hide FAB when scrolling down, show when scrolling up
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down
      setIsVisible(false);
    } else {
      // Scrolling up
      setIsVisible(true);
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Initialize button appearance
  useEffect(() => {
    if (isVisible && !isQuickAddOpen) {
      controls.start({ scale: 1, opacity: 1, rotate: 0 });
    }
  }, [isVisible, isQuickAddOpen, controls]);

  // Wiggle animation interval
  useEffect(() => {
    isMountedRef.current = true;
    
    const performWiggle = async () => {
      if (!isMountedRef.current || isHoveredRef.current) return;
      
      try {
        await controls.start({
          scale: [1, 1.12, 0.95, 1.05, 1],
          rotate: [0, -5, 5, -3, 0],
          transition: {
            duration: 0.6,
            ease: 'easeInOut',
          },
        });
      } catch {
        // Animation was interrupted, ignore
      }
    };

    // Start wiggle after 4 seconds, then repeat every 4.6 seconds (0.6s animation + 4s delay)
    const initialTimeout = setTimeout(() => {
      performWiggle();
    }, 4000);

    const intervalId = setInterval(() => {
      performWiggle();
    }, 4600);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
      controls.stop();
    };
  }, [controls]);

  // Handle hover state changes
  useEffect(() => {
    if (isHovered) {
      controls.start({
        scale: 1.08,
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

  // Don't show FAB when modal is open or on mobile when Haredi dock is active
  const shouldShow = isVisible && !isQuickAddOpen && !(isMobile && isHarediWithDock);

  return (
    <AnimatePresence>
      {shouldShow && (
        <div className="md:hidden fixed bottom-6 left-6 z-50">
          {/* Subtle pulse glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #C1DDFF 0%, #69ADFF 100%)',
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Main FAB button with wiggle animation */}
          <motion.button
            type="button"
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
            initial={{ scale: 0, opacity: 0 }}
            animate={controls}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-14 h-14 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              background: 'linear-gradient(135deg, #C1DDFF 0%, #69ADFF 100%)',
              boxShadow: isHovered 
                ? '0 6px 28px rgba(105, 173, 255, 0.45), 0 12px 40px rgba(105, 173, 255, 0.2)'
                : '0 4px 20px rgba(105, 173, 255, 0.25), 0 8px 32px rgba(105, 173, 255, 0.15)',
              transition: 'box-shadow 0.2s ease-out',
              // @ts-expect-error CSS custom property for focus ring
              '--tw-ring-color': 'rgba(105, 173, 255, 0.4)',
            }}
            aria-label="הוספה מהירה"
          >
            <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}
