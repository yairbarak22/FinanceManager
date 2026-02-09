'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect, useRef } from 'react';
import { Medal, Rocket, Eye, PieChart } from 'lucide-react';
import LegalModal from '@/components/modals/LegalModal';
import { trackMixpanelEvent, onMixpanelReady } from '@/lib/mixpanel';

// Cookie name for signup source tracking
const SIGNUP_SOURCE_COOKIE = 'signup_source';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // Capture signup source from URL and store in cookie
  useEffect(() => {
    try {
      const source = searchParams.get('source') || searchParams.get('utm_source');
      if (source) {
        // Set cookie with 7 days expiry using max-age (more reliable than expires)
        const maxAge = 60 * 60 * 24 * 7; // 7 days in seconds
        document.cookie = `${SIGNUP_SOURCE_COOKIE}=${encodeURIComponent(source)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      }
    } catch (error) {
      // Silently ignore cookie errors (can happen in some browser contexts)
      console.debug('[Login] Could not set signup source cookie:', error);
    }
  }, [searchParams]);

  // Track "Login Page Viewed" event once
  const hasTrackedRef = useRef(false);
  useEffect(() => {
    if (hasTrackedRef.current) return;
    hasTrackedRef.current = true;

    const source = searchParams.get('source') || undefined;
    const utmSource = searchParams.get('utm_source') || undefined;

    onMixpanelReady(() => {
      trackMixpanelEvent('Login Page Viewed', {
        has_error: !!error,
        callback_url: callbackUrl,
        ...(source && { source }),
        ...(utmSource && { utm_source: utmSource }),
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect Haredi user (source=prog) from URL params or cookie
  const isHarediUser = (() => {
    const source = searchParams.get('source');
    const utmSource = searchParams.get('utm_source');
    if (source === 'prog' || utmSource === 'prog') return true;
    if (typeof document !== 'undefined') {
      const cookie = document.cookie.split(';').find(c => c.trim().startsWith('signup_source='));
      if (cookie && cookie.includes('prog')) return true;
    }
    return false;
  })();

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
      {/* Ambient Glow Effects */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '-9.375rem',
            right: '-9.375rem',
            width: '31.25rem',
            height: '31.25rem',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-9.375rem',
            left: '-9.375rem',
            width: '37.5rem',
            height: '37.5rem',
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
          padding: 'clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 1.5rem)',
        }}
      >
        {/* Hero Headline */}
        <h2
          style={{
            fontSize: 'clamp(1.25rem, 4vw, 2rem)',
            fontWeight: 500,
            color: '#1D1D1F',
            textAlign: 'center',
            marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontFamily: 'var(--font-heebo)',
            lineHeight: 1.4,
            wordBreak: 'keep-all',
            overflowWrap: 'break-word',
            maxWidth: '100%',
            padding: '0 0.5rem',
          }}
        >
          {isHarediUser
            ? 'לאן הכסף הולך — ואיך גורמים לו לעבוד בשבילכם.'
            : 'העתיד הכלכלי שלך מתחיל כאן.'}
        </h2>

        {/* Glassmorphism Card */}
        <div
          style={{
            maxWidth: 'min(30rem, 92vw)',
            width: '100%',
            padding: 'clamp(1.5rem, 5vw, 3rem)',
            borderRadius: 'clamp(1.5rem, 4vw, 2rem)',
            direction: 'rtl',

            // Glassmorphism Effect - Frosted glass on warm background
            background: 'rgba(255, 255, 255, 0.50)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',

            // Border & Shadow - Rim light effect
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 1.25rem 2.5rem -0.625rem rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Logo - NETO */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0',
              marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
            }}
          >
            <PieChart
              style={{
                width: 'clamp(2.5rem, 6vw, 3.125rem)',
                height: 'clamp(2.5rem, 6vw, 3.125rem)',
                color: '#2B4699',
                marginTop: '0',
                marginLeft: '-0.125rem',
              }}
              strokeWidth={3}
            />
            <span
              style={{
                fontSize: 'clamp(2.5rem, 7vw, 3rem)',
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
              fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
              fontWeight: 600,
              color: '#1D1D1F',
              textAlign: 'center',
              marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
              lineHeight: 1.4,
              fontFamily: 'var(--font-heebo), sans-serif',
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
            }}
          >
            {isHarediUser ? '3 צעדים פשוטים, ומתחילים לעשות סדר' : 'ניהול הון חכם'}
          </h1>

          {/* Error Message */}
          {error && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                backgroundColor: 'rgba(254, 242, 242, 0.9)',
                border: '1px solid rgba(254, 202, 202, 0.9)',
                borderRadius: '1rem',
                textAlign: 'center',
              }}
            >
              <p style={{ 
                color: '#DC2626', 
                fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)', 
                fontWeight: 500, 
                fontFamily: 'var(--font-heebo)',
                lineHeight: 1.5,
                wordBreak: 'keep-all',
                overflowWrap: 'break-word',
              }}>
                {error === 'OAuthAccountNotLinked'
                  ? 'כתובת האימייל כבר קיימת במערכת עם ספק אחר'
                  : 'שגיאה בהתחברות. נסה שוב.'}
              </p>
            </div>
          )}

          {/* Features List */}
          <div style={{ marginBottom: 'clamp(1.5rem, 4vw, 2rem)' }}>
            {/* Feature 1 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(0.625rem, 2vw, 0.75rem)',
                marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
                flexDirection: 'row-reverse',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  color: '#1D1D1F',
                  fontWeight: 500,
                  fontFamily: 'var(--font-heebo), sans-serif',
                  flex: 1,
                  minWidth: 0,
                  textAlign: 'right',
                  lineHeight: 1.5,
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word',
                }}
              >
                {isHarediUser
                  ? 'עושים סדר במספרים: הכנסות, הוצאות, נכסים והתחייבויות'
                  : 'מיפוי המצב הפיננסי המשפחתי שלך'}
              </span>
              <div
                style={{
                  width: 'clamp(2.25rem, 5vw, 2.5rem)',
                  height: 'clamp(2.25rem, 5vw, 2.5rem)',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: '2px solid #1D1D1F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Medal style={{ width: '1.25rem', height: '1.25rem', color: '#1D1D1F', strokeWidth: 1.5 }} />
              </div>
            </div>

            {/* Feature 2 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(0.625rem, 2vw, 0.75rem)',
                marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
                flexDirection: 'row-reverse',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  color: '#1D1D1F',
                  fontWeight: 500,
                  fontFamily: 'var(--font-heebo), sans-serif',
                  flex: 1,
                  minWidth: 0,
                  textAlign: 'right',
                  lineHeight: 1.5,
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word',
                }}
              >
                {isHarediUser
                  ? 'מגדירים מטרה אחת ברורה (חתונה, דירה, חיסכון לילדים)'
                  : 'הגדרת יעדים ברורים ומסודרים'}
              </span>
              <div
                style={{
                  width: 'clamp(2.25rem, 5vw, 2.5rem)',
                  height: 'clamp(2.25rem, 5vw, 2.5rem)',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: '2px solid #1D1D1F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Rocket style={{ width: '1.25rem', height: '1.25rem', color: '#1D1D1F', strokeWidth: 1.5 }} />
              </div>
            </div>

            {/* Feature 3 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(0.625rem, 2vw, 0.75rem)',
                marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
                flexDirection: 'row-reverse',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  color: '#1D1D1F',
                  fontWeight: 500,
                  fontFamily: 'var(--font-heebo), sans-serif',
                  flex: 1,
                  minWidth: 0,
                  textAlign: 'right',
                  lineHeight: 1.5,
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word',
                }}
              >
                {isHarediUser
                  ? 'מקבלים תכנית חודשית: כמה לשים בצד, ומה האפשרויות להשקעה'
                  : 'ניתוח התזרים ואפשרויות ההשקעה'}
              </span>
              <div
                style={{
                  width: 'clamp(2.25rem, 5vw, 2.5rem)',
                  height: 'clamp(2.25rem, 5vw, 2.5rem)',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: '2px solid #1D1D1F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Eye style={{ width: '1.25rem', height: '1.25rem', color: '#1D1D1F', strokeWidth: 1.5 }} />
              </div>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={() => signIn('google', { callbackUrl })}
            style={{
              width: '100%',
              padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
              borderRadius: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              background: '#2B4699',
              color: 'white',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              fontWeight: 600,
              fontFamily: 'var(--font-heebo), sans-serif',
              boxShadow: '0 0.25rem 0.75rem rgba(43, 70, 153, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(0.5rem, 2vw, 0.75rem)',
              lineHeight: 1.4,
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1f3a7a';
              e.currentTarget.style.boxShadow = '0 0.375rem 1rem rgba(43, 70, 153, 0.4)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2B4699';
              e.currentTarget.style.boxShadow = '0 0.25rem 0.75rem rgba(43, 70, 153, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>{isHarediUser ? 'להתחיל בחינם עם Google' : 'התחל עכשיו עם Google'}</span>
            <svg style={{ width: 'clamp(1.25rem, 3vw, 1.5rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)', flexShrink: 0 }} viewBox="0 0 24 24">
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

          {/* Micro-copy for Haredi users */}
          {isHarediUser && (
            <p
              style={{
                textAlign: 'center',
                fontSize: 'clamp(0.75rem, 2vw, 0.8125rem)',
                color: '#86868b',
                marginTop: '0.75rem',
                fontFamily: 'var(--font-heebo), sans-serif',
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              לוקח 2-3 דקות. בלי כרטיס אשראי.
            </p>
          )}

          {/* Legal Disclaimer & Privacy */}
          <div style={{ marginTop: 'clamp(1rem, 3vw, 1.5rem)', textAlign: 'center' }}>
            {/* Terms of Service Agreement */}
            <p
              style={{
                fontSize: 'clamp(0.75rem, 2vw, 0.8125rem)',
                color: '#86868b',
                lineHeight: 1.6,
                marginBottom: '0.75rem',
                fontFamily: 'var(--font-heebo), sans-serif',
                wordBreak: 'keep-all',
                overflowWrap: 'break-word',
              }}
            >
              בהתחברות, את/ה מסכימ/ה ל
              <span
                onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}
                style={{
                  color: '#2B4699',
                  textDecoration: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  fontFamily: 'var(--font-heebo), sans-serif',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                תנאי השימוש
              </span>
              {' '}ול
              <span
                onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
                style={{
                  color: '#2B4699',
                  textDecoration: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  fontFamily: 'var(--font-heebo), sans-serif',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                מדיניות הפרטיות
              </span>
              {' '}שלנו.
            </p>

            {/* Security & Privacy Reassurance */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                flexWrap: 'wrap',
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
                style={{ flexShrink: 0 }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>

              {/* Privacy Text */}
              <span
                style={{
                  fontSize: 'clamp(0.6875rem, 1.8vw, 0.75rem)',
                  color: '#86868b',
                  fontWeight: 500,
                  fontFamily: 'var(--font-heebo), sans-serif',
                  lineHeight: 1.5,
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word',
                }}
              >
                המידע שלך מאובטח ומוצפן מקצה לקצה
              </span>
            </div>
          </div>
        </div>
      </div>

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
            background: 'linear-gradient(180deg, #F5F9FE 0%, #F0F6FD 50%, #CCE4F5 100%)',
          }}
        >
          <div
            style={{
              width: '3rem',
              height: '3rem',
              border: '0.25rem solid #2B4699',
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
