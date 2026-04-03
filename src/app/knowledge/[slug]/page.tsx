import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { articles, getArticleBySlug } from '@/lib/knowledge/articles';
import ArticlePageContent from '@/components/knowledge/ArticlePageContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myneto.co.il';

  return {
    title: `${article.title} | מרכז הידע | MyNeto`,
    description: article.subtitle,
    keywords: article.keywords.join(', '),
    openGraph: {
      title: article.title,
      description: article.subtitle,
      type: 'article',
      siteName: 'MyNeto',
    },
    alternates: {
      canonical: `${baseUrl}/knowledge/${slug}`,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myneto.co.il';

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.subtitle,
    author: { '@type': 'Organization', name: 'MyNeto', url: baseUrl },
    publisher: {
      '@type': 'Organization',
      name: 'MyNeto',
      logo: { '@type': 'ImageObject', url: `${baseUrl}/icon.png` },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/knowledge/${slug}`,
    },
    inLanguage: 'he',
    keywords: article.keywords.join(', '),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'MyNeto', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'מרכז הידע', item: `${baseUrl}/knowledge` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${baseUrl}/knowledge/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ArticlePageContent slug={slug} />
    </>
  );
}
