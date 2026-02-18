'use client';

import { useRef } from 'react';
import {
  Plane,
  Car,
  Home,
  GraduationCap,
  Umbrella,
  Wallet,
  Shield,
  Edit3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GOAL_CATEGORIES = [
  { id: 'saving', label: 'חיסכון כללי', icon: Wallet },
  { id: 'home', label: 'דירה / בית', icon: Home },
  { id: 'car', label: 'רכב', icon: Car },
  { id: 'travel', label: 'נסיעות', icon: Plane },
  { id: 'education', label: 'לימודים', icon: GraduationCap },
  { id: 'vacation', label: 'חופשה', icon: Umbrella },
  { id: 'emergency', label: 'קרן חירום', icon: Shield },
  { id: 'custom', label: 'מותאם אישית', icon: Edit3 },
];

interface GoalSimulatorIdentityProps {
  name: string;
  onNameChange: (name: string) => void;
  category: string;
  onCategoryChange: (categoryId: string) => void;
  customCategory: string;
  onCustomCategoryChange: (value: string) => void;
  showCustomInput: boolean;
}

export { GOAL_CATEGORIES };

export default function GoalSimulatorIdentity({
  name,
  onNameChange,
  category,
  onCategoryChange,
  customCategory,
  onCustomCategoryChange,
  showCustomInput,
}: GoalSimulatorIdentityProps) {
  const categoryRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLDivElement>(null);

  const handleNameBlur = () => {
    if (name.trim()) {
      setTimeout(() => {
        categoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

  const handleCategorySelect = (catId: string) => {
    onCategoryChange(catId);
    if (catId === 'custom') {
      setTimeout(() => {
        customInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 350);
    }
  };

  return (
    <div className="space-y-5">
      {/* Goal Name */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: '#7E7F90' }}
        >
          שם היעד
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={handleNameBlur}
          placeholder="לדוגמה: קניית דירה, חופשה משפחתית..."
          className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#69ADFF]"
          style={{
            borderColor: '#E8E8ED',
            color: '#303150',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
        />
      </div>

      {/* Category Pills */}
      <div ref={categoryRef}>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: '#7E7F90' }}
        >
          קטגוריה
        </label>
        <div className="flex flex-wrap gap-2">
          {GOAL_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                style={{
                  backgroundColor: isSelected ? 'rgba(105, 173, 255, 0.12)' : '#F7F7F8',
                  border: isSelected ? '2px solid #69ADFF' : '2px solid transparent',
                }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: isSelected ? '#69ADFF' : '#7E7F90' }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: isSelected ? '#69ADFF' : '#7E7F90' }}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom category input with AnimatePresence */}
        <AnimatePresence>
          {showCustomInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="mt-3" ref={customInputRef}>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => onCustomCategoryChange(e.target.value)}
                  placeholder="הזן קטגוריה מותאמת אישית"
                  className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#69ADFF]"
                  style={{
                    borderColor: '#E8E8ED',
                    color: '#303150',
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
