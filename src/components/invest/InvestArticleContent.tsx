'use client';

import { useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getInvestArticleBySlug, getRelatedInvestArticles } from '@/lib/invest/articles';
import { getInvestCategoryById } from '@/lib/invest/categories';
import { getInvestArticleContent } from '@/lib/invest/content';
import Breadcrumbs from '@/components/knowledge/Breadcrumbs';
import InvestRelatedArticles from './InvestRelatedArticles';
import InvestCtaBanner from './InvestCtaBanner';
import InvestNavbar from './InvestNavbar';
import Footer from '@/components/landing/Footer';
import LegalModal from '@/components/modals/LegalModal';
import { AppLayout } from '@/components/layout';
import { useMonth } from '@/context/MonthContext';

interface InvestArticleContentProps {
  slug: string;
}

export default function InvestArticleContent({ slug }: InvestArticleContentProps) {
  const article = getInvestArticleBySlug(slug);
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const category = article ? getInvestCategoryById(article.category) : undefined;
  const related = article ? getRelatedInvestArticles(article.slug, 3) : [];
  const content = article ? getInvestArticleContent(article.slug) : null;

  const [legalModal, setLegalModal] = useState<{
    isOpen: boolean;
    type: 'terms' | 'privacy';
  }>({ isOpen: false, type: 'terms' });

  if (!article) return null;

  const Icon = article.icon;

  const articleBody = (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'מרכז ההשקעות', href: '/invest' },
            { label: category?.label || '' },
            { label: article.title },
          ]}
        />
      </div>

      {/* Article Header */}
      <header className="mb-10">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: category?.colorLight || '#F7F7F8' }}
        >
          <Icon
            className="w-7 h-7"
            style={{ color: category?.color || '#303150' }}
          />
        </div>

        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight"
          style={{ color: '#1D1D1F' }}
        >
          {article.title}
        </h1>

        <p
          className="text-base sm:text-lg mb-5 leading-relaxed"
          style={{ color: '#86868B' }}
        >
          {article.subtitle}
        </p>

        <div className="flex items-center gap-4 text-[13px]" style={{ color: '#BDBDCB' }}>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {article.readingTime} דק׳ קריאה
          </span>
          <span
            className="font-bold px-3 py-1 rounded-lg"
            style={{
              background: category?.colorLight || '#F7F7F8',
              color: category?.color || '#7E7F90',
            }}
          >
            {category?.label}
          </span>
        </div>
      </header>

      {/* Article Content */}
      <article className="article-content">{content}</article>

      {/* CTA Banner */}
      <InvestCtaBanner />

      {/* Back link */}
      <div className="mt-10 pt-6 border-t border-[#F0F0F3]">
        <Link
          href="/invest"
          className="inline-flex items-center gap-2 text-[14px] font-bold transition-colors hover:text-[#2B4699]"
          style={{ color: '#7E7F90' }}
        >
          <ArrowRight className="w-4 h-4" />
          חזרה למרכז ההשקעות
        </Link>
      </div>

      {/* Related Articles */}
      <InvestRelatedArticles articles={related} />
    </div>
  );

  if (isAuthenticated) {
    return <AuthenticatedArticleLayout>{articleBody}</AuthenticatedArticleLayout>;
  }

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-heebo)' }}>
      <InvestNavbar />
      <main className="pt-24 md:pt-28 pb-16">
        <div className="px-4 sm:px-6">
          {articleBody}
        </div>
      </main>
      <Footer onOpenLegal={(type) => setLegalModal({ isOpen: true, type })} />
      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
        type={legalModal.type}
      />
    </div>
  );
}

function AuthenticatedArticleLayout({ children }: { children: React.ReactNode }) {
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();

  return (
    <AppLayout
      pageTitle="מרכז ההשקעות"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showMonthFilter={false}
    >
      {children}
    </AppLayout>
  );
}
