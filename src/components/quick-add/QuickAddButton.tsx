'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useModal } from '@/context/ModalContext';

export default function QuickAddButton() {
  const { openModal } = useModal();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    openModal('quick-add');
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
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
