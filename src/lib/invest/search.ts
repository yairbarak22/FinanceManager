import type { InvestArticle } from './articles';
import type { InvestCategoryId } from './categories';

/**
 * Simple client-side fuzzy search over invest articles.
 * Matches against title, subtitle, and keywords.
 */
export function searchInvestArticles(
  articles: InvestArticle[],
  query: string,
  category: InvestCategoryId = 'all'
): InvestArticle[] {
  let filtered = articles;

  if (category !== 'all') {
    filtered = filtered.filter((a) => a.category === category);
  }

  if (query.trim()) {
    const terms = query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);

    filtered = filtered.filter((article) => {
      const searchableText = [
        article.title,
        article.subtitle,
        ...article.keywords,
      ]
        .join(' ')
        .toLowerCase();

      return terms.every((term) => searchableText.includes(term));
    });
  }

  return filtered;
}
