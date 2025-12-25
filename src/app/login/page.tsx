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
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
      }}
    >
      {/* Tech Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Ambient Glow Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)' }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 60%)' }}
        />
      </div>

      {/* Main Container - Split Screen */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - White Card Area */}
        <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-6 lg:p-12">
          <div 
            className="w-full max-w-md bg-white rounded-3xl p-8 lg:p-10"
            style={{
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-4xl font-black text-slate-800 tracking-tight">NET</span>
              <div className="relative flex items-center">
                <PieChart className="w-9 h-9 text-slate-800" strokeWidth={2.5} />
                <TrendingUp className="w-5 h-5 text-emerald-500 absolute -top-1 -right-2" strokeWidth={3} />
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 text-center mb-10">
              בונים הון, לא רק משכורת.
            </h1>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                <p className="text-red-600 text-sm font-medium">
                  {error === 'OAuthAccountNotLinked'
                    ? 'כתובת האימייל כבר קיימת במערכת עם ספק אחר'
                    : 'שגיאה בהתחברות. נסה שוב.'}
                </p>
              </div>
            )}

            {/* Feature List */}
            <div className="space-y-6 mb-10">
              {/* Feature 1 */}
              <div className="flex items-start gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#EEF2FF' }}
                >
                  <Medal className="w-7 h-7" style={{ color: '#6366F1' }} />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-base text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800">תמקסם את הזכויות:</span>{' '}
                    המערכת תסרוק ותדרוש עבורך כל הטבה – ממילואים ועד נקודות זיכוי לסטודנטים.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#EEF2FF' }}
                >
                  <Rocket className="w-7 h-7" style={{ color: '#6366F1' }} />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-base text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800">תשקיע חכם:</span>{' '}
                    הופכים את הכסף הפנוי הראשון שלך למנוע צמיחה, במקום שיישחק בעו&quot;ש.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#EEF2FF' }}
                >
                  <Eye className="w-7 h-7" style={{ color: '#6366F1' }} />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-base text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800">תראה הכל:</span>{' '}
                    תמונת מצב מלאה של העושר שלך, ברגע אחד, בלי אקסלים מסובכים.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => signIn('google', { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{ 
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #7C3AED 100%)',
                boxShadow: '0 10px 40px -10px rgba(99,102,241,0.6)',
              }}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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
        <div className="hidden lg:flex w-1/2 min-h-screen items-center justify-center p-12">
          <div className="max-w-lg text-right">
            {/* Main Headline */}
            <h2 className="text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-8">
              אתה עושה הכל &apos;נכון&apos;.
              <br />
              <span className="text-white">אז למה אתה עדיין לא שם?</span>
            </h2>

            {/* Sub-headline */}
            <p className="text-xl text-slate-300 leading-relaxed">
              צבא, מילואים, תואר, קריירה. המסלול הישראלי הקלאסי כבר לא מבטיח דירה או עושר. כדי לנצח את השיטה ב-2025, אתה צריך מערכת הפעלה אחרת לכסף שלך.
            </p>
          </div>
        </div>

        {/* Mobile: Dark Content Below Card */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-6 text-center" style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, transparent 100%)' }}>
          <p className="text-base text-slate-300 leading-relaxed">
            המסלול הישראלי כבר לא מבטיח עושר.<br />
            <span className="text-white font-semibold">צריך מערכת הפעלה אחרת לכסף.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div 
          className="min-h-screen flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)' }}
        >
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
