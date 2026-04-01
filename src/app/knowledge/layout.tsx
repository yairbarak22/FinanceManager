import type { Metadata } from 'next';
import KnowledgeProviders from '@/components/knowledge/KnowledgeProviders';

export const metadata: Metadata = {
  title: 'מרכז הידע — מדריכים לניהול כספים',
  description:
    'מדריכים מעשיים ומקיפים לניהול כספים אישיים: תקציב, חיסכון, השקעות, משכנתא, פנסיה, ביטוח וכרטיסי אשראי. כולל מדריכי שימוש במערכת MyNeto.',
  openGraph: {
    title: 'מרכז הידע — מדריכים לניהול כספים',
    description: 'מדריכים מעשיים ומקיפים לניהול כספים אישיים: תקציב, חיסכון, השקעות, משכנתא ועוד.',
    type: 'website',
    siteName: 'MyNeto',
  },
  alternates: {
    canonical: 'https://myneto.co.il/knowledge',
  },
};

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <KnowledgeProviders>{children}</KnowledgeProviders>;
}
