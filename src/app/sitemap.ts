import { MetadataRoute } from 'next';

/**
 * Dynamic Sitemap Generator for NETO
 *
 * This sitemap includes only public, indexable pages.
 * Private pages (dashboard, admin, invite) are excluded.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://neto.co.il';

  // Static public pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ];

  // Note: When you add public pages like /pricing, /academy, /calculators,
  // add them here or fetch dynamic slugs from the database:
  //
  // const blogPosts = await prisma.post.findMany({ where: { published: true } });
  // const dynamicPages = blogPosts.map((post) => ({
  //   url: `${baseUrl}/academy/${post.slug}`,
  //   lastModified: post.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // }));

  return [...staticPages];
}
