'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Medal, Rocket, Eye, PieChart } from 'lucide-react';
import LegalModal from '@/components/modals/LegalModal';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // Legal modal state
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'terms' | 'privacy' }>({
    isOpen: false,
    type: 'terms',
  });

  return (
    <div 
      dir="rtl" 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #F5F9FE 0%, #F0F6FD 15%, #EAF3FC 30%, #E4F0FB 45%, #DEEDF9 60%, #D8EAF8 75%, #D2E7F6 90%, #CCE4F5 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Tech Grid Pattern Overlay - REMOVED */}

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

      {/* Main Container - Centered Layout */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
        }}
      >
        {/* Hero Headline */}
        <h2
          style={{
            fontSize: '32px',
            fontWeight: 500,
            color: '#1D1D1F',
            textAlign: 'center',
            marginBottom: '40px',
            fontFamily: 'var(--font-heebo)',
          }}
        >
          העתיד הכלכלי שלך מתחיל כאן.
        </h2>

        {/* Glassmorphism Card */}
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            padding: '48px',
            borderRadius: '32px',
            direction: 'rtl',

            // Glassmorphism Effect - Frosted glass on warm background
            background: 'rgba(255, 255, 255, 0.50)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',

            // Border & Shadow - Rim light effect
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Logo - NETO */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0px',
              marginBottom: '32px',
            }}
          >
            <PieChart
              style={{
                width: '50px',
                height: '50px',
                color: '#2B4699',
                marginTop: '0px',
                marginLeft: '-2px',
              }}
              strokeWidth={3}
            />
            <span
              style={{
                fontSize: '48px',
                fontWeight: 900,
                color: '#1D1D1F',
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-heebo), sans-serif',
              }}
            >
              NET
            </span>

              </div>

          {/* Main Headline */}
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#1D1D1F',
              textAlign: 'center',
              marginBottom: '32px',
              lineHeight: 1.3,
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            דואגים לעתיד שלך          </h1>

              {/* Error Message */}
              {error && (
            <div
              style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: 'rgba(254, 242, 242, 0.9)',
                border: '1px solid rgba(254, 202, 202, 0.9)',
                borderRadius: '16px',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#DC2626', fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-heebo)' }}>
                    {error === 'OAuthAccountNotLinked'
                      ? 'כתובת האימייל כבר קיימת במערכת עם ספק אחר'
                      : 'שגיאה בהתחברות. נסה שוב.'}
                  </p>
                </div>
              )}

          {/* Features List */}
          <div style={{ marginBottom: '32px' }}>
                {/* Feature 1 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                flexDirection: 'row-reverse', // Icon on right, text on left
              }}
            >

              <span
                style={{
                  fontSize: '16px',
                  color: '#1D1D1F',
                  fontWeight: 500,
                  fontFamily: 'var(--font-heebo), sans-serif',
                  flex: 1,
                  textAlign: 'right',
                }}
              >
                מקסום זכויות והטבות בעזרת AI
              </span>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: '2px solid #1D1D1F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Medal style={{ width: '20px', height: '20px', color: '#1D1D1F', strokeWidth: 1.5 }} />
                  </div>
                </div>


                {/* Feature 2 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                flexDirection: 'row-reverse', // Icon on right, text on left
              }}
            >

              <span
                style={{
                  fontSize: '16px',
                  color: '#1D1D1F',
                  fontWeight: 500,
                  fontFamily: 'var(--font-heebo), sans-serif',
                  flex: 1,
                  textAlign: 'right',
                }}
              >
                השקעות וצמיחה פיננסית
              </span>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: '2px solid #1D1D1F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Rocket style={{ width: '20px', height: '20px', color: '#1D1D1F', strokeWidth: 1.5 }} />
                  </div>
                </div>

                {/* Feature 3 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                flexDirection: 'row-reverse', // Icon on right, text on left
              }}
            >

              <span
                style={{
                  fontSize: '16px',
                  color: '#1D1D1F',
                  fontWeight: 500,
                  fontFamily: 'var(--font-heebo), sans-serif',
                  flex: 1,
                  textAlign: 'right',
                }}
              >
                שקיפות ותמונת מצב מלאה של ההון העצמי שלך
              </span>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: '2px solid #1D1D1F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Eye style={{ width: '20px', height: '20px', color: '#1D1D1F', strokeWidth: 1.5 }} />
              </div>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={() => signIn('google', { callbackUrl })}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              background: '#2B4699',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: 'var(--font-heebo), sans-serif',
              boxShadow: '0 4px 12px rgba(43, 70, 153, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1f3a7a';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(43, 70, 153, 0.4)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2B4699';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(43, 70, 153, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>התחל עכשיו עם Google</span>
            <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </button>

          {/* Legal Disclaimer & Privacy */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            {/* Terms of Service Agreement */}
            <p
              style={{
                fontSize: '13px',
                color: '#86868b',
                lineHeight: 1.6,
                marginBottom: '12px',
                fontFamily: 'var(--font-heebo), sans-serif',
              }}
            >
              בהתחברות, את/ה מסכימ/ה ל
              <button
                onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}
                style={{
                  color: '#2B4699',
                  textDecoration: 'none',
                  fontWeight: 600,
                  marginRight: '4px',
                  marginLeft: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '13px',
                  fontFamily: 'var(--font-heebo), sans-serif',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                תנאי השימוש
              </button>
              ול
              <button
                onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
                style={{
                  color: '#2B4699',
                  textDecoration: 'none',
                  fontWeight: 600,
                  marginRight: '4px',
                  marginLeft: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '13px',
                  fontFamily: 'var(--font-heebo), sans-serif',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                מדיניות הפרטיות
              </button>
              שלנו.
            </p>

            {/* Security & Privacy Reassurance */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {/* Lock Icon */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#86868b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>

              {/* Privacy Text */}
              <span
                style={{
                  fontSize: '12px',
                  color: '#86868b',
                  fontWeight: 500,
                  fontFamily: 'var(--font-heebo), sans-serif',
                }}
              >
                המידע שלך מאובטח ומוצפן מקצה לקצה
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          h2 {
            font-size: 24px !important;
          }

          div[style*='maxWidth: \\'480px\\''] {
            padding: 32px !important;
          }

          h1 {
            font-size: 22px !important;
          }

          span[style*='fontSize: \\'16px\\''] {
            font-size: 15px !important;
          }

          div[style*='width: \\'40px\\''] {
            width: 36px !important;
            height: 36px !important;
          }

          button {
            padding: 14px 20px !important;
          }
        }

        @media (max-width: 640px) {
          h2 {
            font-size: 20px !important;
            margin-bottom: 32px !important;
          }

          div[style*='backdropFilter'] {
            backdrop-filter: blur(15px) !important;
            -webkit-backdrop-filter: blur(15px) !important;
          }
        }
      `}</style>

      {/* Legal Modal */}
      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
        type={legalModal.type}
      />
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
            background: 'linear-gradient(180deg, #0a1628 0%, #0f1b2e 50%, #1a2332 100%)',
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
