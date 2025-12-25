'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Medal, Rocket, Eye, TrendingUp, PieChart } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  return (
    <div 
      dir="rtl" 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Tech Grid Pattern Overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }}
      />

      {/* Ambient Glow Effects */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div 
          style={{ 
            position: 'absolute',
            top: '-150px',
            right: '-150px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)',
          }}
        />
        <div 
          style={{ 
            position: 'absolute',
            bottom: '-150px',
            left: '-150px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Main Container - CSS Grid for Split Screen */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
        }}
      >
        {/* Left Side - White Card Area */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '48px',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
              <span style={{ fontSize: '36px', fontWeight: 900, color: '#1E293B', letterSpacing: '-0.02em' }}>NET</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <PieChart style={{ width: '36px', height: '36px', color: '#1E293B' }} strokeWidth={2.5} />
                <TrendingUp style={{ width: '20px', height: '20px', color: '#10B981', position: 'absolute', top: '-4px', right: '-8px' }} strokeWidth={3} />
              </div>
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1E293B', textAlign: 'center', marginBottom: '40px' }}>
              בונים הון, לא רק משכורת.
            </h1>

            {/* Error Message */}
            {error && (
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '16px', textAlign: 'center' }}>
                <p style={{ color: '#DC2626', fontSize: '14px', fontWeight: 500 }}>
                  {error === 'OAuthAccountNotLinked'
                    ? 'כתובת האימייל כבר קיימת במערכת עם ספק אחר'
                    : 'שגיאה בהתחברות. נסה שוב.'}
                </p>
              </div>
            )}

            {/* Feature List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
              {/* Feature 1 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', backgroundColor: '#EEF2FF', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Medal style={{ width: '28px', height: '28px', color: '#6366F1' }} />
                </div>
                <div style={{ flex: 1, paddingTop: '4px' }}>
                  <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.7 }}>
                    <span style={{ fontWeight: 700, color: '#1E293B' }}>תמקסם את הזכויות:</span>{' '}
                    המערכת תסרוק ותדרוש עבורך כל הטבה – ממילואים ועד נקודות זיכוי לסטודנטים.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', backgroundColor: '#EEF2FF', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Rocket style={{ width: '28px', height: '28px', color: '#6366F1' }} />
                </div>
                <div style={{ flex: 1, paddingTop: '4px' }}>
                  <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.7 }}>
                    <span style={{ fontWeight: 700, color: '#1E293B' }}>תשקיע חכם:</span>{' '}
                    הופכים את הכסף הפנוי הראשון שלך למנוע צמיחה, במקום שיישחק בעו&quot;ש.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', backgroundColor: '#EEF2FF', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Eye style={{ width: '28px', height: '28px', color: '#6366F1' }} />
                </div>
                <div style={{ flex: 1, paddingTop: '4px' }}>
                  <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.7 }}>
                    <span style={{ fontWeight: 700, color: '#1E293B' }}>תראה הכל:</span>{' '}
                    תמונת מצב מלאה של העושר שלך, ברגע אחד, בלי אקסלים מסובכים.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => signIn('google', { callbackUrl })}
              style={{ 
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '18px 24px',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                color: 'white',
                fontSize: '18px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #7C3AED 100%)',
                boxShadow: '0 10px 40px -10px rgba(99,102,241,0.6)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 15px 50px -10px rgba(99,102,241,0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(99,102,241,0.6)';
              }}
            >
              <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>לפרוץ את תקרת הזכוכית</span>
            </button>
          </div>
        </div>

        {/* Right Side - Dark Content */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
          }}
        >
          <div style={{ maxWidth: '520px', textAlign: 'right' }}>
            {/* Main Headline */}
            <h2 style={{ fontSize: '56px', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: '32px' }}>
              אתה עושה הכל &apos;נכון&apos;.
              <br />
              אז למה אתה עדיין לא שם?
            </h2>

            {/* Sub-headline */}
            <p style={{ fontSize: '20px', color: '#CBD5E1', lineHeight: 1.7 }}>
              צבא, מילואים, תואר, קריירה. המסלול הישראלי הקלאסי כבר לא מבטיח דירה או עושר. כדי לנצח את השיטה ב-2025, אתה צריך מערכת הפעלה אחרת לכסף שלך.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Responsive Styles */}
      <style jsx>{`
        @media (max-width: 1024px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="maxWidth: '520px'"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div 
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
          }}
        >
          <div 
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid #6366F1',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
