'use client';

import React, { useState } from 'react';

interface PassoverOnboardingProps {
  onSelectTemplate: (template: 'hosting' | 'guest') => Promise<void>;
}

export default function PassoverOnboarding({ onSelectTemplate }: PassoverOnboardingProps) {
  const [loading, setLoading] = useState<'hosting' | 'guest' | null>(null);

  const handleSelect = async (template: 'hosting' | 'guest') => {
    if (loading) return;
    setLoading(template);
    try {
      await onSelectTemplate(template);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="rounded-3xl px-6 py-10 sm:px-10 sm:py-14 text-center"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
      }}
    >
      <h2
        className="mb-3"
        style={{ fontSize: '24px', fontWeight: 700, color: '#303150' }}
      >
        עושים סדר בהוצאות החג
      </h2>
      <p
        className="mb-8 max-w-md mx-auto"
        style={{ fontSize: '15px', fontWeight: 400, color: '#7E7F90', lineHeight: 1.6 }}
      >
        פסח דורש היערכות כלכלית שונה. בחרו את התבנית שמתאימה לכם,
        ואנחנו נבנה לכם את תקציב החג ב-10 שניות:
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
        {/* Hosting */}
        <button
          onClick={() => handleSelect('hosting')}
          disabled={!!loading}
          className="flex-1 rounded-3xl p-6 flex flex-col items-center gap-3 transition-all duration-200 cursor-pointer group"
          style={{
            background: '#FDF8F0',
            border: '2px solid transparent',
            boxShadow: '0 2px 12px rgba(212, 168, 75, 0.12)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#D4A84B';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(212, 168, 75, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(212, 168, 75, 0.12)';
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#303150' }}>
            {loading === 'hosting' ? 'טוען...' : 'אנחנו מארחים השנה'}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 400, color: '#7E7F90' }}>
            (כולל קניות מורחבות, מצות, ניקיונות ואירוח)
          </span>
        </button>

        {/* Guest */}
        <button
          onClick={() => handleSelect('guest')}
          disabled={!!loading}
          className="flex-1 rounded-3xl p-6 flex flex-col items-center gap-3 transition-all duration-200 cursor-pointer group"
          style={{
            background: '#F7F7F8',
            border: '2px solid transparent',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#69ADFF';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(105, 173, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.04)';
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#303150' }}>
            {loading === 'guest' ? 'טוען...' : 'אנחנו מתארחים'}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 400, color: '#7E7F90' }}>
            (תקציב ממוקד: ביגוד, נסיעות ומתנות למארחים)
          </span>
        </button>
      </div>
    </div>
  );
}
