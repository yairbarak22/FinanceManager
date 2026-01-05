import { MetadataRoute } from 'next';

/**
 * Robots.txt Generator for NETO
 *
 * Controls search engine crawling behavior:
 * - Allows: Public pages (/login)
 * - Disallows: Private/authenticated areas, API routes, admin pages
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/robots-txt
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://neto.co.il';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/login'],
        disallow: [
          '/',           // Main dashboard (protected)
          '/admin/',     // Admin area
          '/api/',       // API routes
          '/invite/',    // Invite tokens (private)
          '/_next/',     // Next.js internals
          '/static/',    // Static assets that shouldn't be indexed
        ],
      },
      // Block bad bots more aggressively
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai'],
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
