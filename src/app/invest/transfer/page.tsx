import { Suspense } from 'react';
import TransferPortfolioPage from '@/components/funnel/TransferPortfolioPage';

export const metadata = {
  title: 'MyNeto — העברת תיק השקעות קיים | 0₪ דמי ניהול לכל החיים',
  description:
    'איך להעביר תיק השקעות קיים לאלטשולר שחם דרך MyNeto — 0₪ דמי ניהול לכל החיים, 200₪ מתנה, ומדריך פרקטי צעד אחר צעד',
};

export default function TransferPortfolioRoute() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: '#F5F5F7' }}
        >
          <div
            className="w-10 h-10 rounded-full animate-spin"
            style={{ border: '3px solid #E8E8ED', borderTopColor: '#69ADFF' }}
          />
        </div>
      }
    >
      <TransferPortfolioPage />
    </Suspense>
  );
}
