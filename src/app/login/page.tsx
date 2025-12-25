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
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#131B35] to-[#1E1B4B]"
    >
      {/* Tech Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Ambient Glow Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-right glow */}
        <div 
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 60%)' }}
        />
        {/* Bottom-left glow */}
        <div 
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 60%)' }}
        />
        {/* Center subtle glow */}
        <div 
          className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 50%)' }}
        />
        
        {/* Sparkle dots */}
        <div className="absolute top-[20%] left-[15%] w-1.5 h-1.5 rounded-full bg-white/60" style={{ boxShadow: '0 0 10px 2px rgba(255,255,255,0.4)' }} />
        <div className="absolute top-[40%] left-[8%] w-1 h-1 rounded-full bg-white/50" style={{ boxShadow: '0 0 8px 2px rgba(255,255,255,0.3)' }} />
        <div className="absolute bottom-[30%] left-[20%] w-2 h-2 rounded-full bg-indigo-400/60" style={{ boxShadow: '0 0 15px 3px rgba(99,102,241,0.4)' }} />
        <div className="absolute top-[60%] left-[5%] w-1 h-1 rounded-full bg-white/40" style={{ boxShadow: '0 0 6px 2px rgba(255,255,255,0.2)' }} />
      </div>

      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          
          {/* Left Column: White Card */}
          <div className="w-full lg:w-[520px] order-1">
            <div 
              className="bg-white rounded-3xl p-8 sm:p-10 lg:p-12"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1), 0 20px 40px -20px rgba(99,102,241,0.15)',
              }}
            >
              
              {/* Logo */}
              <div className="flex items-center justify-center gap-1.5 mb-8">
                <span className="text-4xl font-black text-[#1E293B] tracking-tight">NET</span>
                <div className="relative flex items-center">
                  <PieChart className="w-8 h-8 text-[#1E293B]" strokeWidth={2.5} />
                  <TrendingUp className="w-5 h-5 text-emerald-500 absolute -top-1.5 -right-2.5" strokeWidth={3} />
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-[1.7rem] font-bold text-[#1E293B] text-center mb-8 leading-tight">
                בונים הון, לא רק משכורת.
              </h1>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
                  <p className="text-red-600 text-sm font-medium">
                    {error === 'OAuthAccountNotLinked'
                      ? 'כתובת האימייל כבר קיימת במערכת עם ספק אחר'
                      : 'שגיאה בהתחברות. נסה שוב.'}
                  </p>
                </div>
              )}

              {/* Feature List */}
              <div className="space-y-5 mb-10">
                {/* Feature 1 */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Medal className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="pt-1">
                    <p className="text-[#475569] text-[15px] leading-relaxed">
                      <span className="font-bold text-[#1E293B]">תמקסם את הזכויות:</span>{' '}
                      המערכת תסרוק ותדרוש עבורך כל הטבה – ממילואים ועד נקודות זיכוי לסטודנטים.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="pt-1">
                    <p className="text-[#475569] text-[15px] leading-relaxed">
                      <span className="font-bold text-[#1E293B]">תשקיע חכם:</span>{' '}
                      הופכים את הכסף הפנוי הראשון שלך למנוע צמיחה, במקום שיישחק בעו&quot;ש.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Eye className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="pt-1">
                    <p className="text-[#475569] text-[15px] leading-relaxed">
                      <span className="font-bold text-[#1E293B]">תראה הכל:</span>{' '}
                      תמונת מצב מלאה של העושר שלך, ברגע אחד, בלי אקסלים מסובכים.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => signIn('google', { callbackUrl })}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] active:scale-[0.98]"
                style={{ 
                  background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #7C3AED 100%)',
                  boxShadow: '0 10px 30px -5px rgba(99,102,241,0.4), 0 4px 6px -2px rgba(99,102,241,0.2)',
                }}
              >
                {/* Google Logo - Colored */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>לפרוץ את תקרת הזכוכית</span>
              </button>
            </div>
          </div>

          {/* Right Column: Dark Section Text */}
          <div className="flex-1 order-2 text-center lg:text-right px-2 sm:px-4 lg:px-0 lg:pr-4">
            {/* Main Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-extrabold text-white leading-[1.2] mb-6">
              אתה עושה הכל &apos;נכון&apos;.
              <br />
              <span className="text-white">אז למה אתה עדיין לא שם?</span>
            </h2>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed max-w-xl mx-auto lg:mx-0 lg:mr-0">
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#131B35] to-[#1E1B4B]">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
