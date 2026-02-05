'use client';

import { MoreHorizontal, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { CategoryInfo } from '@/lib/categories';

interface CategoryBubblesProps {
  categories: CategoryInfo[];
  selectedCategory: string;
  onSelect: (categoryId: string) => void;
  onShowMore: () => void;
  isLoading?: boolean;
}

// Loading skeleton for category bubble
function CategoryBubbleSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl animate-pulse bg-[#F7F7F8]">
      <div className="w-9 h-9 rounded-lg bg-[#E8E8ED]" />
      <div className="w-12 h-3 rounded bg-[#E8E8ED]" />
    </div>
  );
}

export default function CategoryBubbles({
  categories,
  selectedCategory,
  onSelect,
  onShowMore,
  isLoading = false,
}: CategoryBubblesProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2" aria-label="טוען קטגוריות...">
        {[...Array(6)].map((_, i) => (
          <CategoryBubbleSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="בחר קטגוריה">
      {categories.map((category, index) => {
        const isSelected = selectedCategory === category.id;
        const IconComponent = typeof category.icon === 'function' ? category.icon : Star;
        
        return (
          <motion.button
            key={category.id}
            type="button"
            role="radio"
            onClick={() => onSelect(category.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: isSelected ? category.color : '#F7F7F8',
              boxShadow: isSelected ? `0 4px 12px ${category.color}40` : 'none',
              // Focus ring color matches category
              '--tw-ring-color': category.color,
            } as React.CSSProperties}
            aria-checked={isSelected}
            aria-label={category.nameHe}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : category.bgColor,
              }}
            >
              <IconComponent
                className="w-5 h-5"
                style={{ color: isSelected ? '#FFFFFF' : category.color }}
                strokeWidth={2}
              />
            </div>
            <span
              className="text-xs font-medium truncate max-w-full"
              style={{
                color: isSelected ? '#FFFFFF' : '#303150',
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              }}
            >
              {category.nameHe}
            </span>
          </motion.button>
        );
      })}

      {/* More Button */}
      <motion.button
        type="button"
        onClick={onShowMore}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all"
        style={{ backgroundColor: '#F7F7F8' }}
        aria-label="הצג עוד קטגוריות"
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#E8E8ED' }}
        >
          <MoreHorizontal className="w-5 h-5" style={{ color: '#7E7F90' }} strokeWidth={2} />
        </div>
        <span
          className="text-xs font-medium"
          style={{
            color: '#7E7F90',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
        >
          אחר...
        </span>
      </motion.button>
    </div>
  );
}

