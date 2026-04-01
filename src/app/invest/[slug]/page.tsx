import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { investArticles, getInvestArticleBySlug } from '@/lib/invest/articles';
import InvestArticleContent from '@/components/invest/InvestArticleContent';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return investArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getInvestArticleBySlug(slug);
  if (!article) return {};

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myneto.co.il';

  return {
    title: `${article.title} | מרכז ההשקעות — MyNeto`,
    description: article.subtitle,
    keywords: article.keywords.join(', '),
    openGraph: {
      title: article.title,
      description: article.subtitle,
      type: 'article',
      siteName: 'MyNeto',
    },
    alternates: {
      canonical: `${baseUrl}/invest/${slug}`,
    },
  };
}

export default async function InvestArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getInvestArticleBySlug(slug);

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
      '@id': `${baseUrl}/invest/${slug}`,
    },
    inLanguage: 'he',
    keywords: article.keywords.join(', '),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'MyNeto', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'מרכז ההשקעות', item: `${baseUrl}/invest` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${baseUrl}/invest/${slug}` },
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
      <InvestArticleContent slug={slug} />
    </>
  );
}
