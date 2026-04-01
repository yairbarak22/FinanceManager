'use client';

import { useState, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import { investArticles } from '@/lib/invest/articles';
import { investCategories } from '@/lib/invest/categories';
import { searchInvestArticles } from '@/lib/invest/search';
import InvestHero from './InvestHero';
import InvestTopicSection from './InvestTopicSection';
import InvestArticleCard from './InvestArticleCard';

const categoryDescriptions: Record<string, string> = {
  'invest-basics': 'מהי השקעה ולמה היא חשובה — יסודות שכל אחד צריך להכיר',
  'invest-course': 'סרטונים ומדריכים צעד אחר צעד — מחיסכון להשקעה',
  'invest-action': 'פתיחת חשבון, העברת תיק וכלים שיעזרו לך להתחיל',
  'invest-faq': 'תשובות לשאלות הנפוצות ביותר על השקעות, כשרות, מיסוי ועוד',
};

interface InvestCenterPageProps {
  embedded?: boolean;
}

export default function InvestCenterPage({ embedded }: InvestCenterPageProps) {
  const [query, setQuery] = useState('');
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const toggleTopic = useCallback((id: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isSearching = query.trim().length > 0;

  const searchResults = useMemo(
    () => (isSearching ? searchInvestArticles(investArticles, query) : []),
    [query, isSearching]
  );

  const groupedArticles = useMemo(() => {
    const contentCategories = investCategories.filter((c) => c.id !== 'all');
    return contentCategories
      .map((cat) => ({
        category: cat,
        articles: investArticles.filter((a) => a.category === cat.id),
      }))
      .filter((g) => g.articles.length > 0);
  }, []);

  const content = (
    <>
      <InvestHero query={query} onQueryChange={handleQueryChange} embedded={embedded} />

      <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ${embedded ? 'pb-10' : 'pb-20'}`}>
        {isSearching ? (
          <div className="pt-6">
            {searchResults.length === 0 ? (
              <div className="text-center py-20">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: '#F7F7F8' }}
                >
                  <Search className="w-6 h-6" style={{ color: '#BDBDCB' }} />
                </div>
                <p className="text-base font-bold mb-1" style={{ color: '#1D1D1F' }}>
                  לא נמצאו תוצאות
                </p>
                <p className="text-sm" style={{ color: '#7E7F90' }}>
                  נסו מילות חיפוש אחרות
                </p>
              </div>
            ) : (
              <>
                <p className="text-[13px] mb-4" style={{ color: '#BDBDCB' }}>
                  {searchResults.length} תוצאות
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((article, i) => (
                    <InvestArticleCard key={article.slug} article={article} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#F0F0F3]">
            {groupedArticles.map((group, i) => (
              <InvestTopicSection
                key={group.category.id}
                category={group.category}
                description={categoryDescriptions[group.category.id] || ''}
                articles={group.articles}
                isExpanded={expandedTopics.has(group.category.id)}
                onToggle={() => toggleTopic(group.category.id)}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-heebo)' }}>
      {content}
    </div>
  );
}
