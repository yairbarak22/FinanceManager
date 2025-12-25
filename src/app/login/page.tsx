'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Medal, Rocket, Eye, TrendingUp } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const features = [
    {
      icon: Medal,
      title: 'תמקסם את הזכויות',
      description: 'המערכת תסרוק ותדרוש עבורך כל הטבה – ממילואים ועד נקודות זיכוי לסטודנטים.',
      color: 'text-amber-500',
      bg: 'bg-amber-100',
    },
    {
      icon: Rocket,
      title: 'תשקיע חכם',
      description: 'הופכים את הכסף הפנוי הראשון שלך למנוע צמיחה, במקום שיישחק בעו"ש.',
      color: 'text-indigo-500',
      bg: 'bg-indigo-100',
    },
    {
      icon: Eye,
      title: 'תראה הכל',
      description: 'תמונת מצב מלאה של העושר שלך, ברגע אחד, בלי אקסלים מסובכים.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-100',
    },
  ];

  return (
    <div 
      dir="rtl" 
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)' }}
    >
      {/* Tech Pattern Overlay - very subtle */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
      
      {/* Decorative Gradient Orbs */}
      <div 
        className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />
      <div 
        className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)', filter: 'blur(50px)' }}
      />

      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: White Card */}
          <div className="order-1 lg:order-1">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 lg:p-12 relative">
              {/* Subtle gradient border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 pointer-events-none" />
              
              <div className="relative z-10">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-[#1E293B]">NETO</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {/* Headline */}
                <h1 className="text-2xl md:text-3xl font-bold text-[#1E293B] text-center mb-8 leading-tight">
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
                <div className="space-y-5 mb-8">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${feature.color}`} />
                        </div>
                        <div className="flex-1 pt-1">
                          <h3 className="font-bold text-[#1E293B] mb-1">{feature.title}</h3>
                          <p className="text-sm text-[#475569] leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => signIn('google', { callbackUrl })}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all duration-300 group"
                >
                  {/* Google Logo */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#FFFFFF"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#FFFFFF"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FFFFFF"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#FFFFFF"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-lg">לפרוץ את תקרת הזכוכית</span>
                </button>

                {/* Trust Microcopy */}
                <p className="text-center text-xs text-[#94A3B8] mt-4">
                  חינם לחלוטין • פרטיות מלאה • ללא דמי מנוי
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Dark Section */}
          <div className="order-2 lg:order-2 text-center lg:text-right px-4 lg:px-8 py-8 lg:py-0">
            {/* Main Headline */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              <span className="block">אתה עושה הכל &apos;נכון&apos;.</span>
              <span className="block mt-2 bg-gradient-to-l from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                אז למה אתה עדיין לא שם?
              </span>
            </h2>

            {/* Sub-headline */}
            <p className="text-lg md:text-xl text-[#CBD5E1] leading-relaxed max-w-lg mx-auto lg:mx-0 lg:mr-0">
              צבא, מילואים, תואר, קריירה. המסלול הישראלי הקלאסי כבר לא מבטיח דירה או עושר. 
              <span className="block mt-3 text-white font-medium">
                כדי לנצח את השיטה ב-2025, אתה צריך מערכת הפעלה אחרת לכסף שלך.
              </span>
            </p>

            {/* Stats or Social Proof (optional decorative element) */}
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-8">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">1,500+</p>
                <p className="text-sm text-[#94A3B8]">משתמשים פעילים</p>
              </div>
              <div className="w-px h-12 bg-slate-700" />
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-emerald-400">₪2.5M+</p>
                <p className="text-sm text-[#94A3B8]">נכסים במעקב</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-slate-600">
          NETO © {new Date().getFullYear()}
        </p>
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
          style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)' }}
        >
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
