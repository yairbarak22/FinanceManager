'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Wallet, PieChart, TrendingUp } from 'lucide-react';
import Image from 'next/image';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <Image
              src="/icon.png"
              alt="פלוס"
              width={80}
              height={80}
              className="rounded-2xl shadow-lg"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">פלוס</h1>
          <h2 className="text-2xl text-gray-700 mb-4">
            הכסף שלך. <span className="text-pink-500">בשליטה מלאה.</span>
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            כל הנכסים, ההתחייבויות וההשקעות שלך במקום אחד.
            המערכת שתעזור לך להבין את השווי האמיתי שלך ולנהל כסף בחוכמה.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon={<Wallet className="w-6 h-6" />}
            title="שליטה בתזרים"
            description="ניתוח הוצאות אוטומטי, גרפים חודשיים, וניהול תקציב חכם. לדעת בדיוק לאן הכסף הולך."
          />
          <FeatureCard
            icon={<PieChart className="w-6 h-6" />}
            title="תמונת מצב פיננסית"
            description="מעקב נכסים, התחייבויות, ושווי נקי במקום אחד. לראות את התמונה השלמה."
          />
          <FeatureCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="ניהול השקעות"
            description="כלים לאיזון התיק, מעקב מניות, והמלצות פיזור. כדי שהכסף יעבוד בשבילך."
          />
        </div>

        {/* Login Card */}
        <div className="max-w-sm mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">
              התחבר והתחל לנהל
            </h3>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-center">
                <p className="text-red-600 text-sm">
                  {error === 'OAuthAccountNotLinked'
                    ? 'כתובת האימייל כבר קיימת במערכת עם ספק אחר'
                    : 'שגיאה בהתחברות. נסה שוב.'}
                </p>
              </div>
            )}

            {/* Login Button */}
            <button
              onClick={() => signIn('google', { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-pink-50/50 hover:border-pink-300 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span className="text-gray-700 font-medium group-hover:text-gray-900">
                התחבר עם Google
              </span>
            </button>

            {/* Trust Microcopy */}
            <p className="text-center text-xs text-gray-400 mt-6">
              חינם לחלוטין • פרטיות מלאה • ללא דמי מנוי
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-400 text-sm">
          פלוס © {new Date().getFullYear()} • להוציא את המקסימום מהכסף שלך
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
      <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-pink-500">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
