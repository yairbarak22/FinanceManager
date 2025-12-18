'use client';

import { useState } from 'react';
import { 
  Wallet, 
  User, 
  Building2, 
  CreditCard, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
  onOpenProfile: () => void;
}

const TOTAL_STEPS = 5;

export default function OnboardingWizard({ onComplete, onOpenProfile }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleFillProfile = () => {
    onOpenProfile();
    nextStep();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-purple-900/80 backdrop-blur-sm" />
      
      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Skip button */}
        <button
          onClick={onComplete}
          className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-10"
          title="דלג"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 pt-12">
          {step === 0 && <StepWelcome />}
          {step === 1 && <StepProfile />}
          {step === 2 && <StepAssets />}
          {step === 3 && <StepTransactions />}
          {step === 4 && <StepReady />}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step 
                    ? 'w-8 bg-pink-500' 
                    : i < step 
                      ? 'w-2 bg-pink-300' 
                      : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {step > 0 && step < TOTAL_STEPS - 1 && (
              <button
                onClick={prevStep}
                className="flex items-center justify-center gap-2 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                הקודם
              </button>
            )}
            
            {step === 1 ? (
              // Profile step - two buttons
              <div className="flex-1 flex gap-3">
                <button
                  onClick={nextStep}
                  className="flex-1 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  אולי אחר כך
                </button>
                <button
                  onClick={handleFillProfile}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 transition-all"
                >
                  מלא עכשיו
                </button>
              </div>
            ) : (
              // Other steps - single next button
              <button
                onClick={nextStep}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 transition-all"
              >
                {step === TOTAL_STEPS - 1 ? 'קדימה לעבודה!' : 'הבא'}
                {step < TOTAL_STEPS - 1 && <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components

function StepWelcome() {
  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl flex items-center justify-center">
        <Wallet className="w-10 h-10 text-pink-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        הכסף שלך. התמונה המלאה.
      </h2>
      <div className="text-gray-600 space-y-3 mt-6 text-right">
        <p>
          Finance Manager מרכז את כל המידע הפיננסי שלך במקום אחד.
        </p>
        <p>
          תראה בדיוק לאן הולך הכסף, כמה שווים הנכסים שלך, ומה נשאר בסוף החודש.
        </p>
        <p>
          המערכת תזהה הזדמנויות לחיסכון ותציע המלצות שיעזרו לך לבנות עושר לאורך זמן.
        </p>
      </div>
    </div>
  );
}

function StepProfile() {
  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center">
        <User className="w-10 h-10 text-blue-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        נעים להכיר
      </h2>
      <div className="text-gray-600 space-y-3 mt-6 text-right">
        <p>
          כדי שנוכל להתאים לך המלצות רלוונטיות, נשמח לדעת קצת יותר.
        </p>
        <p>
          זה לוקח פחות מדקה ויעזור לנו למצוא:
        </p>
        <ul className="space-y-2 pr-4">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
            הטבות מס שמגיעות לך
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
            אפשרויות חיסכון מותאמות
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
            המלצות השקעה לפי המצב שלך
          </li>
        </ul>
      </div>
    </div>
  );
}

function StepAssets() {
  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center">
        <Building2 className="w-10 h-10 text-emerald-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        מה יש לך? מה אתה חייב?
      </h2>
      <div className="text-gray-600 space-y-3 mt-6 text-right">
        <div className="flex gap-6 justify-center text-sm mb-4">
          <div className="bg-emerald-50 px-4 py-2 rounded-lg">
            <span className="font-medium text-emerald-700">נכסים</span>
            <span className="text-emerald-600"> – דירה, חסכונות, פנסיה</span>
          </div>
          <div className="bg-red-50 px-4 py-2 rounded-lg">
            <span className="font-medium text-red-700">התחייבויות</span>
            <span className="text-red-600"> – משכנתא, הלוואות</span>
          </div>
        </div>
        <p>
          הזן פעם אחת את הפרטים. פעם בחודש – עדכן את השווי.
        </p>
        <p>
          ככה תוכל לעקוב אחרי השווי הנקי שלך ולראות איך הוא גדל.
        </p>
      </div>
    </div>
  );
}

function StepTransactions() {
  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center">
        <CreditCard className="w-10 h-10 text-amber-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        לאן הולך הכסף?
      </h2>
      <div className="text-gray-600 space-y-3 mt-6 text-right">
        <p>
          פעם בחודש, העלה קובץ עם פירוט האשראי שלך.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 text-sm">
          <p className="font-medium text-gray-700 mb-2">איך עושים את זה:</p>
          <ol className="space-y-1.5 text-gray-600">
            <li>1. הורד דוח עסקאות מהבנק או מחברת האשראי</li>
            <li>2. לחץ על &quot;ייבוא עסקאות&quot;</li>
            <li>3. המערכת תעשה את השאר</li>
          </ol>
        </div>
        <p>
          תוך שניות תקבל פירוט לפי קטגוריות וגרפים שמראים את התמונה המלאה.
        </p>
      </div>
    </div>
  );
}

function StepReady() {
  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-pink-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        אתה בפנים! 🎉
      </h2>
      <div className="text-gray-600 space-y-3 mt-6 text-right">
        <p>
          עכשיו אתה יכול להתחיל.
        </p>
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4">
          <p className="font-medium text-gray-700 mb-3">הצעדים הראשונים:</p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
              הוסף נכס או התחייבות ראשונים
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
              העלה קובץ עסקאות
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
              גלה לאן הולך הכסף
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

