'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Article } from '@/lib/knowledge/articles';
import { getCategoryById } from '@/lib/knowledge/categories';

interface ArticleCardProps {
  article: Article;
  index: number;
}

export default function ArticleCard({ article, index }: ArticleCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const noMotion = !!shouldReduceMotion;
  const category = getCategoryById(article.category);

  return (
    <motion.div
      initial={noMotion ? undefined : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        noMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 300, damping: 30, delay: index * 0.04 }
      }
    >
      <Link
        href={`/knowledge/${article.slug}`}
        className="group block h-full rounded-2xl transition-all duration-300"
        style={{
          background: '#FFFFFF',
          border: '1.5px solid rgba(0,0,0,0.04)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <div className="p-5 flex flex-col h-full">
          {/* Icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
            style={{ background: category?.colorLight || '#F7F7F8' }}
          >
            <article.icon
              className="w-5 h-5"
              style={{ color: category?.color || '#303150' }}
            />
          </div>

          {/* Title */}
          <h3
            className="text-[15px] font-bold mb-2 leading-snug transition-colors duration-200 group-hover:text-[#2B4699]"
            style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}
          >
            {article.title}
          </h3>

          {/* Subtitle */}
          <p
            className="text-[13px] leading-relaxed mb-4 flex-1"
            style={{ color: '#7E7F90', fontFamily: 'var(--font-heebo)' }}
          >
            {article.subtitle}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[#F7F7F8]">
            <span
              className="flex items-center gap-1.5 text-[12px]"
              style={{ color: '#BDBDCB' }}
            >
              <Clock className="w-3.5 h-3.5" />
              {article.readingTime} דק׳ קריאה
            </span>
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
              style={{
                background: category?.colorLight || '#F7F7F8',
                color: category?.color || '#7E7F90',
              }}
            >
              {category?.label}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
