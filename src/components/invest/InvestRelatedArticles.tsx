'use client';

import Link from 'next/link';
import { Clock, ArrowLeft } from 'lucide-react';
import { getInvestCategoryById } from '@/lib/invest/categories';
import type { InvestArticle } from '@/lib/invest/articles';

interface InvestRelatedArticlesProps {
  articles: InvestArticle[];
}

export default function InvestRelatedArticles({ articles }: InvestRelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-12 pt-10 border-t border-[#F0F0F3]">
      <h2
        className="text-xl font-bold mb-6"
        style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}
      >
        מאמרים נוספים שיעניינו אותך
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {articles.map((article) => {
          const category = getInvestCategoryById(article.category);
          return (
            <Link
              key={article.slug}
              href={`/invest/${article.slug}`}
              className="group block rounded-2xl p-4 transition-all duration-200"
              style={{
                background: '#FAFAFA',
                border: '1.5px solid rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: category?.colorLight || '#F7F7F8' }}
                >
                  <article.icon
                    className="w-4 h-4"
                    style={{ color: category?.color || '#303150' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-[14px] font-bold mb-1 leading-snug group-hover:text-[#2B4699] transition-colors"
                    style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}
                  >
                    {article.title}
                  </h3>
                  <span
                    className="flex items-center gap-1 text-[12px]"
                    style={{ color: '#BDBDCB' }}
                  >
                    <Clock className="w-3 h-3" />
                    {article.readingTime} דק׳
                    <ArrowLeft className="w-3 h-3 ms-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
