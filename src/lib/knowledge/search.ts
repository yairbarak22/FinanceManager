import type { Article } from './articles';
import type { CategoryId } from './categories';

/**
 * Simple client-side fuzzy search over articles.
 * Matches against title, subtitle, and keywords.
 */
export function searchArticles(
  articles: Article[],
  query: string,
  category: CategoryId = 'all'
): Article[] {
  let filtered = articles;

  // Filter by category
  if (category !== 'all') {
    filtered = filtered.filter((a) => a.category === category);
  }

  // Filter by search query
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
