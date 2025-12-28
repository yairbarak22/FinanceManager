'use client';

import FeeCalculator from './FeeCalculator';
import InvestmentStepper from './InvestmentStepper';
import { Sparkles } from 'lucide-react';

interface Props {
  onDeclare: () => void;
}

export default function InvestmentOnboarding({ onDeclare }: Props) {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-8 h-8" />
          <h2 className="text-2xl md:text-3xl font-bold">
            המסע להשקעה עצמאית החכמה
          </h2>
        </div>
        <p className="text-lg text-white/90">
          חסוך אלפי שקלים בעמלות והשג שליטה מלאה על ההשקעות שלך
        </p>
      </div>

      {/* מחשבון עמלות */}
      <FeeCalculator />

      {/* מדריך 3 שלבים */}
      <InvestmentStepper />

      {/* הצהרה */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="text-center">
          <p className="text-slate-600 mb-4">כבר יש לך חשבון השקעות עצמאי?</p>
          <button
            onClick={onDeclare}
            className="btn-secondary"
          >
            כבר יש לי תיק השקעות עצמאי
          </button>
          <p className="text-xs text-slate-500 mt-2">
            לחיצה על הכפתור תעביר אותך לדאשבורד ניהול ההשקעות
          </p>
        </div>
      </div>
    </div>
  );
}
