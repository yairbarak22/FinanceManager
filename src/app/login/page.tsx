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
    <div className="min-h-screen flex flex-col lg:flex-row" dir="rtl">
      {/* Right Side - Marketing (Blue Gradient) */}
      <div className="flex-1 bg-gradient-to-bl from-blue-500 via-blue-600 to-indigo-700 p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-xl mx-auto lg:mx-0">
          {/* Hero Section */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            הכסף שלך.{' '}
            <span className="text-cyan-300">בשליטה מלאה.</span>
          </h1>
          
          <p className="text-lg text-blue-100 leading-relaxed mb-10">
            כל הנכסים, ההתחייבויות וההשקעות שלך במקום אחד. המערכת שתעזור לך להבין את השווי האמיתי שלך ולנהל כסף בחוכמה – בפשטות וללא עלות.
          </p>

          {/* Feature Pillars */}
          <div className="space-y-6">
            <FeatureItem 
              icon={<Wallet className="w-6 h-6" />}
              title="שליטה בתזרים"
              description="ניתוח הוצאות אוטומטי וניהול תקציב חכם. לדעת בדיוק לאן הכסף הולך."
            />
            <FeatureItem 
              icon={<PieChart className="w-6 h-6" />}
              title="תמונת מצב פיננסית"
              description="ריכוז פנסיה, דירה, הלוואות וחסכונות. רואים את התמונה השלמה."
            />
            <FeatureItem 
              icon={<TrendingUp className="w-6 h-6" />}
              title="ניהול השקעות"
              description="כלים לאיזון התיק וקבלת החלטות מושכלות, כדי שהכסף יעבוד בשבילך."
            />
          </div>
        </div>
      </div>

      {/* Left Side - Login Form (White) */}
      <div className="w-full lg:w-[420px] bg-white p-8 lg:p-12 flex flex-col justify-center min-h-[400px] lg:min-h-screen">
        <div className="max-w-sm mx-auto w-full">
          {/* Brand */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <Image
                src="/logo.svg"
                alt="פלוס"
                width={80}
                height={80}
                className="drop-shadow-lg"
                priority
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">פלוס</h2>
            <p className="text-gray-500 text-sm">להוציא את המקסימום מהכסף שלך</p>
          </div>

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
            className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 group shadow-sm"
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
              כניסה למערכת עם Google
            </span>
          </button>

          {/* Trust Microcopy */}
          <div className="mt-6 flex items-center justify-center gap-3 text-xs text-gray-400">
            <span>השימוש בחינם</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span>פרטיות מלאה</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span>ללא דמי מנוי</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white">
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
        <p className="text-blue-100/80 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-blue-500 via-blue-600 to-indigo-700">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
