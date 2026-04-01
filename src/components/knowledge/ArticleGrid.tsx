'use client';

import type { Article } from '@/lib/knowledge/articles';
import ArticleCard from './ArticleCard';
import { Search } from 'lucide-react';

interface ArticleGridProps {
  articles: Article[];
  query: string;
}

export default function ArticleGrid({ articles, query }: ArticleGridProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-16">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: '#F7F7F8' }}
        >
          <Search className="w-7 h-7" style={{ color: '#BDBDCB' }} />
        </div>
        <p
          className="text-lg font-bold mb-2"
          style={{ color: '#303150', fontFamily: 'var(--font-heebo)' }}
        >
          לא נמצאו תוצאות
        </p>
        <p
          className="text-sm"
          style={{ color: '#7E7F90', fontFamily: 'var(--font-heebo)' }}
        >
          {query
            ? 'נסו מילות חיפוש אחרות או בחרו קטגוריה אחרת'
            : 'אין מאמרים בקטגוריה זו'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map((article, i) => (
        <ArticleCard key={article.slug} article={article} index={i} />
      ))}
    </div>
  );
}
