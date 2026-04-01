'use client';

import { useMemo } from 'react';
import { articles, getArticleBySlug } from '@/lib/knowledge/articles';
import { getCategoryById } from '@/lib/knowledge/categories';

export function useDocsNavigation(slug: string) {
  return useMemo(() => {
    const article = getArticleBySlug(slug);
    if (!article) return { article: null, category: null, prev: null, next: null };

    const category = getCategoryById(article.category);

    // Articles in the same category, then all others
    const categoryArticles = articles.filter((a) => a.category === article.category);
    const indexInCategory = categoryArticles.findIndex((a) => a.slug === slug);

    // Global index for cross-category prev/next
    const globalIndex = articles.findIndex((a) => a.slug === slug);
    const prev = globalIndex > 0 ? articles[globalIndex - 1] : null;
    const next = globalIndex < articles.length - 1 ? articles[globalIndex + 1] : null;

    return {
      article,
      category,
      prev,
      next,
      categoryArticles,
      indexInCategory,
      totalArticles: articles.length,
    };
  }, [slug]);
}
