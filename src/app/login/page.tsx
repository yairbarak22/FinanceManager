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
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #162447 50%, #1f4068 100%)' }}
    >
      {/* Sparkle Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large sparkle bottom-right */}
        <div 
          className="absolute bottom-20 left-20 w-6 h-6"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(99,102,241,0.6) 30%, transparent 70%)',
            boxShadow: '0 0 20px rgba(99,102,241,0.5), 0 0 40px rgba(99,102,241,0.3)',
          }}
        />
        {/* Medium sparkles */}
        <div 
          className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full"
          style={{ background: 'white', boxShadow: '0 0 10px rgba(255,255,255,0.8)' }}
        />
        <div 
          className="absolute top-1/2 left-16 w-1.5 h-1.5 rounded-full"
          style={{ background: 'white', boxShadow: '0 0 8px rgba(255,255,255,0.6)' }}
        />
        <div 
          className="absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full"
          style={{ background: 'white', boxShadow: '0 0 6px rgba(255,255,255,0.5)' }}
        />
        {/* Gradient glow in corner */}
        <div 
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)' }}
        />
        <div 
          className="absolute top-1/4 left-0 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 60%)' }}
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          
          {/* Left Column: White Card */}
          <div className="w-full lg:w-[480px] order-1">
            <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10">
              
              {/* Logo */}
              <div className="flex items-center justify-center gap-1 mb-6">
                <span className="text-3xl font-black text-[#1a365d] tracking-tight">NET</span>
                <div className="relative flex items-center">
                  <PieChart className="w-7 h-7 text-[#1a365d]" />
                  <TrendingUp className="w-5 h-5 text-emerald-500 absolute -top-1 -right-2" />
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-2xl font-bold text-[#1a365d] text-center mb-8">
                בונים הון, לא רק משכורת.
              </h1>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-center">
                  <p className="text-red-600 text-sm font-medium">
                    {error === 'OAuthAccountNotLinked'
                      ? 'כתובת האימייל כבר קיימת במערכת עם ספק אחר'
                      : 'שגיאה בהתחברות. נסה שוב.'}
                  </p>
                </div>
              )}

              {/* Feature List */}
              <div className="space-y-4 mb-8">
                {/* Feature 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Medal className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-[#374151] text-sm leading-relaxed pt-2">
                    <span className="font-bold text-[#1a365d]">תמקסם את הזכויות:</span>{' '}
                    המערכת תסרוק ותדרוש עבורך כל הטבה – ממילואים ועד נקודות זיכוי לסטודנטים.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-5 h-5 text-indigo-500" />
                  </div>
                  <p className="text-[#374151] text-sm leading-relaxed pt-2">
                    <span className="font-bold text-[#1a365d]">תשקיע חכם:</span>{' '}
                    הופכים את הכסף הפנוי הראשון שלך למנוע צמיחה, במקום שיישחק בעו&quot;ש.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-[#374151] text-sm leading-relaxed pt-2">
                    <span className="font-bold text-[#1a365d]">תראה הכל:</span>{' '}
                    תמונת מצב מלאה של העושר שלך, ברגע אחד, בלי אקסלים מסובכים.
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => signIn('google', { callbackUrl })}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#FFFFFF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FFFFFF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#FFFFFF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>לפרוץ את תקרת הזכוכית</span>
              </button>
            </div>
          </div>

          {/* Right Column: Dark Section Text */}
          <div className="flex-1 order-2 text-center lg:text-right px-4 lg:px-0">
            {/* Main Headline */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              אתה עושה הכל &apos;נכון&apos;.
              <br />
              <span className="text-[#60a5fa]">אז למה אתה עדיין לא שם?</span>
            </h2>

            {/* Sub-headline */}
            <p className="text-base md:text-lg text-[#94a3b8] leading-relaxed max-w-xl mx-auto lg:mx-0">
              צבא, מילואים, תואר, קריירה. המסלול הישראלי הקלאסי כבר לא מבטיח דירה או עושר. כדי לנצח את השיטה ב-2025, אתה צריך מערכת הפעלה אחרת לכסף שלך.
            </p>
          </div>

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
          style={{ background: 'linear-gradient(135deg, #0a1628 0%, #162447 50%, #1f4068 100%)' }}
        >
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
