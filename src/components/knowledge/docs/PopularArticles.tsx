'use client';

import Link from 'next/link';
import { ChevronLeft, Clock } from 'lucide-react';
import { articles } from '@/lib/knowledge/articles';
import { getCategoryById } from '@/lib/knowledge/categories';

// Hand-picked popular articles (first from each main category + top guides)
const popularSlugs = [
  'dashboard-overview',
  'upload-transactions',
  'setup-budget',
  'compound-interest',
  'passive-investing',
  'first-apartment',
  'pension-basics',
  'debt-management',
];

export default function PopularArticles() {
  const popular = popularSlugs
    .map((slug) => articles.find((a) => a.slug === slug))
    .filter(Boolean);

  return (
    <div className="bg-white rounded-3xl border border-[#F7F7F8] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#F7F7F8]">
        <h2 className="text-lg font-bold text-[#303150]">מדריכים פופולריים</h2>
      </div>

      {popular.map((article, i) => {
        if (!article) return null;
        const cat = getCategoryById(article.category);
        return (
          <Link
            key={article.slug}
            href={`/knowledge/${article.slug}`}
            className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-[#F7F7F8] group"
            style={{
              borderBottom:
                i < popular.length - 1 ? '1px solid #F7F7F8' : 'none',
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: cat?.colorLight || '#F7F7F8' }}
            >
              <article.icon
                className="w-4 h-4"
                style={{ color: cat?.color || '#7E7F90' }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#303150] truncate group-hover:text-[#69ADFF] transition-colors">
                {article.title}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-[#BDBDCB] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readingTime} דק׳
              </span>
              <ChevronLeft className="w-4 h-4 text-[#BDBDCB] group-hover:text-[#69ADFF] transition-colors" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
