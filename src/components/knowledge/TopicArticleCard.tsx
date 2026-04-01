'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Article } from '@/lib/knowledge/articles';
import { getCategoryById } from '@/lib/knowledge/categories';

interface TopicArticleCardProps {
  article: Article;
  index: number;
}

export default function TopicArticleCard({ article, index }: TopicArticleCardProps) {
  const noMotion = !!useReducedMotion();
  const category = getCategoryById(article.category);

  return (
    <motion.div
      initial={noMotion ? undefined : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        noMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 300, damping: 30, delay: index * 0.04 }
      }
    >
      <Link
        href={`/knowledge/${article.slug}`}
        className="group block h-full rounded-2xl transition-all duration-200 hover:shadow-lg"
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #F0F0F3',
        }}
      >
        <div className="p-5 flex flex-col h-full">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: category?.colorLight || '#F7F7F8' }}
          >
            <article.icon
              className="w-5 h-5"
              style={{ color: category?.color || '#303150' }}
            />
          </div>

          {/* Title */}
          <h3
            className="text-[15px] font-bold mb-2 leading-snug group-hover:text-[#2B4699] transition-colors"
            style={{ color: '#1D1D1F' }}
          >
            {article.title}
          </h3>

          {/* Subtitle — max 2 lines */}
          <p
            className="text-[13px] leading-relaxed mb-4 flex-1"
            style={{
              color: '#7E7F90',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {article.subtitle}
          </p>

          {/* Reading time */}
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: '#BDBDCB' }}>
            <Clock className="w-3.5 h-3.5" />
            {article.readingTime} דק׳ קריאה
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
