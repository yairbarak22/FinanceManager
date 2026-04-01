import { MetadataRoute } from 'next';
import { articles } from '@/lib/knowledge/articles';
import { investArticles } from '@/lib/invest/articles';

/**
 * Dynamic Sitemap Generator for MyNeto
 *
 * Includes all public, indexable pages:
 * - Homepage
 * - Knowledge center + all articles
 * - Investment center + all articles
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myneto.co.il';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/knowledge`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/invest`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  const knowledgePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/knowledge/${article.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const investPages: MetadataRoute.Sitemap = investArticles.map((article) => ({
    url: `${baseUrl}/invest/${article.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...knowledgePages, ...investPages];
}
