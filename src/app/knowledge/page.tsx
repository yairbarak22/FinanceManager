'use client';

import { Suspense } from 'react';
import KnowledgeCenterPage from '@/components/knowledge/KnowledgeCenterPage';

function LoadingSpinner() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#F5F5F7' }}
    >
      <div
        className="w-10 h-10 rounded-full animate-spin"
        style={{ border: '3px solid #69ADFF', borderTopColor: 'transparent' }}
      />
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <KnowledgeCenterPage />
    </Suspense>
  );
}
