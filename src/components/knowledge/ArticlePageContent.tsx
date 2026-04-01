'use client';

import { Clock } from 'lucide-react';
import { getRelatedArticles } from '@/lib/knowledge/articles';
import { getArticleContent } from '@/lib/knowledge/content';
import { useDocsNavigation } from '@/hooks/useDocsNavigation';
import Navbar from '@/components/landing/Navbar';
import DocsLayout from './docs/DocsLayout';
import Breadcrumbs from './Breadcrumbs';
import RelatedArticles from './RelatedArticles';
import ArticleNav from './docs/ArticleNav';
import ArticleFeedback from './docs/ArticleFeedback';

interface ArticlePageContentProps {
  slug: string;
}

export default function ArticlePageContent({ slug }: ArticlePageContentProps) {
  const { article, category, prev, next } = useDocsNavigation(slug);
  const related = article ? getRelatedArticles(article.slug, 3) : [];
  const content = article ? getArticleContent(article.slug) : null;

  if (!article) return null;

  return (
    <>
    <Navbar callbackUrl="/knowledge" bgColor="#FFFFFF" />
    <DocsLayout activeSlug={slug}>
      {/* Breadcrumbs — subtle, small */}
      <div className="mb-8">
        <Breadcrumbs
          items={[
            { label: 'מרכז הידע', href: '/knowledge' },
            { label: category?.label || '' },
          ]}
        />
      </div>

      {/* Article Header — strong hierarchy */}
      <header className="mb-12">
        <h1
          className="text-[2rem] sm:text-[2.5rem] font-extrabold mb-5 leading-[1.2] tracking-tight"
          style={{ color: '#1A1D26' }}
        >
          {article.title}
        </h1>

        {/* Lead paragraph */}
        <p
          className="text-[17px] sm:text-[18px] mb-6 leading-[1.7]"
          style={{ color: '#6B7280' }}
        >
          {article.subtitle}
        </p>

        <div className="flex items-center gap-5 text-[13px]" style={{ color: '#B0B5BF' }}>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {article.readingTime} דק׳ קריאה
          </span>
          <span
            className="px-2.5 py-0.5 rounded-full text-[12px] font-medium"
            style={{
              background: category?.colorLight || '#F3F4F6',
              color: category?.color || '#6B7280',
            }}
          >
            {category?.label}
          </span>
        </div>
      </header>

      {/* Article Content */}
      <article className="article-content">{content}</article>

      {/* Feedback */}
      <div className="mt-12 pt-8 border-t border-[#EAEDF0]">
        <ArticleFeedback />
      </div>

      {/* Prev / Next */}
      <ArticleNav prev={prev} next={next} />

      {/* Related */}
      <RelatedArticles articles={related} />
    </DocsLayout>
    </>
  );
}
