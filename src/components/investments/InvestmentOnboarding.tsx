'use client';

import { TrendingUp, ArrowLeft } from 'lucide-react';
import MentalModelComparison from './MentalModelComparison';
import JourneyStepper from './JourneyStepper';

interface Props {
  onDeclare: () => void;
}

/**
 * Investment Onboarding Component
 *
 * Design Psychology (Cognitive Load Theory):
 * - Visceral Level: Clean, Apple High-Tech aesthetic creates trust
 * - Behavioral Level: Clear progression reduces decision anxiety
 * - Reflective Level: Empowerment messaging shifts from "loss" to "growth"
 *
 * Visual Hierarchy:
 * 1. Hero headline - Instant value proposition
 * 2. Mental Model Comparison - The "aha" moment
 * 3. Journey Stepper - Clear path forward
 * 4. Existing Account CTA - Secondary action
 */

export default function InvestmentOnboarding({ onDeclare }: Props) {
  return (
    <div className="min-h-full bg-slate-50">
      {/* Apple-style Hero - Minimalist with High Contrast Typography */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 text-center">
          {/* Icon Badge */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl mb-6">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
          </div>

          {/* Headline - High Contrast */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            הדרך להשקעה עצמאית
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            קח שליטה מלאה על הכסף שלך. ללא עמלות ניהול,
            עם נזילות מלאה ושליטה על ההשקעות שלך.
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Mental Model Comparison - The "Aha" Moment */}
        <MentalModelComparison />

        {/* Journey Stepper - Clear Path */}
        <JourneyStepper />

        {/* Secondary CTA - Existing Account */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-medium text-slate-700">כבר יש לך חשבון השקעות עצמאי?</p>
              <p className="text-sm text-slate-500">עבור לדאשבורד ניהול התיק שלך</p>
            </div>
            <button
              onClick={onDeclare}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                       text-slate-600 bg-slate-100 rounded-xl
                       hover:bg-slate-200 active:scale-[0.98] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              יש לי חשבון
            </button>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="max-w-3xl mx-auto px-4 pb-12 text-center">
        <p className="text-xs text-slate-400">
          המידע מוצג למטרות חינוכיות בלבד ואינו מהווה ייעוץ השקעות.
          ביצועי עבר אינם מבטיחים תשואות עתידיות.
        </p>
      </div>
    </div>
  );
}
