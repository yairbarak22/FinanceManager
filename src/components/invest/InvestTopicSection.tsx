'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { InvestArticle } from '@/lib/invest/articles';
import type { InvestCategory } from '@/lib/invest/categories';
import InvestArticleCard from './InvestArticleCard';

const INITIAL_SHOW = 3;

interface InvestTopicSectionProps {
  category: InvestCategory;
  description: string;
  articles: InvestArticle[];
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

export default function InvestTopicSection({
  category,
  description,
  articles,
  isExpanded,
  onToggle,
  index,
}: InvestTopicSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const noMotion = !!useReducedMotion();

  const previewArticles = articles.slice(0, INITIAL_SHOW);
  const hiddenArticles = articles.slice(INITIAL_SHOW);
  const showToggle = hiddenArticles.length > 0;

  return (
    <motion.section
      ref={ref}
      initial={noMotion ? undefined : { opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={noMotion ? { duration: 0 } : { duration: 0.5, delay: index * 0.08 }}
      className="py-12"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: category.colorLight }}
        >
          <category.icon
            className="w-6 h-6"
            style={{ color: category.color }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h2
              className="text-xl sm:text-2xl font-bold"
              style={{ color: '#1D1D1F' }}
            >
              {category.label}
            </h2>
            <span
              className="text-[12px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: category.colorLight, color: category.color }}
            >
              {articles.length}
            </span>
          </div>
          <p className="text-[14px] leading-relaxed" style={{ color: '#7E7F90' }}>
            {description}
          </p>
        </div>
      </div>

      {/* Preview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {previewArticles.map((article, i) => (
          <InvestArticleCard key={article.slug} article={article} index={i} />
        ))}
      </div>

      {/* Expanded cards */}
      <AnimatePresence initial={false}>
        {isExpanded && hiddenArticles.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              {hiddenArticles.map((article, i) => (
                <InvestArticleCard key={article.slug} article={article} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand/collapse toggle */}
      {showToggle && (
        <div className="flex justify-center mt-6">
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-colors hover:bg-[#F5F9FE]"
            style={{ color: category.color }}
          >
            {isExpanded ? 'הצג פחות' : `הצג עוד ${hiddenArticles.length} מאמרים`}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
        </div>
      )}
    </motion.section>
  );
}
