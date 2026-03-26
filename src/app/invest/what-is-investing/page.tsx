import { Suspense } from 'react';
import WhatIsInvestingPage from '@/components/funnel/WhatIsInvestingPage';

export const metadata = {
  title: 'MyNeto — מה זה השקעה? | מדריך מעשי להשקעה חכמה',
  description:
    'מדריך מקיף שמסביר מהי השקעה, ריבית דריבית, השקעה פסיבית ואיך להתחיל — בלי ידע מוקדם ובכשרות מלאה',
};

export default function WhatIsInvestingRoute() {
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
      <WhatIsInvestingPage />
    </Suspense>
  );
}
