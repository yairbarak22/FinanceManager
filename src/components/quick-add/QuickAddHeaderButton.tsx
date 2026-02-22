'use client';

import { Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { useModal } from '@/context/ModalContext';

const pulseVariants = {
  idle: {
    scale: [1, 1.08, 1],
    transition: {
      duration: 1.6,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatDelay: 3,
    },
  },
};

export default function QuickAddHeaderButton() {
  const { openModal, isModalOpen } = useModal();
  const isQuickAddOpen = isModalOpen('quick-add');

  if (isQuickAddOpen) return null;

  return (
    <div className="hidden md:flex relative">
      {/* Subtle glow ring behind the button */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{ background: 'radial-gradient(circle, rgba(126, 127, 144, 0.12) 0%, transparent 70%)' }}
        animate={{ opacity: [0, 0.5, 0], scale: [0.9, 1.25, 0.9] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.button
        type="button"
        onClick={() => openModal('quick-add')}
        variants={pulseVariants}
        animate="idle"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        className="relative p-2 text-[#7E7F90] hover:text-[#303150] rounded-lg transition-colors hover:bg-[#F7F7F8]"
        aria-label="הוספה מהירה"
        title="הוספה מהירה (C)"
      >
        <Pencil className="w-[18px] h-[18px]" strokeWidth={1.75} />
      </motion.button>
    </div>
  );
}
