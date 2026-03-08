import { Suspense } from 'react';
import InvestFunnelPage from '@/components/funnel/InvestFunnelPage';

export const metadata = {
  title: 'myNETO — מדריך השקעות | פתח חשבון מסחר',
  description:
    'למד איך להשקיע בצורה חכמה ופתח חשבון מסחר באלטשולר שחם עם הטבות בלעדיות',
};

export default function InvestPage() {
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
      <InvestFunnelPage />
    </Suspense>
  );
}
